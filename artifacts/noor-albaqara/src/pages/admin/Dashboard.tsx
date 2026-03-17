import { useState } from "react";
import { useLocation } from "wouter";
import { ShieldAlert, Users, Star, UserPlus, Search, Trash2, KeyRound, CheckCircle2, X } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useGetSupervisors, useGetStudents } from "@workspace/api-client-react";
import { useCreateSupervisor, useDeleteSupervisor, useDeleteStudent, useResetStudentPassword } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Modal } from "@/components/ui/Modal";

export default function AdminDashboard() {
  const { user, role } = useAuthStore();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"students" | "supervisors">("supervisors");
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [addSupModal, setAddSupModal] = useState(false);
  const [newSup, setNewSup] = useState({ name: "", phone: "", password: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "student" | "supervisor"; id: number; name: string } | null>(null);
  const [resetModal, setResetModal] = useState<{ open: boolean; studentId: number | null; studentName: string }>({ open: false, studentId: null, studentName: "" });
  const [newPassword, setNewPassword] = useState("");

  if (!user || role !== "admin") { setLocation("/"); return null; }

  const { data: supervisors, isLoading: supLoading, refetch: refetchSup } = useGetSupervisors();
  const { data: students, isLoading: stuLoading, refetch: refetchStu } = useGetStudents();

  const createSupMut = useCreateSupervisor();
  const deleteSupMut = useDeleteSupervisor();
  const deleteStuMut = useDeleteStudent();
  const resetPasswordMut = useResetStudentPassword();

  if (supLoading || stuLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  }

  const totalStars = students?.reduce((acc, s) => acc + (s.progress?.totalStars || 0), 0) || 0;
  const filteredStudents = students?.filter(s => s.name.includes(search) || s.phone.includes(search)) || [];

  const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

  const handleAddSupervisor = async () => {
    if (!newSup.name || !newSup.phone || !newSup.password) return;
    try {
      await createSupMut.mutateAsync(newSup);
      await refetchSup();
      setAddSupModal(false);
      setNewSup({ name: "", phone: "", password: "" });
      flash("تم إضافة المشرف بنجاح");
    } catch (e: any) { alert(e.message || "حدث خطأ"); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === "supervisor") {
        await deleteSupMut.mutateAsync(deleteConfirm.id);
        await refetchSup();
        flash(`تم حذف المشرف ${deleteConfirm.name}`);
      } else {
        await deleteStuMut.mutateAsync(deleteConfirm.id);
        await refetchStu();
        flash(`تم حذف الطالب ${deleteConfirm.name}`);
      }
      setDeleteConfirm(null);
    } catch (e: any) { alert(e.message || "حدث خطأ"); }
  };

  const handleResetPassword = async () => {
    if (!resetModal.studentId || !newPassword.trim()) return;
    try {
      await resetPasswordMut.mutateAsync({ studentId: resetModal.studentId, newPassword });
      setResetModal({ open: false, studentId: null, studentName: "" });
      setNewPassword("");
      flash(`تم تغيير كلمة مرور ${resetModal.studentName}`);
    } catch (e: any) { alert(e.message || "حدث خطأ"); }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-emerald-50 mb-2 flex items-center gap-3">
            لوحة المدير
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 align-middle">صلاحية كاملة</span>
          </h1>
          {successMsg && (
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400 bg-primary/10 border border-primary/20 px-4 py-3 rounded-xl">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={<ShieldAlert className="w-6 h-6 text-accent" />} label="إجمالي المشرفين" value={(supervisors?.length || 0).toString()} />
          <StatCard icon={<Users className="w-6 h-6 text-emerald-400" />} label="إجمالي الطلاب" value={(students?.length || 0).toString()} />
          <StatCard icon={<Star className="w-6 h-6 text-amber-400" />} label="مجموع النجوم" value={totalStars.toString()} />
          <StatCard icon={<Users className="w-6 h-6 text-blue-400" />} label="ينتظرون التسميع" value={(students?.filter(s => s.progress?.waitingTeacher).length || 0).toString()} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6">
          {(["supervisors", "students"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch(""); }}
              className={`pb-4 px-6 font-bold text-sm transition-all ${activeTab === tab
                ? tab === "supervisors" ? "text-accent border-b-2 border-accent" : "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-white"}`}
            >
              {tab === "supervisors" ? "إدارة المشرفين" : "إدارة الطلاب"}
            </button>
          ))}
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
          {/* Table Header */}
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02]">
            <h2 className="text-lg font-bold text-emerald-50">
              {activeTab === "supervisors" ? "المشرفون المسجلون" : "جميع الطلاب"}
            </h2>
            <div className="flex w-full sm:w-auto items-center gap-3">
              {activeTab === "students" && (
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو الرقم..."
                    className="w-full bg-background border border-white/10 rounded-xl py-2 pr-10 pl-4 text-sm text-emerald-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              )}
              {activeTab === "supervisors" && (
                <button
                  onClick={() => setAddSupModal(true)}
                  className="flex items-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                >
                  <UserPlus className="w-4 h-4" /> إضافة مشرف
                </button>
              )}
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
                  {supervisors?.map(sup => (
                    <tr key={sup.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold text-emerald-50">{sup.name}</td>
                      <td className="px-6 py-4 text-muted-foreground" dir="ltr">{sup.phone}</td>
                      <td className="px-6 py-4 text-emerald-100/80">{sup.studentCount || 0} طلاب</td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(sup.createdAt).toLocaleDateString("ar-SA")}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setDeleteConfirm({ type: "supervisor", id: sup.id, name: sup.name })}
                          className="flex items-center gap-1.5 text-xs font-bold text-destructive hover:text-red-300 px-3 py-1.5 rounded-lg border border-destructive/30 hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!supervisors || supervisors.length === 0) && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">لا يوجد مشرفون حالياً</td></tr>
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
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold text-emerald-50">{student.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{student.country || "—"}</td>
                      <td className="px-6 py-4 text-emerald-100/80">الوجه {student.progress?.currentWajh || 1}</td>
                      <td className="px-6 py-4 font-bold text-accent">⭐ {student.progress?.totalStars || 0}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {supervisors?.find(s => s.id === student.supervisorId)?.name || "غير محدد"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setResetModal({ open: true, studentId: student.id, studentName: student.name }); setNewPassword(""); }}
                            className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 px-2.5 py-1.5 rounded-lg border border-emerald-900/50 hover:bg-emerald-900/20 transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" /> كلمة المرور
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: "student", id: student.id, name: student.name })}
                            className="flex items-center gap-1 text-xs font-bold text-destructive hover:text-red-300 px-2.5 py-1.5 rounded-lg border border-destructive/30 hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">لا يوجد طلاب حالياً</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Modal: إضافة مشرف */}
      <Modal isOpen={addSupModal} onClose={() => setAddSupModal(false)} title="إضافة مشرف جديد" icon={<UserPlus className="w-5 h-5" />}>
        <div className="space-y-4">
          {[
            { label: "الاسم الكامل *", key: "name", type: "text", placeholder: "مشرف البقرة" },
            { label: "رقم الهاتف *", key: "phone", type: "tel", placeholder: "05xxxxxxxx" },
            { label: "كلمة المرور *", key: "password", type: "text", placeholder: "كلمة المرور" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-sm font-medium text-emerald-100/80">{label}</label>
              <input
                type={type} dir={type === "tel" ? "ltr" : undefined}
                value={newSup[key as keyof typeof newSup]}
                onChange={e => setNewSup({ ...newSup, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-input/50 border border-white/10 rounded-xl py-3 px-4 text-emerald-50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              />
            </div>
          ))}
          <button
            onClick={handleAddSupervisor}
            disabled={!newSup.name || !newSup.phone || !newSup.password || createSupMut.isPending}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-amber-600 text-white font-bold hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            {createSupMut.isPending ? "جاري الإضافة..." : "إضافة المشرف"}
          </button>
        </div>
      </Modal>

      {/* Modal: تأكيد الحذف */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="تأكيد الحذف" icon={<Trash2 className="w-5 h-5 text-destructive" />}>
        <div className="space-y-6 text-center">
          <p className="text-emerald-100/80 text-sm leading-loose">
            هل أنت متأكد من حذف <strong className="text-destructive">{deleteConfirm?.name}</strong>؟<br />
            لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleteSupMut.isPending || deleteStuMut.isPending}
              className="flex-1 py-3 rounded-xl bg-destructive text-white font-bold hover:bg-destructive/80 transition-all disabled:opacity-50"
            >
              {(deleteSupMut.isPending || deleteStuMut.isPending) ? "جاري الحذف..." : "نعم، احذف"}
            </button>
            <button onClick={() => setDeleteConfirm(null)} className="px-5 py-3 rounded-xl border border-white/10 text-muted-foreground hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: إعادة كلمة المرور (للمدير) */}
      <Modal isOpen={resetModal.open} onClose={() => setResetModal({ open: false, studentId: null, studentName: "" })} title={`إعادة كلمة مرور: ${resetModal.studentName}`} icon={<KeyRound className="w-5 h-5" />}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-emerald-100/80">كلمة المرور الجديدة</label>
            <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
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
            <button onClick={() => setResetModal({ open: false, studentId: null, studentName: "" })} className="px-4 py-3 rounded-xl border border-white/10 text-muted-foreground hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
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
