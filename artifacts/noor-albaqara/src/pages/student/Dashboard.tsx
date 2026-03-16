import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Star, Trophy, Target, PlayCircle, Info } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useGetProgress, useGetLeaderboard } from "@workspace/api-client-react";
import { Modal } from "@/components/ui/Modal";
import { Navbar } from "@/components/layout/Navbar";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  const [showInfoModal, setShowInfoModal] = useState(false);

  // If user is missing, fallback to auth
  if (!user) {
    setLocation("/");
    return null;
  }

  const { data: progress, isLoading: progressLoading } = useGetProgress(user.id);
  const { data: leaderboard, isLoading: leaderboardLoading } = useGetLeaderboard();

  if (progressLoading || leaderboardLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentWajh = progress?.currentWajh || 1;
  const correctCount = progress?.correctCount || 0;
  const currentSession = progress?.currentSession || 1;
  const totalStars = progress?.totalStars || 0;
  const hashdCompleted = progress?.hashdCompleted || 0;
  const waitingTeacher = progress?.waitingTeacher || false;
  const maxAttempts = 8;

  const progressPercent = Math.round((correctCount / maxAttempts) * 100);

  const startSession = () => {
    setLocation("/memorize");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-emerald-50 mb-2">
            أهلاً، <span className="text-primary">{user.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-muted-foreground text-lg">واصل رحلتك المباركة مع سورة البقرة</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={<BookOpen className="w-6 h-6 text-emerald-400" />} label="الوجه الحالي" value={currentWajh.toString()} />
          <StatCard icon={<Target className="w-6 h-6 text-blue-400" />} label="تسميع صحيح" value={`${correctCount} / 8`} />
          <StatCard icon={<Trophy className="w-6 h-6 text-purple-400" />} label="حشود مكتملة" value={hashdCompleted.toString()} />
          <StatCard icon={<Star className="w-6 h-6 text-accent" />} label="نجوم النور" value={totalStars.toString()} className="text-glow-gold" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Card */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-emerald-50 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              منهج الحفظ الحالي
            </h2>
            
            <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-3">
                    قيد الحفظ
                  </div>
                  <h3 className="font-serif text-3xl font-bold text-emerald-50">الوجه {currentWajh} — سورة البقرة</h3>
                </div>
                <button 
                  onClick={() => setShowInfoModal(true)}
                  className="mt-4 md:mt-0 p-2 rounded-full hover:bg-white/5 text-muted-foreground transition-colors"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-secondary/50 border border-white/5 rounded-2xl p-5 mb-8 relative z-10">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-emerald-100/80">تقدم التسميع الصحيح</span>
                  <span className="text-2xl font-bold text-primary">{correctCount} <span className="text-sm text-muted-foreground font-medium">/ 8 مرات</span></span>
                </div>
                <div className="w-full h-3 bg-[#06100a] rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-primary rounded-full transition-all duration-1000 relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                {!waitingTeacher && (
                  <div className="flex items-center gap-3 bg-background/50 py-2 px-4 rounded-xl border border-white/5">
                    <span className="text-sm font-medium text-muted-foreground ml-2">الجلسات المتاحة:</span>
                    {[1, 2, 3].map(s => (
                      <div
                        key={s}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
                          ${s < currentSession ? 'bg-primary/20 text-primary border border-primary/30' :
                            s === currentSession ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110' :
                            'bg-white/5 text-muted-foreground border border-white/5'}`}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}

                {waitingTeacher ? (
                  <div className="w-full flex flex-col items-center gap-3">
                    <div className="w-full py-4 px-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-center flex items-center justify-center gap-3">
                      ⏳ في انتظار التسميع على المعلم للوجه {currentWajh}
                    </div>
                    <p className="text-xs text-muted-foreground">بعد التسميع على المعلم، اضغط "سمّعت على المعلم" في صفحة التسميع للانتقال للوجه التالي.</p>
                    <button
                      onClick={startSession}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <PlayCircle className="w-5 h-5" />
                      الذهاب لصفحة التسميع
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startSession}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-primary to-emerald-700 text-white shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                  >
                    <PlayCircle className="w-6 h-6" />
                    ابدأ التسميع الآن
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Leaderboard Card */}
          <div>
            <h2 className="text-xl font-bold text-emerald-50 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" />
              درجات النور
            </h2>
            
            <div className="glass-panel p-6 rounded-3xl flex flex-col h-[calc(100%-2rem)]">
              <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6 text-center mb-6">
                <div className="text-4xl font-serif font-bold text-accent text-glow-gold mb-2">⭐ {totalStars}</div>
                <div className="text-sm font-medium text-amber-200/70">نجومك الحالية</div>
              </div>

              <div className="flex-1">
                <h4 className="text-sm font-bold text-muted-foreground mb-4">أعلى الطلاب المتميزين</h4>
                <div className="space-y-3">
                  {leaderboard?.map((student, idx) => (
                    <div key={student.id} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl border border-white/5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${idx === 0 ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20' : 
                          idx === 1 ? 'bg-slate-300 text-slate-800' : 
                          idx === 2 ? 'bg-[#b87333] text-white' : 'bg-white/10 text-muted-foreground'}`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-emerald-50 truncate">{student.name}</div>
                        <div className="text-xs text-muted-foreground">الوجه {student.currentWajh}</div>
                      </div>
                      <div className="text-sm font-bold text-accent">⭐ {student.totalStars}</div>
                    </div>
                  ))}
                  {(!leaderboard || leaderboard.length === 0) && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      لا يوجد بيانات حالياً
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Modal 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)}
        title="كيفية الحفظ في المنصة"
        icon={<Info className="w-6 h-6" />}
      >
        <div className="space-y-4 text-emerald-100/80 text-sm leading-relaxed">
          <p>
            تعتمد المنصة على التكرار المتباعد للوصول إلى الحفظ المتقن. لكل وجه <strong className="text-primary">8 مرات تسميع صحيحة</strong> مطلوبة.
          </p>
          <ul className="list-disc list-inside space-y-2 pr-4 text-muted-foreground">
            <li>لديك 3 جلسات كحد أقصى لكل وجه.</li>
            <li>أثناء التسميع سيتم إخفاء الصفحة تدريجياً لتعزيز استرجاعك من الذاكرة.</li>
            <li>يجب التسميع على المعلم بعد إكمال الـ 8 مرات.</li>
            <li>كل 5 أوجه يوجد "حشد" (اختبار كتابي ومراجعة شاملة).</li>
          </ul>
          <button 
            onClick={() => setShowInfoModal(false)}
            className="w-full mt-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-emerald-50 font-bold transition-colors"
          >
            حسناً، فهمت
          </button>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ icon, label, value, className = "" }: { icon: React.ReactNode, label: string, value: string, className?: string }) {
  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col items-start gap-3 hover:bg-card/90 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
        {icon}
      </div>
      <div>
        <div className={`text-2xl font-bold text-emerald-50 font-serif ${className}`}>{value}</div>
        <div className="text-xs font-medium text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}
