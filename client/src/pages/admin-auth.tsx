import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminLogin } from "@/hooks/use-auth";
import { api } from "@shared/routes";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { Link } from "wouter";

const loginSchema = api.auth.login.input;

export default function AdminAuth() {
  const [, setLocation] = useLocation();
  const loginMutation = useAdminLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data, {
      onSuccess: () => setLocation("/admin/dashboard"),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-950 p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

      <Link href="/" className="absolute top-8 left-8 text-white/70 hover:text-white flex items-center transition-colors z-10">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
      </Link>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
        <Card className="border-white/10 bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl text-white">
          <CardHeader className="text-center pb-6 pt-10">
            <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-blue-300" />
            </div>
            <CardTitle className="font-display text-3xl font-bold">Admin Portal</CardTitle>
            <CardDescription className="text-white/60 text-base mt-2">Secure access for staff</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@university.edu" className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-white/20" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-white/20" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full h-12 rounded-xl mt-8 text-md bg-white text-indigo-950 hover:bg-white/90 font-semibold" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Authenticate"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
