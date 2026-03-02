import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "approved") {
    return (
      <Badge className={cn("bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200 shadow-none gap-1.5 py-1 px-3 rounded-full font-medium", className)}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approved
      </Badge>
    );
  }

  if (normalizedStatus === "rejected") {
    return (
      <Badge className={cn("bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 border-rose-200 shadow-none gap-1.5 py-1 px-3 rounded-full font-medium", className)}>
        <XCircle className="h-3.5 w-3.5" />
        Rejected
      </Badge>
    );
  }

  return (
    <Badge className={cn("bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200 shadow-none gap-1.5 py-1 px-3 rounded-full font-medium", className)}>
      <Clock className="h-3.5 w-3.5" />
      Pending
    </Badge>
  );
}
