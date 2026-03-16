import { useState } from "react";
import { useLocation } from "wouter";
import { Users, UserCheck, Trophy, Search, Plus } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useGetStudents } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";

export default function SupervisorDashboard() {
  const { user, role } = useAuthStore();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  if (!user || role !== "supervisor") {
    setLocation("/");
    return null;
  }

  // The real app would fetch students by supervisor_id, but here we fetch all and filter or use what's returned
  const { data: students, isLoading } = useGetStudents();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Stats
  const totalStudents = students?.length || 0;
  const activeStudents = students?.filter(s => s.progress?.correctCount && s.progress.correctCount > 0).length || 0;
  const totalCompletedHashd = students?.reduce((acc, s) => acc + (s.progress?.hashdCompleted || 0), 0) || 0;

  const filteredStudents = students?.filter(s => 
    s.name.includes(searchTerm) || s.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-emerald-50 mb-2 flex items-center gap-3">
            لوحة المشرف
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 align-middle">
              نطاق الصلاحية
            </span>
          </h1>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={<Users className="w-6 h-6 text-emerald-400" />} label="إجمالي الطلاب" value={totalStudents.toString()} />
          <StatCard icon={<UserCheck className="w-6 h-6 text-blue-400" />} label="طلاب نشطون" value={activeStudents.toString()} />
          <StatCard icon={<Trophy className="w-6 h-6 text-purple-400" />} label="أتموا حشداً" value={totalCompletedHashd.toString()} />
          <StatCard icon={<Users className="w-6 h-6 text-accent" />} label="جلسات تسميع" value={(totalStudents * 5).toString()} />
        </div>

        {/* Table Section */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02]">
            <h2 className="text-lg font-bold text-emerald-50">الطلاب المسجلون</h2>
            
            <div className="flex w-full sm:w-auto items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث بالاسم أو الرقم..." 
                  className="w-full bg-background border border-white/10 rounded-xl py-2 pr-10 pl-4 text-sm text-emerald-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <button className="flex-shrink-0 flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                <Plus className="w-4 h-4" />
                إضافة طالب
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-[#0A100D] text-muted-foreground border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold">الاسم</th>
                  <th className="px-6 py-4 font-semibold">رقم الهاتف</th>
                  <th className="px-6 py-4 font-semibold">الوجه الحالي</th>
                  <th className="px-6 py-4 font-semibold">المرات الصحيحة</th>
                  <th className="px-6 py-4 font-semibold">النجوم</th>
                  <th className="px-6 py-4 font-semibold">الحالة</th>
                  <th className="px-6 py-4 font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents?.map((student) => (
                  <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-bold text-emerald-50">{student.name}</td>
                    <td className="px-6 py-4 text-muted-foreground" dir="ltr">{student.phone}</td>
                    <td className="px-6 py-4 text-emerald-100/80">الوجه {student.progress?.currentWajh || 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${((student.progress?.correctCount || 0) / 8) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono">{student.progress?.correctCount || 0}/8</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-accent">⭐ {student.progress?.totalStars || 0}</td>
                    <td className="px-6 py-4">
                      {student.progress?.waitingTeacher ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-accent/20 text-accent border border-accent/30">
                          ينتظر التسميع
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                          نشط
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-900/50 hover:bg-emerald-900/20 transition-colors">
                        إعادة كلمة المرور
                      </button>
                    </td>
                  </tr>
                ))}
                {(!filteredStudents || filteredStudents.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      لا يوجد طلاب مسجلون حالياً
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col items-start gap-3 border border-white/5">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-emerald-50 font-serif">{value}</div>
        <div className="text-xs font-medium text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}
