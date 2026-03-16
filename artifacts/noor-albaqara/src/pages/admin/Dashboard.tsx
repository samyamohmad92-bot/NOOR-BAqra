import { useState } from "react";
import { useLocation } from "wouter";
import { ShieldAlert, Users, Star, UserPlus, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useGetSupervisors, useGetStudents } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";

export default function AdminDashboard() {
  const { user, role } = useAuthStore();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"students" | "supervisors">("supervisors");

  if (!user || role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: supervisors, isLoading: supLoading } = useGetSupervisors();
  const { data: students, isLoading: stuLoading } = useGetStudents();

  if (supLoading || stuLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalStars = students?.reduce((acc, s) => acc + (s.progress?.totalStars || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-emerald-50 mb-2 flex items-center gap-3">
            لوحة المدير
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 align-middle">
              صلاحية كاملة
            </span>
          </h1>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={<ShieldAlert className="w-6 h-6 text-accent" />} label="إجمالي المشرفين" value={(supervisors?.length || 0).toString()} />
          <StatCard icon={<Users className="w-6 h-6 text-emerald-400" />} label="إجمالي الطلاب" value={(students?.length || 0).toString()} />
          <StatCard icon={<Star className="w-6 h-6 text-amber-400" />} label="مجموع النجوم" value={totalStars.toString()} />
          <StatCard icon={<Users className="w-6 h-6 text-blue-400" />} label="طلاب نشطون" value={(students?.filter(s=>s.progress?.correctCount && s.progress.correctCount > 0).length || 0).toString()} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6">
          <button 
            className={`pb-4 px-6 font-bold text-sm transition-all ${activeTab === "supervisors" ? "text-accent border-b-2 border-accent" : "text-muted-foreground hover:text-white"}`}
            onClick={() => setActiveTab("supervisors")}
          >
            إدارة المشرفين
          </button>
          <button 
            className={`pb-4 px-6 font-bold text-sm transition-all ${activeTab === "students" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-white"}`}
            onClick={() => setActiveTab("students")}
          >
            إدارة جميع الطلاب
          </button>
        </div>

        {/* Tab Content */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02]">
            <h2 className="text-lg font-bold text-emerald-50">
              {activeTab === "supervisors" ? "المشرفون المسجلون" : "جميع الطلاب"}
            </h2>
            
            <div className="flex w-full sm:w-auto items-center gap-3">
              {activeTab === "students" && (
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="ابحث بالاسم..." 
                    className="w-full bg-background border border-white/10 rounded-xl py-2 pr-10 pl-4 text-sm text-emerald-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              )}
              <button className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'supervisors' ? 'bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30' : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30'}`}>
                <UserPlus className="w-4 h-4" />
                {activeTab === "supervisors" ? "إضافة مشرف" : "إضافة طالب"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {activeTab === "supervisors" ? (
              <table className="w-full text-sm text-right">
                <thead className="bg-[#0A100D] text-muted-foreground border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-semibold">الاسم</th>
                    <th className="px-6 py-4 font-semibold">رقم الهاتف</th>
                    <th className="px-6 py-4 font-semibold">عدد الطلاب</th>
                    <th className="px-6 py-4 font-semibold">تاريخ الانضمام</th>
                    <th className="px-6 py-4 font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {supervisors?.map((sup) => (
                    <tr key={sup.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold text-emerald-50">{sup.name}</td>
                      <td className="px-6 py-4 text-muted-foreground" dir="ltr">{sup.phone}</td>
                      <td className="px-6 py-4 text-emerald-100/80">{sup.studentCount || 0} طلاب</td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(sup.createdAt).toLocaleDateString('ar-SA')}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button className="text-xs font-bold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-900/50 hover:bg-blue-900/20 transition-colors">تعديل</button>
                        <button className="text-xs font-bold text-destructive hover:text-red-300 px-3 py-1.5 rounded-lg border border-destructive/30 hover:bg-destructive/10 transition-colors">حذف</button>
                      </td>
                    </tr>
                  ))}
                  {(!supervisors || supervisors.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">لا يوجد مشرفون حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm text-right">
                <thead className="bg-[#0A100D] text-muted-foreground border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-semibold">الاسم</th>
                    <th className="px-6 py-4 font-semibold">البلد</th>
                    <th className="px-6 py-4 font-semibold">الوجه الحالي</th>
                    <th className="px-6 py-4 font-semibold">النجوم</th>
                    <th className="px-6 py-4 font-semibold">المشرف</th>
                    <th className="px-6 py-4 font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students?.map((student) => (
                    <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold text-emerald-50">{student.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{student.country || "-"}</td>
                      <td className="px-6 py-4 text-emerald-100/80">الوجه {student.progress?.currentWajh || 1}</td>
                      <td className="px-6 py-4 font-bold text-accent">⭐ {student.progress?.totalStars || 0}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {supervisors?.find(s => s.id === student.supervisorId)?.name || "غير محدد"}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button className="text-xs font-bold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-900/50 hover:bg-blue-900/20 transition-colors">تعديل</button>
                        <button className="text-xs font-bold text-destructive hover:text-red-300 px-3 py-1.5 rounded-lg border border-destructive/30 hover:bg-destructive/10 transition-colors">حذف</button>
                      </td>
                    </tr>
                  ))}
                  {(!students || students.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">لا يوجد طلاب حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
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
