import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAdminSettingsSchema, type AdminSettings } from "@shared/schema";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft, Upload } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminSettingsPage() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  if (!user || user.role !== "admin") {
    setLocation("/admin/login");
    return null;
  }

  const { data: settings, isLoading } = useQuery<AdminSettings>({
    queryKey: [api.admin.settings.get.path],
  });

  const form = useForm({
    resolver: zodResolver(insertAdminSettingsSchema),
    defaultValues: {
      collegeName: "",
      authorizedName: "",
      designation: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        collegeName: settings.collegeName,
        authorizedName: settings.authorizedName,
        designation: settings.designation,
      });
      if (settings.logoPath) setLogoPreview(settings.logoPath);
      if (settings.signaturePath) setSignaturePreview(settings.signaturePath);
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.admin.settings.update.path, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.settings.get.path] });
      toast({ title: "Success", description: "Settings updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (values: any) => {
    const formData = new FormData();
    formData.append("collegeName", values.collegeName);
    formData.append("authorizedName", values.authorizedName);
    formData.append("designation", values.designation);

    const logoFile = (document.getElementById("logo") as HTMLInputElement).files?.[0];
    const signatureFile = (document.getElementById("signature") as HTMLInputElement).files?.[0];

    if (logoFile) formData.append("logo", logoFile);
    if (signatureFile) formData.append("signature", signatureFile);

    mutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setPreview: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>College & Signatory Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="collegeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter college name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormItem>
                    <FormLabel>College Logo</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setLogoPreview)}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById("logo")?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" /> Upload Logo
                        </Button>
                        {logoPreview && (
                          <div className="mt-2 border rounded-md p-2 flex justify-center bg-muted/50">
                            <img src={logoPreview} alt="Logo preview" className="max-h-24 object-contain" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Digital Signature</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input
                          id="signature"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setSignaturePreview)}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById("signature")?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" /> Upload Signature
                        </Button>
                        {signaturePreview && (
                          <div className="mt-2 border rounded-md p-2 flex justify-center bg-muted/50">
                            <img src={signaturePreview} alt="Signature preview" className="max-h-24 object-contain" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                </div>

                <FormField
                  control={form.control}
                  name="authorizedName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Authorized Signatory Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Head of Department" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
