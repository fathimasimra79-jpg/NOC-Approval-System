import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { useAllNocRequests, useApproveNoc, useRejectNoc } from "@/hooks/use-noc";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, Check, X, Building, Calendar, User as UserIcon, Settings } from "lucide-react";

export default function AdminDashboard() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthContext();
  const [, setLocation] = useLocation();
  
  const { data: requests, isLoading: reqsLoading } = useAllNocRequests();
  const approveMutation = useApproveNoc();
  const rejectMutation = useRejectNoc();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [rejectDialogId, setRejectDialogId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, authLoading, user, setLocation]);

  if (authLoading || reqsLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  const handleRejectSubmit = () => {
    if (rejectDialogId && rejectionReason) {
      rejectMutation.mutate({ id: rejectDialogId, rejectionReason }, {
        onSuccess: () => {
          setRejectDialogId(null);
          setRejectionReason("");
        }
      });
    }
  };

  const filteredRequests = requests?.filter(req => {
    const matchesSearch = req.student?.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.student?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Show Pending first
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col gap-2 mb-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Management Console</h1>
              <p className="text-muted-foreground">Review and process student NOC applications</p>
            </div>
            <Link href="/admin/settings">
              <Button variant="outline" className="rounded-xl border-border/50 shadow-sm bg-card hover:bg-muted/50">
                <Settings className="h-4 w-4 mr-2" />
                Admin Settings
              </Button>
            </Link>
          </div>
        </div>

        <Card className="bg-card shadow-sm border-border/50 rounded-2xl mb-8 overflow-hidden">
          <div className="p-4 bg-muted/30 border-b border-border/40 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Roll Number or Name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 rounded-xl bg-background border-border/50"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 rounded-xl bg-background border-border/50">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Requests</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="divide-y divide-border/40">
            {filteredRequests?.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No requests found matching your filters.</div>
            ) : (
              <AnimatePresence>
                {filteredRequests?.map((req) => (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key={req.id} 
                    className="p-6 hover:bg-muted/10 transition-colors flex flex-col lg:flex-row gap-6 lg:items-center"
                  >
                    {/* Student Info */}
                    <div className="w-full lg:w-[250px] shrink-0">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground leading-tight">{req.student?.name}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{req.student?.rollNumber}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[11px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full font-medium">{req.student?.department}</span>
                            <span className="text-[11px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full font-medium">{req.student?.year}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">Organization</p>
                        <p className="font-medium flex items-center"><Building className="h-4 w-4 mr-2 text-muted-foreground" /> {req.companyName}</p>
                        <p className="text-sm text-muted-foreground mt-2 flex items-center"><Calendar className="h-4 w-4 mr-2" /> {req.duration}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">Purpose</p>
                        <p className="text-sm text-foreground/80 line-clamp-2">{req.reason}</p>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="w-full lg:w-[200px] shrink-0 flex flex-col lg:items-end gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-border/40">
                      <StatusBadge status={req.status} />
                      
                      {req.status === 'Pending' && (
                        <div className="flex gap-2 mt-2 w-full justify-end">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full lg:w-auto rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => setRejectDialogId(req.id)}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                          <Button 
                            size="sm" 
                            className="w-full lg:w-auto rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            onClick={() => handleApprove(req.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </Card>

        {/* Reject Dialog */}
        <Dialog open={!!rejectDialogId} onOpenChange={(open) => !open && setRejectDialogId(null)}>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-rose-600 flex items-center"><X className="h-5 w-5 mr-2" /> Reject Application</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this NOC application. The student will be able to see this reason.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea 
                placeholder="Enter rejection reason..." 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="h-24 resize-none rounded-xl focus-visible:ring-rose-500"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRejectDialogId(null)} className="rounded-xl">Cancel</Button>
              <Button variant="destructive" onClick={handleRejectSubmit} disabled={!rejectionReason || rejectMutation.isPending} className="rounded-xl bg-rose-600 hover:bg-rose-700">
                {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
