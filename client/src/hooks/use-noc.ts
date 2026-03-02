import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, nocRequestResponseSchema, buildUrl } from "@shared/routes";
import { apiClient } from "@/lib/api-client";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type ApplyNocInput = z.infer<typeof api.noc.apply.input>;

export function useMyNocRequests() {
  return useQuery({
    queryKey: [api.noc.myRequests.path],
    queryFn: async () => {
      const data = await apiClient(api.noc.myRequests.path);
      return z.array(nocRequestResponseSchema).parse(data);
    },
  });
}

export function useApplyNoc() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ApplyNocInput) => {
      const response = await apiClient(api.noc.apply.path, {
        method: api.noc.apply.method,
        body: JSON.stringify(data),
      });
      return nocRequestResponseSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.noc.myRequests.path] });
      toast({
        title: "Application submitted",
        description: "Your NOC request has been successfully submitted.",
      });
    },
  });
}

export function useAllNocRequests() {
  return useQuery({
    queryKey: [api.admin.requests.path],
    queryFn: async () => {
      const data = await apiClient(api.admin.requests.path);
      return z.array(nocRequestResponseSchema).parse(data);
    },
  });
}

export function useApproveNoc() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.approve.path, { id });
      const response = await apiClient(url, {
        method: api.admin.approve.method,
      });
      return nocRequestResponseSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.requests.path] });
      toast({
        title: "Request Approved",
        description: "The NOC request has been approved.",
      });
    },
  });
}

export function useRejectNoc() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: number; rejectionReason: string }) => {
      const url = buildUrl(api.admin.reject.path, { id });
      const response = await apiClient(url, {
        method: api.admin.reject.method,
        body: JSON.stringify({ rejectionReason }),
      });
      return nocRequestResponseSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.requests.path] });
      toast({
        title: "Request Rejected",
        description: "The NOC request has been rejected.",
        variant: "destructive",
      });
    },
  });
}
