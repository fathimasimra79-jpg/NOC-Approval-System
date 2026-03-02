import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { GraduationCap, Shield, ArrowRight, FileText } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuthContext();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'admin') setLocation('/admin/dashboard');
      else setLocation('/student/dashboard');
    }
  }, [isAuthenticated, user, isLoading, setLocation]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 w-full relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center p-4 bg-white shadow-xl shadow-primary/10 rounded-2xl mb-8 border border-border/50"
          >
            <FileText className="h-10 w-10 text-primary" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold font-display text-foreground mb-6"
          >
            University <span className="text-gradient">NOC</span> Portal
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Streamlined No Objection Certificate processing for internships and training programs.
          </motion.p>
        </div>

        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"
        >
          {/* Student Card */}
          <div className="glass-card rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 group">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <GraduationCap className="h-7 w-7 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">For Students</h2>
            <p className="text-muted-foreground mb-8">
              Apply for new NOCs, track your request status in real-time, and download approved certificates instantly.
            </p>
            <Link href="/student/login">
              <Button className="w-full rounded-xl h-12 text-md group" size="lg">
                Student Login <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Admin Card */}
          <div className="glass-card rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 group">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-7 w-7 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">For Administrators</h2>
            <p className="text-muted-foreground mb-8">
              Review incoming student requests, manage approvals efficiently, and generate official documentation.
            </p>
            <Link href="/admin/login">
              <Button variant="outline" className="w-full rounded-xl h-12 text-md border-2 hover:bg-primary/5 group" size="lg">
                Admin Access <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
