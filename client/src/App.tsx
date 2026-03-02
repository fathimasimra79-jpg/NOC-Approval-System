import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";

import Home from "./pages/home";
import StudentAuth from "./pages/student-auth";
import AdminAuth from "./pages/admin-auth";
import StudentDashboard from "./pages/student-dashboard";
import AdminDashboard from "./pages/admin-dashboard";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/student/login" component={StudentAuth} />
      <Route path="/admin/login" component={AdminAuth} />
      
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
