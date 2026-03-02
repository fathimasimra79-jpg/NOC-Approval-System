import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudentLogin, useStudentRegister } from "@/hooks/use-auth";
import { api } from "@shared/routes";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

const loginSchema = api.auth.login.input;
const registerSchema = api.auth.register.input;

export default function StudentAuth() {
  const [, setLocation] = useLocation();
  const loginMutation = useStudentLogin();
  const registerMutation = useStudentRegister();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "", email: "", password: "",
      rollNumber: "", department: "", year: "",
      role: "student"
    },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data, {
      onSuccess: () => setLocation("/student/dashboard"),
    });
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data, {
      onSuccess: () => setLocation("/student/dashboard"),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Link href="/" className="absolute top-8 left-8 text-muted-foreground hover:text-foreground flex items-center transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="premium-shadow border-border/50 bg-card rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2 pt-8">
            <CardTitle className="font-display text-3xl font-bold">Student Portal</CardTitle>
            <CardDescription>Access your NOC dashboard</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/50 rounded-xl p-1">
                <TabsTrigger value="login" className="rounded-lg py-2">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg py-2">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 animate-in fade-in-50 zoom-in-95 duration-300">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField control={loginForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="student@university.edu" className="h-12 rounded-xl bg-muted/50 border-transparent focus:bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={loginForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-muted/50 border-transparent focus:bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full h-12 rounded-xl mt-6 text-md shadow-lg shadow-primary/20" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 animate-in fade-in-50 zoom-in-95 duration-300">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={registerForm.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input placeholder="John Doe" className="h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={registerForm.control} name="rollNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Roll Number</FormLabel>
                          <FormControl><Input placeholder="123456" className="h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background" {...field} value={field.value || ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={registerForm.control} name="department" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl><Input placeholder="Computer Science" className="h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background" {...field} value={field.value || ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={registerForm.control} name="year" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl><Input placeholder="3rd Year" className="h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background" {...field} value={field.value || ''}/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={registerForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl><Input placeholder="student@university.edu" className="h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={registerForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" className="h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full h-12 rounded-xl mt-6 text-md shadow-lg shadow-primary/20" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
