import { useMutation } from "@tanstack/react-query";
import { api, authResponseSchema } from "@shared/routes";
import { apiClient } from "@/lib/api-client";
import { z } from "zod";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

type LoginInput = z.infer<typeof api.auth.login.input>;
type RegisterInput = z.infer<typeof api.auth.register.input>;

export function useStudentLogin() {
  const { login } = useAuthContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await apiClient(api.auth.login.path, {
        method: api.auth.login.method,
        body: JSON.stringify(data),
      });
      return authResponseSchema.parse(response);
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    },
  });
}

export function useStudentRegister() {
  const { login } = useAuthContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const response = await apiClient(api.auth.register.path, {
        method: api.auth.register.method,
        body: JSON.stringify(data),
      });
      return authResponseSchema.parse(response);
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      toast({
        title: "Account created",
        description: "Welcome to the NOC Portal.",
      });
    },
  });
}

export function useAdminLogin() {
  const { login } = useAuthContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await apiClient(api.auth.adminLogin.path, {
        method: api.auth.adminLogin.method,
        body: JSON.stringify(data),
      });
      return authResponseSchema.parse(response);
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      toast({
        title: "Admin access granted",
        description: "Welcome to the admin dashboard.",
      });
    },
  });
}
