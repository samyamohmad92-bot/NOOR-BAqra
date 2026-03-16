import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Mic, Square, Play, CheckCircle2, XCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useGetProgress, useUpdateProgress } from "@workspace/api-client-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { Modal } from "@/components/ui/Modal";

export default function MemorizePage() {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  
  if (!user) {
    setLocation("/");
    return null;
  }

  const { data: progress, refetch } = useGetProgress(user.id);
  const updateProgressMut = useUpdateProgress();

  const [phase, setPhase] = useState<"ready" | "record" | "listen">("ready");
  const [sessionAttempts, setSessionAttempts] = useState<boolean[]>([]); // true = correct, false = incorrect
  const [showTeacherModal, setShowTeacherModal] = useState(false);

  const { isRecording, recordingTime, audioUrl, startRecording, stopRecording, clearAudio } = useAudioRecorder();

  const currentWajh = progress?.currentWajh || 1;
  const correctCount = progress?.correctCount || 0;
  const currentSession = progress?.currentSession || 1;

  // Auto-stop at 90s
  useEffect(() => {
    if (isRecording && recordingTime >= 90) {
      handleStopRecord();
    }
  }, [recordingTime, isRecording]);

  // Determine blur level based on progress
  let blurClass = "backdrop-blur-none bg-transparent";
  let hintText = "النص ظاهر كاملاً — اقرأ وتأمل";
  if (correctCount >= 5) {
    blurClass = "backdrop-blur-[16px] bg-[#0A100D]/90";
    hintText = "مخفي كلياً — اقرأ من حفظك";
  } else if (correctCount >= 2) {
    blurClass = "backdrop-blur-[5px] bg-[#0A100D]/50";
    hintText = "إخفاء جزئي — تذكر ما حفظت";
  }

  const handleStartRecord = () => {
    if (correctCount >= 8) {
      setShowTeacherModal(true);
      return;
    }
    setPhase("record");
    startRecording();
  };

  const handleStopRecord = () => {
    stopRecording();
    // If it's session 1, 2, or 3 (all sessions for now) we show listen phase
    setPhase("listen");
  };

  const handleResult = async (isCorrect: boolean) => {
    const newAttempts = [...sessionAttempts, isCorrect];
    setSessionAttempts(newAttempts);
    
    let newCorrect = correctCount + (isCorrect ? 1 : 0);
    let newSession = currentSession;
    let newWajh = currentWajh;

    // Check session limits (8 attempts per session max)
    if (newAttempts.length >= 8 && newCorrect < 8) {
      newSession++;
      setSessionAttempts([]); // Reset for next session
      if (newSession > 3) {
        // Failed all 3 sessions
        alert("استنفدت الجلسات الثلاث. سيتم إعادة الوجه من البداية.");
        newCorrect = 0;
        newSession = 1;
      }
    }

    try {
      await updateProgressMut.mutateAsync({
        studentId: user.id,
        data: {
          correctCount: newCorrect,
          currentSession: newSession,
          currentWajh: newWajh,
          totalStars: progress?.totalStars! + (isCorrect ? 1 : 0)
        }
      });
      refetch();
      clearAudio();
      setPhase("ready");

      if (newCorrect >= 8) {
        setShowTeacherModal(true);
      }
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Mock Quran Page Image URL logic (Page 2 = Wajh 1)
  const pageNum = String(currentWajh + 1).padStart(3, '0');
  const quranImageUrl = `https://cdn.islamic.network/quran/images/high-resolution/page${pageNum}.png`;

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
          المحاولة <span className="text-lg">{correctCount + 1}</span> / 8
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6">
        
        {/* Quran Display */}
        <div className="glass-panel p-4 rounded-3xl relative overflow-hidden flex-shrink-0 min-h-[400px] border-emerald-900/30">
          <div className="flex justify-between items-center px-4 mb-4 text-sm font-medium text-muted-foreground">
            <span>سورة البقرة</span>
            <span className="text-primary">الصفحة {currentWajh + 1}</span>
            <span>{hintText}</span>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden bg-[#faf8f3] flex justify-center py-4">
            <img 
              src={quranImageUrl} 
              alt="Quran Page" 
              className="w-full max-w-[500px] h-auto object-contain mix-blend-multiply opacity-90"
              onError={(e) => {
                // Fallback text if image fails
                (e.target as HTMLElement).style.display = 'none';
                (e.target as HTMLElement).parentElement!.innerHTML += '<div class="p-10 text-center font-serif text-2xl text-slate-800">تعذّر تحميل صفحة المصحف</div>';
              }}
            />
            {/* Overlay for blur */}
            <div className={`absolute inset-0 transition-all duration-1000 ease-in-out pointer-events-none ${blurClass}`}></div>
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
              <p className="text-muted-foreground text-sm">اقرأ بصوت واضح، الحد الأقصى 90 ثانية</p>
            </div>
          )}

          {phase === "record" && (
            <div className="py-6">
              <div className="text-5xl font-serif font-bold text-primary tracking-widest mb-4">
                {formatTime(recordingTime)}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full max-w-md mx-auto h-2 bg-[#06100a] rounded-full overflow-hidden mb-8 border border-white/5">
                <div 
                  className={`h-full transition-all duration-1000 linear ${recordingTime > 75 ? 'bg-destructive' : recordingTime > 60 ? 'bg-accent' : 'bg-primary'}`}
                  style={{ width: `${(recordingTime / 90) * 100}%` }}
                ></div>
              </div>

              <button 
                onClick={handleStopRecord}
                className="w-20 h-20 rounded-full bg-destructive shadow-lg shadow-destructive/30 flex items-center justify-center mx-auto hover:scale-105 active:scale-95 transition-all animate-pulse"
              >
                <Square className="w-8 h-8 text-white fill-current" />
              </button>
              <p className="text-destructive mt-4 font-bold text-sm">جاري التسجيل...</p>
            </div>
          )}

          {phase === "listen" && (
            <div className="py-4 animate-in fade-in zoom-in duration-300">
              <h3 className="text-lg font-bold text-emerald-50 mb-6">استمع لتسجيلك وقيّم قراءتك بأمانة</h3>
              
              {audioUrl && (
                <audio src={audioUrl} controls className="w-full max-w-md mx-auto mb-8 rounded-full bg-secondary" />
              )}

              <p className="text-muted-foreground text-sm mb-4">هل كانت قراءتك صحيحة بدون أخطاء؟</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => handleResult(true)}
                  disabled={updateProgressMut.isPending}
                  className="w-full sm:w-48 py-4 rounded-xl font-bold bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  نعم، صحيحة
                </button>
                <button 
                  onClick={() => handleResult(false)}
                  disabled={updateProgressMut.isPending}
                  className="w-full sm:w-48 py-4 rounded-xl font-bold bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  لا، فيها خطأ
                </button>
              </div>
            </div>
          )}

          {/* Session Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span>الجلسة {currentSession} من 3:</span>
              <div className="flex gap-1.5" dir="ltr">
                {Array.from({ length: 8 }).map((_, i) => {
                  const isPastCorrect = i < correctCount;
                  const attemptInSession = sessionAttempts[i - correctCount];
                  
                  let stateClass = "bg-white/5 border border-white/10 text-muted-foreground"; // empty
                  let content: any = i + 1;

                  if (isPastCorrect || attemptInSession === true) {
                    stateClass = "bg-primary/20 border-primary text-primary";
                    content = <CheckCircle2 className="w-3 h-3" />;
                  } else if (attemptInSession === false) {
                    stateClass = "bg-destructive/20 border-destructive text-destructive";
                    content = <XCircle className="w-3 h-3" />;
                  }

                  return (
                    <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${stateClass}`}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {phase === "ready" && (
              <button 
                onClick={() => setLocation("/dashboard")}
                className="text-xs text-muted-foreground hover:text-white px-3 py-1.5 rounded-lg border border-transparent hover:border-white/10 transition-colors"
              >
                إنهاء الجلسة مؤقتاً
              </button>
            )}
          </div>
        </div>
      </main>

      <Modal 
        isOpen={showTeacherModal} 
        onClose={() => {
          setShowTeacherModal(false);
          setLocation("/dashboard");
        }}
        title="التسميع على المعلم"
        icon={<CheckCircle2 className="w-6 h-6" />}
      >
        <div className="space-y-6 text-center">
          <p className="text-emerald-100/90 text-sm leading-relaxed">
            ما شاء الله! لقد أتممت 8 مرات تسميع صحيحة للوجه {currentWajh}.<br/><br/>
            الخطوة التالية هي التسميع المباشر على معلمك لتأكيد إتقان الحفظ.
          </p>
          <button 
            onClick={async () => {
              await updateProgressMut.mutateAsync({
                studentId: user.id,
                data: { waitingTeacher: true }
              });
              setShowTeacherModal(false);
              setLocation("/dashboard");
            }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-emerald-700 text-white font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all"
          >
            الانتقال للوحة التحكم
          </button>
        </div>
      </Modal>
    </div>
  );
}
