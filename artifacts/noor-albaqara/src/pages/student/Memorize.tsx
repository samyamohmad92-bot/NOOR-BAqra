import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Mic, Square, CheckCircle2, XCircle, BookOpen } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useGetProgress, useUpdateProgress } from "@workspace/api-client-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { Modal } from "@/components/ui/Modal";

// آيات البقرة - أول بضع آيات لكل وجه (بيانات محلية للعرض)
const WAJH_INFO: Record<number, { page: number; verses: string }> = {
  1: { page: 2, verses: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ ﴿٣﴾ وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ ﴿٤﴾" },
  2: { page: 3, verses: "خَتَمَ اللَّهُ عَلَىٰ قُلُوبِهِمْ وَعَلَىٰ سَمْعِهِمْ ۖ وَعَلَىٰ أَبْصَارِهِمْ غِشَاوَةٌ ۖ وَلَهُمْ عَذَابٌ عَظِيمٌ ﴿٧﴾ وَمِنَ النَّاسِ مَن يَقُولُ آمَنَّا بِاللَّهِ وَبِالْيَوْمِ الْآخِرِ وَمَا هُم بِمُؤْمِنِينَ ﴿٨﴾" },
  3: { page: 4, verses: "يَا أَيُّهَا النَّاسُ اعْبُدُوا رَبَّكُمُ الَّذِي خَلَقَكُمْ وَالَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ ﴿٢١﴾ الَّذِي جَعَلَ لَكُمُ الْأَرْضَ فِرَاشًا وَالسَّمَاءَ بِنَاءً ﴿٢٢﴾" },
  4: { page: 5, verses: "وَإِن كُنتُمْ فِي رَيْبٍ مِّمَّا نَزَّلْنَا عَلَىٰ عَبْدِنَا فَأْتُوا بِسُورَةٍ مِّن مِّثْلِهِ ﴿٢٣﴾ وَبَشِّرِ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ أَنَّ لَهُمْ جَنَّاتٍ تَجْرِي مِن تَحْتِهَا الْأَنْهَارُ ﴿٢٥﴾" },
  5: { page: 6, verses: "إِنَّ اللَّهَ لَا يَسْتَحْيِي أَن يَضْرِبَ مَثَلًا مَّا بَعُوضَةً فَمَا فَوْقَهَا ﴿٢٦﴾ وَيَعْلَمُ مَا فِي الْبَرِّ وَالْبَحْرِ وَمَا تَسْقُطُ مِن وَرَقَةٍ إِلَّا يَعْلَمُهَا ﴿٢٧﴾" },
};

function getWajhInfo(wajh: number) {
  return WAJH_INFO[wajh] || { page: wajh + 1, verses: `الوجه ${wajh} من سورة البقرة — الصفحة ${wajh + 1}` };
}

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
  const [sessionAttempts, setSessionAttempts] = useState<boolean[]>([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const { isRecording, recordingTime, audioUrl, startRecording, stopRecording, clearAudio } = useAudioRecorder();

  const currentWajh = progress?.currentWajh || 1;
  const correctCount = progress?.correctCount || 0;
  const currentSession = progress?.currentSession || 1;
  const wajhInfo = getWajhInfo(currentWajh);

  // Auto-stop at 90 seconds
  useEffect(() => {
    if (isRecording && recordingTime >= 90) {
      handleStopRecord();
    }
  }, [recordingTime, isRecording]);

  // Determine blur level based on total correct count
  let blurStyle: React.CSSProperties = {};
  let hintText = "📖 النص ظاهر كاملاً — اقرأ وتأمّل";
  if (correctCount >= 5) {
    blurStyle = { backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "rgba(10,16,13,0.88)" };
    hintText = "🔒 مخفي كلياً — اقرأ من حفظك";
  } else if (correctCount >= 2) {
    blurStyle = { backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", background: "rgba(10,16,13,0.45)" };
    hintText = "👁️ إخفاء جزئي — تذكّر ما حفظت";
  }

  const handleStartRecord = () => {
    setImgFailed(false);
    setPhase("record");
    startRecording();
  };

  const handleStopRecord = () => {
    stopRecording();
    setPhase("listen");
  };

  const handleResult = async (isCorrect: boolean) => {
    const newAttempts = [...sessionAttempts, isCorrect];
    setSessionAttempts(newAttempts);

    let newCorrect = correctCount + (isCorrect ? 1 : 0);
    let newSession = currentSession;
    let newWajh = currentWajh;
    let newStars = (progress?.totalStars || 0) + (isCorrect ? 1 : 0);

    // ✅ أتمّ 8 مرات صحيحة — انتقل للوجه التالي
    if (newCorrect >= 8) {
      try {
        // إعادة التعيين والانتقال للوجه التالي
        await updateProgressMut.mutateAsync({
          studentId: user.id,
          data: {
            correctCount: newCorrect,
            currentSession: newSession,
            currentWajh: newWajh,
            totalStars: newStars,
            waitingTeacher: true,
          }
        });
        await refetch();
        clearAudio();
        setPhase("ready");
        setShowTeacherModal(true);
      } catch (e) {
        console.error("Failed to save progress", e);
      }
      return;
    }

    // فشل بعد 8 محاولات في هذه الجلسة
    if (newAttempts.length >= 8 && newCorrect < 8) {
      newSession++;
      setSessionAttempts([]);
      if (newSession > 3) {
        // استُنفدت الجلسات الثلاث — إعادة الضبط
        try {
          await updateProgressMut.mutateAsync({
            studentId: user.id,
            data: { correctCount: 0, currentSession: 1, currentWajh: newWajh, totalStars: newStars }
          });
          await refetch();
          clearAudio();
          setPhase("ready");
          setShowFailModal(true);
        } catch (e) { console.error(e); }
        return;
      }
    }

    try {
      await updateProgressMut.mutateAsync({
        studentId: user.id,
        data: {
          correctCount: newCorrect,
          currentSession: newSession,
          currentWajh: newWajh,
          totalStars: newStars,
        }
      });
      await refetch();
      clearAudio();
      setPhase("ready");
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  };

  const handleTeacherConfirmed = async () => {
    // ✅ المعلم أكّد — الانتقال للوجه التالي وإعادة الضبط
    try {
      await updateProgressMut.mutateAsync({
        studentId: user.id,
        data: {
          currentWajh: currentWajh + 1,
          correctCount: 0,
          currentSession: 1,
          waitingTeacher: false,
          hashdCompleted: (progress?.hashdCompleted || 0),
          totalStars: (progress?.totalStars || 0) + 5, // 5 نجوم لإتمام وجه كامل
        }
      });
      await refetch();
      setShowTeacherModal(false);
      setLocation("/dashboard");
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const pageNum = String(wajhInfo.page).padStart(3, '0');
  // CDN موثوق لصفحات المصحف
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
          المحاولة <span className="text-lg">{Math.min(correctCount + 1, 8)}</span> / 8
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6">

        {/* Quran Display */}
        <div className="glass-panel p-4 rounded-3xl relative overflow-hidden flex-shrink-0 border-emerald-900/30">
          <div className="flex justify-between items-center px-2 mb-3 text-sm font-medium text-muted-foreground">
            <span>سورة البقرة</span>
            <span className="text-primary font-bold">الصفحة {wajhInfo.page} — الوجه {currentWajh}</span>
            <span className="text-xs">{hintText}</span>
          </div>

          {/* صورة المصحف مع fallback نصي */}
          <div className="relative rounded-2xl overflow-hidden bg-[#fdfaf3] min-h-[300px] flex items-center justify-center">
            {!imgFailed ? (
              <img
                src={quranImageUrl}
                alt={`صفحة المصحف ${wajhInfo.page}`}
                className="w-full max-w-[520px] h-auto object-contain mx-auto"
                onError={() => setImgFailed(true)}
              />
            ) : (
              /* Fallback: عرض نصي للآيات عند فشل تحميل الصورة */
              <div className="w-full p-6 md:p-10 text-center" dir="rtl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-700/30 text-emerald-400 text-xs font-medium mb-6">
                  <BookOpen className="w-3.5 h-3.5" />
                  سورة البقرة — الصفحة {wajhInfo.page}
                </div>
                <p
                  className="font-serif text-2xl md:text-3xl leading-loose text-slate-800 tracking-wide select-none"
                  style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif", lineHeight: "2.8" }}
                >
                  {wajhInfo.verses}
                </p>
              </div>
            )}

            {/* طبقة الإخفاء التدريجي */}
            <div
              className="absolute inset-0 rounded-2xl transition-all duration-700 pointer-events-none"
              style={blurStyle}
            />
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
                  className={`h-full transition-all duration-1000 linear rounded-full ${recordingTime > 75 ? 'bg-destructive' : recordingTime > 60 ? 'bg-amber-500' : 'bg-primary'}`}
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
              {audioUrl && (
                <audio src={audioUrl} controls className="w-full max-w-md mx-auto mb-8 rounded-xl" />
              )}
              <p className="text-muted-foreground text-sm mb-4">هل كانت قراءتك صحيحة بدون أخطاء؟</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => handleResult(true)}
                  disabled={updateProgressMut.isPending}
                  className="w-full sm:w-52 py-4 rounded-xl font-bold bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  ✓ نعم، صحيحة
                </button>
                <button
                  onClick={() => handleResult(false)}
                  disabled={updateProgressMut.isPending}
                  className="w-full sm:w-52 py-4 rounded-xl font-bold bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  ✗ لا، فيها خطأ
                </button>
              </div>
            </div>
          )}

          {/* Session Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>الجلسة {currentSession} من 3 |</span>
              <div className="flex gap-1.5" dir="ltr">
                {Array.from({ length: 8 }).map((_, i) => {
                  const isPastCorrect = i < correctCount;
                  const attemptInSession = sessionAttempts[i];
                  let stateClass = "bg-white/5 border border-white/10 text-muted-foreground";
                  let content: React.ReactNode = <span className="text-[10px]">{i + 1}</span>;
                  if (isPastCorrect) {
                    stateClass = "bg-primary/20 border-primary text-primary";
                    content = <CheckCircle2 className="w-3 h-3" />;
                  } else if (attemptInSession === true) {
                    stateClass = "bg-primary/20 border-primary text-primary";
                    content = <CheckCircle2 className="w-3 h-3" />;
                  } else if (attemptInSession === false) {
                    stateClass = "bg-destructive/20 border-destructive text-destructive";
                    content = <XCircle className="w-3 h-3" />;
                  }
                  return (
                    <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${stateClass}`}>
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

      {/* Modal: التسميع على المعلم */}
      <Modal
        isOpen={showTeacherModal}
        onClose={() => {
          setShowTeacherModal(false);
          setLocation("/dashboard");
        }}
        title="أتممت الوجه! 🎉"
        icon={<CheckCircle2 className="w-6 h-6 text-primary" />}
      >
        <div className="space-y-6 text-center">
          <p className="text-emerald-100/90 text-sm leading-loose">
            ما شاء الله! أتممت <strong className="text-primary">8 مرات تسميع صحيحة</strong> للوجه {currentWajh}.<br /><br />
            الخطوة التالية هي التسميع المباشر على معلمك لتأكيد الحفظ ثم الانتقال للوجه التالي.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleTeacherConfirmed}
              disabled={updateProgressMut.isPending}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-emerald-700 text-white font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {updateProgressMut.isPending ? "جاري الحفظ..." : "✓ سمّعت على المعلم — الانتقال للوجه التالي"}
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

      {/* Modal: فشل كل الجلسات */}
      <Modal
        isOpen={showFailModal}
        onClose={() => { setShowFailModal(false); setLocation("/dashboard"); }}
        title="انتهت الجلسات الثلاث"
        icon={<XCircle className="w-6 h-6 text-destructive" />}
      >
        <div className="space-y-6 text-center">
          <p className="text-emerald-100/80 text-sm leading-loose">
            لقد استنفدت الجلسات الثلاث للوجه {currentWajh} بدون إكمال 8 مرات صحيحة.<br /><br />
            سيتم إعادة ضبط التقدم وتبدأ من جديد — لا تيأس، التكرار طريق الإتقان!
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
