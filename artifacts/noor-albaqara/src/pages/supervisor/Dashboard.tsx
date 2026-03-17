import { useState } from "react";
import { useLocation } from "wouter";
import { Users, UserCheck, Trophy, Search, Plus, KeyRound, X, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useGetStudents } from "@workspace/api-client-react";
import { useResetStudentPassword, useCreateStudent } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Modal } from "@/components/ui/Modal";

export default function SupervisorDashboard() {
  const { user, role } = useAuthStore();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [resetModal, setResetModal] = useState<{ open: boolean; studentId: number | null; studentName: string }>({ open: false, studentId: null, studentName: "" });
  const [addStudentModal, setAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", phone: "", password: "", country: "", gender: "male", tajweedLevel: "beginner" });
  const [newPassword, setNewPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!user || role !== "supervisor") { setLocation("/"); return null; }

  const { data: students, isLoading, refetch } = useGetStudents();
  const resetPasswordMut = useResetStudentPassword();
  const createStudentMut = useCreateStudent();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const totalStudents = students?.length || 0;
  const activeStudents = students?.filter(s => (s.progress?.correctCount || 0) > 0).length || 0;
  const waitingTeacher = students?.filter(s => s.progress?.waitingTeacher).length || 0;
  const totalHashd = students?.reduce((acc, s) => acc + (s.progress?.hashdCompleted || 0), 0) || 0;

  const filtered = students?.filter(s =>
    s.name.includes(searchTerm) || s.phone.includes(searchTerm)
  ) || [];

  const handleResetPassword = async () => {
    if (!resetModal.studentId || !newPassword.trim()) return;
    try {
      await resetPasswordMut.mutateAsync({ studentId: resetModal.studentId, newPassword });
      setResetModal({ open: false, studentId: null, studentName: "" });
      setNewPassword("");
      setSuccessMsg(`تم تغيير كلمة مرور ${resetModal.studentName} بنجاح`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e: any) {
      alert(e.message || "حدث خطأ");
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.phone || !newStudent.password) return;
    try {
      await createStudentMut.mutateAsync({ ...newStudent });
      await refetch();
      setAddStudentModal(false);
      setNewStudent({ name: "", phone: "", password: "", country: "", gender: "male", tajweedLevel: "beginner" });
      setSuccessMsg("تم إضافة الطالب بنجاح");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e: any) {
      alert(e.message || "حدث خطأ");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-emerald-50 mb-2 flex items-center gap-3">
            لوحة المشرف
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 align-middle">نطاق الصلاحية</span>
          </h1>
          {successMsg && (
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400 bg-primary/10 border border-primary/20 px-4 py-3 rounded-xl">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={<Users className="w-6 h-6 text-emerald-400" />} label="إجمالي الطلاب" value={totalStudents.toString()} />
          <StatCard icon={<UserCheck className="w-6 h-6 text-blue-400" />} label="طلاب نشطون" value={activeStudents.toString()} />
          <StatCard icon={<Trophy className="w-6 h-6 text-accent" />} label="ينتظرون التسميع" value={waitingTeacher.toString()} />
          <StatCard icon={<Trophy className="w-6 h-6 text-purple-400" />} label="حشود مكتملة" value={totalHashd.toString()} />
        </div>

        {/* Table */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02]">
            <h2 className="text-lg font-bold text-emerald-50">الطلاب المسجلون</h2>
            <div className="flex w-full sm:w-auto items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="ابحث بالاسم أو الرقم..."
                  className="w-full bg-background border border-white/10 rounded-xl py-2 pr-10 pl-4 text-sm text-emerald-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <button
                onClick={() => setAddStudentModal(true)}
                className="flex-shrink-0 flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              >
                <Plus className="w-4 h-4" /> إضافة طالب
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
                  <th className="px-6 py-4 font-semibold">التقدم</th>
                  <th className="px-6 py-4 font-semibold">النجوم</th>
                  <th className="px-6 py-4 font-semibold">الحالة</th>
                  <th className="px-6 py-4 font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-bold text-emerald-50">{student.name}</td>
                    <td className="px-6 py-4 text-muted-foreground" dir="ltr">{student.phone}</td>
                    <td className="px-6 py-4 text-emerald-100/80">الوجه {student.progress?.currentWajh || 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${((student.progress?.correctCount || 0) / 8) * 100}%` }} />
                        </div>
                        <span className="text-xs font-mono">{student.progress?.correctCount || 0}/8</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-accent">⭐ {student.progress?.totalStars || 0}</td>
                    <td className="px-6 py-4">
                      {student.progress?.waitingTeacher ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-accent/20 text-accent border border-accent/30">ينتظر التسميع</span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">نشط</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => { setResetModal({ open: true, studentId: student.id, studentName: student.name }); setNewPassword(""); }}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-900/50 hover:bg-emerald-900/20 transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> إعادة كلمة المرور
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">لا يوجد طلاب مسجلون حالياً</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal: إعادة كلمة المرور */}
      <Modal
        isOpen={resetModal.open}
        onClose={() => setResetModal({ open: false, studentId: null, studentName: "" })}
        title={`إعادة كلمة مرور: ${resetModal.studentName}`}
        icon={<KeyRound className="w-5 h-5" />}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-emerald-100/80">كلمة المرور الجديدة</label>
            <input
              type="text"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="اكتب كلمة المرور الجديدة"
              className="w-full bg-input/50 border border-white/10 rounded-xl py-3 px-4 text-emerald-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleResetPassword}
              disabled={!newPassword.trim() || resetPasswordMut.isPending}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/80 transition-all disabled:opacity-50"
            >
              {resetPasswordMut.isPending ? "جاري الحفظ..." : "تأكيد التغيير"}
            </button>
            <button
              onClick={() => setResetModal({ open: false, studentId: null, studentName: "" })}
              className="px-4 py-3 rounded-xl border border-white/10 text-muted-foreground hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: إضافة طالب */}
      <Modal
        isOpen={addStudentModal}
        onClose={() => setAddStudentModal(false)}
        title="إضافة طالب جديد"
        icon={<Plus className="w-5 h-5" />}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-emerald-100/70">الاسم الكامل *</label>
              <input type="text" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                placeholder="محمد أحمد الرشيد" className="w-full bg-input/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-emerald-50 focus:border-primary outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-emerald-100/70">رقم الهاتف *</label>
              <input type="tel" dir="ltr" value={newStudent.phone} onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                placeholder="05xxxxxxxx" className="w-full bg-input/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-emerald-50 focus:border-primary outline-none text-right" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-emerald-100/70">كلمة المرور *</label>
              <input type="text" value={newStudent.password} onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
                placeholder="كلمة المرور" className="w-full bg-input/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-emerald-50 focus:border-primary outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-emerald-100/70">البلد</label>
              <input type="text" value={newStudent.country} onChange={e => setNewStudent({ ...newStudent, country: e.target.value })}
                placeholder="السعودية" className="w-full bg-input/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-emerald-50 focus:border-primary outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-emerald-100/70">الجنس</label>
              <select value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })}
                className="w-full bg-input/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-emerald-50 focus:border-primary outline-none appearance-none">
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-emerald-100/70">مستوى التجويد</label>
              <select value={newStudent.tajweedLevel} onChange={e => setNewStudent({ ...newStudent, tajweedLevel: e.target.value })}
                className="w-full bg-input/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-emerald-50 focus:border-primary outline-none appearance-none">
                <option value="beginner">مبتدئ</option>
                <option value="intermediate">متوسط</option>
                <option value="advanced">متقدم</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleAddStudent}
            disabled={!newStudent.name || !newStudent.phone || !newStudent.password || createStudentMut.isPending}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-emerald-700 text-white font-bold hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            {createStudentMut.isPending ? "جاري الإضافة..." : "إضافة الطالب"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col items-start gap-3 border border-white/5">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-emerald-50 font-serif">{value}</div>
        <div className="text-xs font-medium text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}
