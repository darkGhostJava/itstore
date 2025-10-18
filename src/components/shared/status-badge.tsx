import { Badge } from "@/components/ui/badge";
import type { Item } from "@/lib/definitions";

type StatusBadgeProps = {
  status: Item["status"];
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant: "default" | "secondary" | "destructive" | "outline" =
    status === "IN_STOCK"
      ? "default"
      : status === "DISTRIBUTED"
      ? "secondary"
      : status === "UNDER_REPAIR"
      ? "destructive"
      : "outline";
      
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}
