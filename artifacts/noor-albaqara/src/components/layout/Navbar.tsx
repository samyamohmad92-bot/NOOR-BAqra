import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/store/auth";
import { BookOpen, LogOut, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const { user, role, logout } = useAuthStore();
  const [, setLocation] = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const getDashboardLink = () => {
    switch (role) {
      case "admin": return "/admin";
      case "supervisor": return "/supervisor";
      default: return "/dashboard";
    }
  };

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass-panel border-b border-white/5 px-4 md:px-8 h-16 flex items-center justify-between"
    >
      <Link href={getDashboardLink()} className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-800 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold text-emerald-50 leading-none">نور البقرة</h1>
          <p className="text-[10px] text-emerald-400/80">منصة الحفظ المتقن</p>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-full border border-white/5">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-emerald-50 leading-none">{user.name || "مدير النظام"}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {role === 'student' ? 'طالب' : role === 'supervisor' ? 'مشرف' : 'مدير'}
            </span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="تسجيل الخروج"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </motion.nav>
  );
}
