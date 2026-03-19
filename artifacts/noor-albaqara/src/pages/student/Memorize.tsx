import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Mic, Square, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useGetProgress, useUpdateProgress } from "@workspace/api-client-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useQuranPage } from "@/hooks/use-quran-page";
import { Modal } from "@/components/ui/Modal";

export default function MemorizePage() {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();

  if (!user) { setLocation("/"); return null; }

  const { data: progress, refetch } = useGetProgress(user.id);
  const updateProgressMut = useUpdateProgress();

  const [phase, setPhase] = useState<"ready" | "record" | "listen">("ready");
  const [sessionAttempts, setSessionAttempts] = useState<boolean[]>([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);

  const { isRecording, recordingTime, audioUrl, startRecording, stopRecording, clearAudio } = useAudioRecorder();

  const currentWajh = progress?.currentWajh || 1;
  const correctCount = progress?.correctCount || 0;
  const currentSession = progress?.currentSession || 1;

  // صفحة المصحف = رقم الوجه + 1 (الوجه 1 → الصفحة 2)
  const pageNum = currentWajh + 1;
  const { ayahs, loading: pageLoading, error: pageError } = useQuranPage(pageNum);

  // إذا كان الطالب في وضع "انتظار المعلم" → أظهر نافذة التأكيد مباشرة
  useEffect(() => {
    if (progress?.waitingTeacher) {
      setShowTeacherModal(true);
    }
  }, [progress?.waitingTeacher]);

  // Auto-stop at 90 seconds
  useEffect(() => {
    if (isRecording && recordingTime >= 90) handleStopRecord();
  }, [recordingTime, isRecording]);

  // مستوى الإخفاء التدريجي
  let blurStyle: React.CSSProperties = {};
  let hintText = "📖 النص ظاهر — اقرأ وتأمّل";
  if (correctCount >= 5) {
    blurStyle = { filter: "blur(18px)", userSelect: "none", pointerEvents: "none", opacity: 0.4 };
    hintText = "🔒 مخفي كلياً — اقرأ من حفظك";
  } else if (correctCount >= 2) {
    blurStyle = { filter: "blur(5px)", userSelect: "none", pointerEvents: "none", opacity: 0.6 };
    hintText = "👁️ إخفاء جزئي — تذكّر ما حفظت";
  }

  const handleStartRecord = () => { setPhase("record"); startRecording(); };
  const handleStopRecord = () => { stopRecording(); setPhase("listen"); };

  const handleResult = async (isCorrect: boolean) => {
    const newAttempts = [...sessionAttempts, isCorrect];
    setSessionAttempts(newAttempts);

    let newCorrect = correctCount + (isCorrect ? 1 : 0);
    let newSession = currentSession;
    let newStars = (progress?.totalStars || 0) + (isCorrect ? 1 : 0);

    // ✅ أتمّ 8 مرات صحيحة
    if (newCorrect >= 8) {
      try {
        await updateProgressMut.mutateAsync({
          studentId: user.id,
          data: { correctCount: newCorrect, currentSession: newSession, currentWajh, totalStars: newStars, waitingTeacher: true }
        });
        await refetch(); clearAudio(); setPhase("ready");
        setShowTeacherModal(true);
      } catch (e) { console.error(e); }
      return;
    }

    // فشل بعد 8 محاولات في الجلسة
    if (newAttempts.length >= 8 && newCorrect < 8) {
      newSession++;
      setSessionAttempts([]);
      if (newSession > 3) {
        try {
          await updateProgressMut.mutateAsync({
            studentId: user.id,
            data: { correctCount: 0, currentSession: 1, currentWajh, totalStars: newStars }
          });
          await refetch(); clearAudio(); setPhase("ready");
          setShowFailModal(true);
        } catch (e) { console.error(e); }
        return;
      }
    }

    try {
      await updateProgressMut.mutateAsync({
        studentId: user.id,
        data: { correctCount: newCorrect, currentSession: newSession, currentWajh, totalStars: newStars }
      });
      await refetch(); clearAudio(); setPhase("ready");
    } catch (e) { console.error(e); }
  };

  const handleTeacherConfirmed = async () => {
    const nextWajh = currentWajh + 1;
    const needsHashd = currentWajh % 5 === 0; // كل 5 أوجه يوجد حشد

    try {
      await updateProgressMut.mutateAsync({
        studentId: user.id,
        data: {
          currentWajh: nextWajh,
          correctCount: 0,
          currentSession: 1,
          waitingTeacher: false,
          totalStars: (progress?.totalStars || 0) + 5,
        }
      });
      await refetch();
      setShowTeacherModal(false);
      // إذا كان الوجه المكتمل من مضاعفات 5 → انتقل لصفحة الحشد
      if (needsHashd) {
        setLocation("/hashd");
      } else {
        setLocation("/dashboard");
      }
    } catch (e) { console.error(e); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // بناء نص الصفحة الكاملة من الآيات
  const pageText = ayahs.map(a => `${a.text} ﴿${a.numberInSurah}﴾`).join("  ");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-emerald-400 transition-colors font-medium text-sm px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>
        <h1 className="font-serif text-lg font-bold text-emerald-50">تسميع الوجه {currentWajh}</h1>
        <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-sm">
          المحاولة <span className="text-lg">{Math.min(correctCount + 1, 8)}</span> / 8
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6">

        {/* عرض نص الصفحة */}
        <div className="glass-panel rounded-3xl overflow-hidden border-emerald-900/30">
          {/* شريط المعلومات */}
          <div className="flex justify-between items-center px-5 py-3 border-b border-white/5 text-sm font-medium text-muted-foreground bg-white/[0.02]">
            <span className="text-primary font-bold">سورة البقرة — الصفحة {pageNum}</span>
            <span className="text-xs">{hintText}</span>
          </div>

          {/* منطقة النص */}
          <div className="relative bg-[#0d1a12] p-6 md:p-8 min-h-[280px] flex items-center justify-center">
            {pageLoading ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm">تحميل الصفحة...</span>
              </div>
            ) : pageError ? (
              <p className="text-muted-foreground text-sm text-center">تعذّر تحميل الصفحة. تأكد من الاتصال بالإنترنت.</p>
            ) : (
              <div
                className="transition-all duration-700 w-full"
                style={blurStyle}
              >
                <p
                  dir="rtl"
                  className="text-right leading-[2.8] text-[1.35rem] md:text-[1.5rem] text-[#e8dfc0] selection:bg-primary/30"
                  style={{ fontFamily: "'Amiri', 'Traditional Arabic', 'Scheherazade New', serif" }}
                >
                  {pageText || "﴿ بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ﴾"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recording Section */}
        <div className="glass-panel p-6 rounded-3xl text-center border-white/5 relative overflow-hidden">

          {phase === "ready" && (
            <div className="py-8">
              <button
                onClick={handleStartRecord}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-emerald-700 shadow-xl shadow-primary/30 flex items-center justify-center mx-auto hover:scale-105 active:scale-95 transition-all mb-4"
              >
                <Mic className="w-10 h-10 text-white" />
              </button>
              <h3 className="text-xl font-bold text-emerald-50 mb-2">اضغط للبدء بالتسميع</h3>
              <p className="text-muted-foreground text-sm">اقرأ بصوت واضح — الحد الأقصى 90 ثانية</p>
            </div>
          )}

          {phase === "record" && (
            <div className="py-6">
              <div className="text-5xl font-serif font-bold text-primary tracking-widest mb-4">
                {formatTime(recordingTime)}
              </div>
              <div className="w-full max-w-md mx-auto h-2 bg-[#06100a] rounded-full overflow-hidden mb-8 border border-white/5">
                <div
                  className={`h-full transition-all duration-1000 rounded-full ${recordingTime > 75 ? 'bg-destructive' : recordingTime > 60 ? 'bg-amber-500' : 'bg-primary'}`}
                  style={{ width: `${(recordingTime / 90) * 100}%` }}
                />
              </div>
              <button
                onClick={handleStopRecord}
                className="w-20 h-20 rounded-full bg-destructive shadow-lg shadow-destructive/30 flex items-center justify-center mx-auto hover:scale-105 active:scale-95 transition-all animate-pulse"
              >
                <Square className="w-8 h-8 text-white fill-current" />
              </button>
              <p className="text-destructive mt-4 font-bold text-sm">🔴 جاري التسجيل...</p>
            </div>
          )}

          {phase === "listen" && (
            <div className="py-4 animate-in fade-in zoom-in duration-300">
              <h3 className="text-lg font-bold text-emerald-50 mb-6">استمع لتسجيلك وقيّم قراءتك بأمانة</h3>
              {audioUrl && <audio src={audioUrl} controls className="w-full max-w-md mx-auto mb-8 rounded-xl" />}
              <p className="text-muted-foreground text-sm mb-4">هل كانت قراءتك صحيحة بدون أخطاء؟</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => handleResult(true)}
                  disabled={updateProgressMut.isPending}
                  className="w-full sm:w-52 py-4 rounded-xl font-bold bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" /> ✓ نعم، صحيحة
                </button>
                <button
                  onClick={() => handleResult(false)}
                  disabled={updateProgressMut.isPending}
                  className="w-full sm:w-52 py-4 rounded-xl font-bold bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" /> ✗ لا، فيها خطأ
                </button>
              </div>
            </div>
          )}

          {/* Progress Indicators */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>الجلسة {currentSession} من 3 |</span>
              <div className="flex gap-1.5" dir="ltr">
                {Array.from({ length: 8 }).map((_, i) => {
                  const isPast = i < correctCount;
                  const inSession = sessionAttempts[i];
                  let cls = "bg-white/5 border border-white/10 text-muted-foreground";
                  let content: React.ReactNode = <span className="text-[10px]">{i + 1}</span>;
                  if (isPast || inSession === true) { cls = "bg-primary/20 border-primary text-primary"; content = <CheckCircle2 className="w-3 h-3" />; }
                  else if (inSession === false) { cls = "bg-destructive/20 border-destructive text-destructive"; content = <XCircle className="w-3 h-3" />; }
                  return <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${cls}`}>{content}</div>;
                })}
              </div>
            </div>
            {phase === "ready" && (
              <button onClick={() => setLocation("/dashboard")} className="text-xs text-muted-foreground hover:text-white px-3 py-1.5 rounded-lg border border-transparent hover:border-white/10 transition-colors">
                إنهاء الجلسة مؤقتاً
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Modal: التسميع على المعلم */}
      <Modal
        isOpen={showTeacherModal}
        onClose={() => { setShowTeacherModal(false); setLocation("/dashboard"); }}
        title="أتممت الوجه! 🎉"
        icon={<CheckCircle2 className="w-6 h-6 text-primary" />}
      >
        <div className="space-y-6 text-center">
          <p className="text-emerald-100/90 text-sm leading-loose">
            ما شاء الله! أتممت <strong className="text-primary">8 مرات تسميع صحيحة</strong> للوجه {currentWajh}.<br /><br />
            {currentWajh % 5 === 0 ? (
              <span className="text-accent font-bold">بعد تأكيد المعلم ستنتقل لمرحلة الحشد ⭐</span>
            ) : (
              "سمّع على معلمك للانتقال للوجه التالي."
            )}
            <br /><br />

            <a href="https://us02web.zoom.us/j/83343336352?pwd=bWkeaD8czSGVksZKQok1AQpYdkKeNa.1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline font-bold"
            >
              📹 انقر هنا للانضمام لغرفة الزوم والتسميع على المعلم
            </a>
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleTeacherConfirmed}
              disabled={updateProgressMut.isPending}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-emerald-700 text-white font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {updateProgressMut.isPending ? "جاري الحفظ..." : "✓ سمّعت على المعلم — الانتقال للأمام"}
            </button>
            <button
              onClick={() => { setShowTeacherModal(false); setLocation("/dashboard"); }}
              className="w-full py-3 rounded-xl border border-white/10 text-muted-foreground hover:text-white hover:border-white/20 transition-all font-medium text-sm"
            >
              لم أسمّع بعد — الرجوع للوحة التحكم
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: فشل الجلسات الثلاث */}
      <Modal
        isOpen={showFailModal}
        onClose={() => { setShowFailModal(false); setLocation("/dashboard"); }}
        title="انتهت الجلسات الثلاث"
        icon={<XCircle className="w-6 h-6 text-destructive" />}
      >
        <div className="space-y-6 text-center">
          <p className="text-emerald-100/80 text-sm leading-loose">
            لقد استنفدت الجلسات الثلاث للوجه {currentWajh}.<br /><br />
            سيتم إعادة الضبط — لا تيأس، التكرار طريق الإتقان!
          </p>
          <button
            onClick={() => { setShowFailModal(false); setLocation("/dashboard"); }}
            className="w-full py-3.5 rounded-xl bg-secondary border border-white/10 text-emerald-50 font-bold hover:bg-secondary/70 transition-all"
          >
            حسناً، أعيد من جديد
          </button>
        </div>
      </Modal>
    </div>
  );
}
