import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LogOut, GraduationCap, ShieldCheck } from "lucide-react";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuthContext();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <Link href="/" className="font-display font-bold text-xl tracking-tight text-foreground hover:opacity-80 transition-opacity">
              NOC Portal
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mr-4">
                  {user.role === 'admin' ? (
                    <>
                      <Link href="/admin/settings">
                        <Button variant="ghost" size="sm" className="rounded-xl mr-2 h-9 px-4">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </Link>
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </>
                  ) : null}
                  <span className="font-medium text-foreground">{user.name}</span>
                  {user.rollNumber && <span>({user.rollNumber})</span>}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout}
                  className="rounded-full px-4 border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
