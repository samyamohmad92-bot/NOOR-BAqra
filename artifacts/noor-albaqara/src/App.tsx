import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import AuthPage from "./pages/auth/AuthPage";
import StudentDashboard from "./pages/student/Dashboard";
import MemorizePage from "./pages/student/Memorize";
import HashdPage from "./pages/student/Hashd";
import SupervisorDashboard from "./pages/supervisor/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/dashboard" component={StudentDashboard} />
      <Route path="/memorize" component={MemorizePage} />
      <Route path="/hashd" component={HashdPage} />
      <Route path="/supervisor" component={SupervisorDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div dir="rtl" className="font-sans antialiased text-foreground min-h-screen bg-background">
            <Router />
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
