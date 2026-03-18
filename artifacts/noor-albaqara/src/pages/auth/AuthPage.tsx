import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, User, Lock, Phone, Globe, Shield, Star } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { 
  useStudentLogin, 
  useStudentRegister, 
  useSupervisorLogin, 
  useAdminLogin 
} from "@workspace/api-client-react";

type AuthMode = "student-login" | "student-register" | "supervisor" | "admin";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("student-login");
  const { user, login } = useAuthStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      // redirect if already logged in
      const role = useAuthStore.getState().role;
      if (role === 'admin') setLocation('/admin');
      else if (role === 'supervisor') setLocation('/supervisor');
      else setLocation('/dashboard');
    }
  }, [user, setLocation]);

  const [formData, setFormData] = useState({
    name1: "", name2: "", phone: "", password: "", country: "", gender: "male", tajweedLevel: "beginner"
  });

  const [errorMsg, setErrorMsg] = useState("");

  // مسح الحقول عند تغيير الوضع
  useEffect(() => {
    setFormData(f => ({ ...f, phone: "", password: "" }));
    setErrorMsg("");
  }, [mode]);

  const studentLoginMut = useStudentLogin();
  const studentRegMut = useStudentRegister();
  const supervisorMut = useSupervisorLogin();
  const adminMut = useAdminLogin();

  const isPending = studentLoginMut.isPending || studentRegMut.isPending || supervisorMut.isPending || adminMut.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      if (mode === "student-login") {
        const res = await studentLoginMut.mutateAsync({ data: { phone: formData.phone, password: formData.password } });
        login(res, "student");
        setLocation("/dashboard");
      } else if (mode === "student-register") {
        const fullName = `${formData.name1} ${formData.name2}`.trim();
        if (!fullName || !formData.phone || !formData.password) {
          setErrorMsg("يرجى تعبئة جميع الحقول الإلزامية");
          return;
        }
        const res = await studentRegMut.mutateAsync({
          data: {
            name: fullName,
            phone: formData.phone,
            password: formData.password,
            country: formData.country,
            gender: formData.gender,
            tajweedLevel: formData.tajweedLevel
          }
        });
        login(res, "student");
        setLocation("/dashboard");
      } else if (mode === "supervisor") {
        const res = await supervisorMut.mutateAsync({ data: { phone: formData.phone, password: formData.password } });
        login(res.supervisor, "supervisor");
        setLocation("/supervisor");
      } else if (mode === "admin") {
        const res = await adminMut.mutateAsync({ data: { phone: formData.phone, password: formData.password } });
        login({ name: "Admin User", role: "admin", ...res }, "admin");
        setLocation("/admin");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء تسجيل الدخول");
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "student-login": return "تسجيل الدخول";
      case "student-register": return "حساب جديد";
      case "supervisor": return "بوابة المشرف";
      case "admin": return "بوابة المدير";
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Left side - Form */}
      <div className="w-full md:w-[450px] lg:w-[500px] shrink-0 p-6 md:p-10 flex flex-col justify-center relative z-10">
        <div className="w-full max-w-md mx-auto">
          
          <div className="mb-8 text-center md:text-right">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-800 flex items-center justify-center shadow-xl shadow-primary/20 mb-6 mx-auto md:mx-0">
              <BookOpen className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-emerald-50 mb-2">نور البقرة _ أكاديمية العروة الوثقى</h1>
            <p className="text-muted-foreground">منصة الحفظ المتقن لسورة البقرة _ أ.سامية محمد</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl relative">
            <h2 className="text-xl font-bold text-emerald-50 mb-6 flex items-center gap-2">
              {mode === 'supervisor' && <Shield className="w-5 h-5 text-accent" />}
              {mode === 'admin' && <Star className="w-5 h-5 text-accent" />}
              {getTitle()}
            </h2>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "student-register" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-emerald-100/80 ml-1">الاسم الأول والثاني</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute right-3 top-3.5 text-muted-foreground" />
                      <input 
                        required
                        type="text" 
                        value={formData.name1}
                        onChange={e => setFormData({...formData, name1: e.target.value})}
                        className="w-full bg-input/50 border border-white/5 rounded-xl py-3 pr-10 pl-4 text-emerald-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                        placeholder="محمد أحمد" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-emerald-100/80 ml-1">الاسم الثالث والرابع</label>
                    <input 
                      type="text" 
                      value={formData.name2}
                      onChange={e => setFormData({...formData, name2: e.target.value})}
                      className="w-full bg-input/50 border border-white/5 rounded-xl py-3 px-4 text-emerald-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                      placeholder="علي الحسن" 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-100/80 ml-1">
                  {mode === "admin" ? "اسم المستخدم" : "رقم الهاتف"}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute right-3 top-3.5 text-muted-foreground" />
                  <input 
                    required
                    type={mode === "admin" ? "text" : "tel"}
                    dir="ltr"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-input/50 border border-white/5 rounded-xl py-3 pr-10 pl-4 text-emerald-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-right" 
                    placeholder={mode === "admin" ? "admin" : "05xxxxxxxx"}
                  />
                </div>
              </div>

              {mode === "student-register" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-emerald-100/80 ml-1">الجنس</label>
                      <select 
                        value={formData.gender}
                        onChange={e => setFormData({...formData, gender: e.target.value})}
                        className="w-full bg-input/50 border border-white/5 rounded-xl py-3 px-4 text-emerald-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                      >
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-emerald-100/80 ml-1">البلد</label>
                      <div className="relative">
                        <Globe className="w-4 h-4 absolute right-3 top-3.5 text-muted-foreground" />
                        <input 
                          type="text" 
                          value={formData.country}
                          onChange={e => setFormData({...formData, country: e.target.value})}
                          className="w-full bg-input/50 border border-white/5 rounded-xl py-3 pr-10 pl-4 text-emerald-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                          placeholder="السعودية" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-emerald-100/80 ml-1">مستوى التجويد</label>
                    <select 
                      value={formData.tajweedLevel}
                      onChange={e => setFormData({...formData, tajweedLevel: e.target.value})}
                      className="w-full bg-input/50 border border-white/5 rounded-xl py-3 px-4 text-emerald-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                    >
                      <option value="beginner">مبتدئ</option>
                      <option value="intermediate">متوسط</option>
                      <option value="advanced">متقدم</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-100/80 ml-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute right-3 top-3.5 text-muted-foreground" />
                  <input 
                    required
                    type="password" 
                    dir="ltr"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-input/50 border border-white/5 rounded-xl py-3 pr-10 pl-4 text-emerald-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-right" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isPending}
                className="w-full mt-6 py-3.5 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-emerald-700 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:from-primary hover:to-primary active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "جاري المعالجة..." : "دخول"}
              </button>
            </form>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 text-sm font-medium">
            {mode.startsWith("student") ? (
              <>
                <button 
                  onClick={() => setMode(mode === "student-login" ? "student-register" : "student-login")}
                  className="text-primary hover:text-emerald-300 transition-colors"
                >
                  {mode === "student-login" ? "ليس لديك حساب؟ سجل الآن" : "لديك حساب بالفعل؟ سجل دخولك"}
                </button>
                <div className="flex gap-6 mt-4 pt-4 border-t border-white/10 w-full justify-center text-muted-foreground">
                  <button onClick={() => setMode("supervisor")} className="hover:text-emerald-400 transition-colors">بوابة المشرف</button>
                  <button onClick={() => setMode("admin")} className="hover:text-emerald-400 transition-colors">بوابة المدير</button>
                </div>
              </>
            ) : (
              <button 
                onClick={() => setMode("student-login")}
                className="text-primary hover:text-emerald-300 transition-colors mt-4"
              >
                العودة إلى بوابة الطلاب &rarr;
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Right side - Hero Image */}
      <div className="hidden md:block flex-1 relative bg-[#06100a]">
        <div className="absolute inset-0 bg-gradient-to-l from-background via-background/60 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10"></div>
        <img 
          src={`${import.meta.env.BASE_URL}images/quran-hero.png`} 
          alt="Quran Hero" 
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
