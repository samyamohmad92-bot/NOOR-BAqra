import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Mic, Square, CheckCircle2, XCircle, BookOpen, Star, Layers } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useGetProgress, useUpdateProgress } from "@workspace/api-client-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { Modal } from "@/components/ui/Modal";

export default function HashdPage() {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();

  if (!user) { setLocation("/"); return null; }

  const { data: progress, refetch } = useGetProgress(user.id);
  const updateProgressMut = useUpdateProgress();
  const { isRecording, recordingTime, audioUrl, startRecording, stopRecording, clearAudio } = useAudioRecorder();

  const [phase, setPhase] = useState<"intro" | "record" | "listen" | "done">("intro");
  const [showFailModal, setShowFailModal] = useState(false);

  const currentWajh = progress?.currentWajh || 1;
  // الحشد يشمل الـ 5 أوجه السابقة
  const hashdGroup = Math.ceil((currentWajh - 1) / 5);
  const startWajh = (hashdGroup - 1) * 5 + 1;
  const endWajh = hashdGroup * 5;

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleStartRecord = () => {
    setPhase("record");
    startRecording();
  };

  const handleStopRecord = () => {
    stopRecording();
    setPhase("listen");
  };

  const handleResult = async (passed: boolean) => {
    if (!passed) {
      clearAudio();
      setPhase("intro");
      setShowFailModal(true);
      return;
    }
    // نجح في الحشد — حفظ التقدم
    try {
      await updateProgressMut.mutateAsync({
        studentId: user.id,
        data: {
          hashdCompleted: (progress?.hashdCompleted || 0) + 1,
          totalStars: (progress?.totalStars || 0) + 10,
        }
      });
      await refetch();
      clearAudio();
      setPhase("done");
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-emerald-400 transition-colors font-medium text-sm px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>
        <h1 className="font-serif text-lg font-bold text-emerald-50 flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent" />
          مرحلة الحشد
        </h1>
        <div className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent font-bold text-sm">
          الأوجه {startWajh}–{endWajh}
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6">

        {/* Banner */}
        <div className="glass-panel rounded-3xl p-6 border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
              <Star className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-50 mb-1">مرحلة الحشد 🎖️</h2>
              <p className="text-emerald-100/70 text-sm leading-relaxed">
                لقد أتممت الأوجه من <strong className="text-accent">{startWajh}</strong> إلى <strong className="text-accent">{endWajh}</strong>. الحشد هو مرحلة المراجعة الشاملة حيث تتلو كل الأوجه الخمسة من الذاكرة دفعةً واحدة دون انقطاع.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-accent/80 font-medium">
                <Star className="w-3.5 h-3.5" />
                إتمام الحشد يمنحك <strong>10 نجوم</strong> إضافية
              </div>
            </div>
          </div>
        </div>

        {/* Wajhs Summary */}
        <div className="glass-panel rounded-3xl p-6 border-white/5">
          <h3 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            الأوجه المطلوب حشدها
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }, (_, i) => startWajh + i).map(wajh => (
              <div key={wajh} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-serif font-bold text-primary text-sm">
                  {wajh}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">الصفحة {wajh + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recording Area */}
        <div className="glass-panel p-6 rounded-3xl text-center border-white/5 relative overflow-hidden">

          {phase === "intro" && (
            <div className="py-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-emerald-50">استعد لتلاوة الأوجه الخمسة</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                  اتلُ الأوجه من {startWajh} إلى {endWajh} من الذاكرة كاملةً. لديك 10 دقائق.
                </p>
              </div>
              <button
                onClick={handleStartRecord}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-amber-600 shadow-xl shadow-accent/30 flex items-center justify-center mx-auto hover:scale-105 active:scale-95 transition-all"
              >
                <Mic className="w-10 h-10 text-white" />
              </button>
              <p className="text-xs text-muted-foreground">اضغط للبدء بالتسجيل</p>
            </div>
          )}

          {phase === "record" && (
            <div className="py-6 space-y-6">
              <div className="text-5xl font-serif font-bold text-accent tracking-widest">
                {formatTime(recordingTime)}
              </div>
              <div className="w-full max-w-md mx-auto h-2 bg-[#06100a] rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full transition-all duration-1000 rounded-full ${recordingTime > 540 ? 'bg-destructive' : recordingTime > 480 ? 'bg-amber-500' : 'bg-accent'}`}
                  style={{ width: `${Math.min((recordingTime / 600) * 100, 100)}%` }}
                />
              </div>
              <button
                onClick={handleStopRecord}
                className="w-20 h-20 rounded-full bg-destructive shadow-lg shadow-destructive/30 flex items-center justify-center mx-auto hover:scale-105 active:scale-95 transition-all animate-pulse"
              >
                <Square className="w-8 h-8 text-white fill-current" />
              </button>
              <p className="text-destructive font-bold text-sm">🔴 جاري التسجيل — اتلُ الأوجه {startWajh} إلى {endWajh}</p>
            </div>
          )}

          {phase === "listen" && (
            <div className="py-4 space-y-6 animate-in fade-in zoom-in duration-300">
              <h3 className="text-lg font-bold text-emerald-50">استمع لتلاوتك وقيّم حشدك بأمانة</h3>
              {audioUrl && (
                <audio src={audioUrl} controls className="w-full max-w-md mx-auto rounded-xl" />
              )}
              <p className="text-muted-foreground text-sm">هل أتممت الأوجه الخمسة من الذاكرة بشكل صحيح؟</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => handleResult(true)}
                  disabled={updateProgressMut.isPending}
                  className="w-full sm:w-52 py-4 rounded-xl font-bold bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  ✓ نعم، أتممته
                </button>
                <button
                  onClick={() => handleResult(false)}
                  disabled={updateProgressMut.isPending}
                  className="w-full sm:w-52 py-4 rounded-xl font-bold bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  ✗ لا، أحتاج مراجعة
                </button>
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="py-10 space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center mx-auto">
                <Star className="w-10 h-10 text-accent fill-current" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-emerald-50">مبروك! أتممت الحشد 🎉</h3>
                <p className="text-muted-foreground text-sm">حُسبت لك <strong className="text-accent">10 نجوم</strong> إضافية. واصل الحفظ المبارك!</p>
              </div>
              <button
                onClick={() => setLocation("/dashboard")}
                className="w-full max-w-xs mx-auto py-3.5 rounded-xl bg-gradient-to-r from-accent to-amber-600 text-white font-bold shadow-lg shadow-accent/25 hover:scale-[1.02] transition-all"
              >
                العودة للوحة التحكم →
              </button>
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={showFailModal}
        onClose={() => setShowFailModal(false)}
        title="تحتاج لمزيد من المراجعة"
        icon={<XCircle className="w-6 h-6 text-amber-400" />}
      >
        <div className="space-y-4 text-center">
          <p className="text-emerald-100/80 text-sm leading-loose">
            لا بأس، راجع الأوجه من {startWajh} إلى {endWajh} مرةً أخرى ثم أعد التسجيل.
          </p>
          <button
            onClick={() => setShowFailModal(false)}
            className="w-full py-3 rounded-xl bg-secondary text-emerald-50 font-bold hover:bg-secondary/70 transition-all"
          >
            إعادة المحاولة
          </button>
        </div>
      </Modal>
    </div>
  );
}
