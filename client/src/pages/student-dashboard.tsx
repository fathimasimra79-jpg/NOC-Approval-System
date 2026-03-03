import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { useMyNocRequests, useApplyNoc } from "@/hooks/use-noc";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Download, Building2, CalendarDays, FileText, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
import { jsPDF } from "jspdf";

const applySchema = api.noc.apply.input;

export default function StudentDashboard() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthContext();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: requests, isLoading: reqsLoading } = useMyNocRequests();
  const applyMutation = useApplyNoc();

  const form = useForm<z.infer<typeof applySchema>>({
    resolver: zodResolver(applySchema),
    defaultValues: { companyName: "", duration: "", reason: "" },
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'student')) {
      setLocation("/student/login");
    }
  }, [isAuthenticated, authLoading, user, setLocation]);

  const generatePDF = async (studentData: any, adminSettings: any) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    const loadImage = async (path: string) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load image: ${path}`);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    };

    // ===== LOGO (Top Left) =====
    if (adminSettings.logoPath) {
      try {
        const logoBase64 = await loadImage(adminSettings.logoPath) as string;
        doc.addImage(logoBase64, "PNG", 20, 15, 45, 20);
      } catch (e) {
        console.error("Logo load failed", e);
      }
    }

    // ===== TITLE =====
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.text("No Objection Certificate", pageWidth / 2, 45, {
      align: "center",
    });

    // ===== HORIZONTAL LINE =====
    doc.setLineWidth(0.5);
    doc.line(20, 52, 190, 52);

    let y = 65;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    // ===== STUDENT DETAILS =====
    doc.text(`Student Name: ${studentData.name}`, 20, y);
    y += 9;

    doc.text(`Roll Number: ${studentData.rollNumber}`, 20, y);
    y += 9;

    doc.text(`Department: ${studentData.department}`, 20, y);
    y += 9;

    doc.text(`Purpose: ${studentData.reason}`, 20, y);
    y += 18;

    // ===== EXACT PARAGRAPH STYLE =====
    const paragraph = `
This is to certify that ${studentData.name}, bearing roll number ${studentData.rollNumber}, from the ${studentData.department} Department, is a student in good academic standing and has consistently demonstrated excellent performance. The institution has no objection to internship. This certificate is issued on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} and is valid for official purpose.
    `;

    const splitText = doc.splitTextToSize(paragraph.trim(), 170);
    doc.text(splitText, 20, y);

    y += splitText.length * 7 + 25;

    // ===== DATE (Left Bottom) =====
    doc.setFont("helvetica", "bold");
    doc.text(
      `Date of Issue: ${new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`,
      20,
      y
    );

    // ===== SIGNATURE (Right Bottom) =====
    const signY = y + 5;

    if (adminSettings.signaturePath) {
      try {
        const signBase64 = await loadImage(adminSettings.signaturePath) as string;
        doc.addImage(signBase64, "PNG", 135, signY - 15, 40, 20);
      } catch (e) {
        console.error("Signature load failed", e);
      }
    }

    doc.setLineWidth(0.5);
    doc.line(130, signY + 10, 185, signY + 10);
    doc.setFont("helvetica", "normal");
    doc.text("Authorized Signatory", 145, signY + 18);

    doc.save(`NOC_${studentData.rollNumber}.pdf`);
  };

  const handleDownloadNOC = async (req: any) => {
    try {
      const response = await fetch("/api/admin/settings", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('noc_token')}`
        }
      });
      const settings = await response.json();
      await generatePDF(user ? { ...req, ...user } : req, settings);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  if (authLoading || reqsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const onSubmit = (data: z.infer<typeof applySchema>) => {
    applyMutation.mutate(data, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
      },
    });
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">My Applications</h1>
            <p className="text-muted-foreground mt-1">Manage and track your NOC requests</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-6 shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:-translate-y-0.5">
                <Plus className="h-4 w-4 mr-2" /> New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Apply for NOC</DialogTitle>
                <DialogDescription>
                  Provide details about your internship or training program.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
                  <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company/Organization Name</FormLabel>
                      <FormControl><Input placeholder="Acme Corp" className="h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="duration" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl><Input placeholder="e.g., 3 Months (June - Aug)" className="h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="reason" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason/Description</FormLabel>
                      <FormControl><Textarea placeholder="Briefly describe your role and objectives..." className="resize-none h-24 rounded-xl bg-muted/50 border-transparent focus:bg-background" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                    <Button type="submit" disabled={applyMutation.isPending} className="rounded-xl px-6">
                      {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Application"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {requests?.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-card rounded-3xl border border-border/50 border-dashed">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No applications yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">You haven't requested any No Objection Certificates. Click the button above to start your first application.</p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="rounded-xl">Start Application</Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {requests?.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full flex flex-col hover:shadow-xl hover:border-primary/20 transition-all duration-300 rounded-2xl overflow-hidden group">
                    <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                      <div className="flex justify-between items-start mb-2">
                        <StatusBadge status={req.status} />
                        <span className="text-xs text-muted-foreground font-medium">
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors">{req.companyName}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 flex-grow space-y-4">
                      <div className="flex items-center text-sm text-foreground/80">
                        <CalendarDays className="h-4 w-4 mr-3 text-muted-foreground" />
                        {req.duration}
                      </div>
                      <div className="flex items-start text-sm text-foreground/80">
                        <Building2 className="h-4 w-4 mr-3 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{req.reason}</span>
                      </div>
                      
                      {req.status === 'Rejected' && req.rejectionReason && (
                        <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-xl text-sm border border-red-100 flex items-start">
                          <AlertCircle className="h-4 w-4 mr-2 shrink-0 mt-0.5 text-red-500" />
                          <span><span className="font-semibold">Reason:</span> {req.rejectionReason}</span>
                        </div>
                      )}
                    </CardContent>
                    
                    {req.status === 'Approved' && (
                      <CardFooter className="pt-0 pb-5 px-5">
                        <Button 
                          className="w-full rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 shadow-none"
                          onClick={() => handleDownloadNOC(req)}
                        >
                          <Download className="h-4 w-4 mr-2" /> Download Certificate
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
