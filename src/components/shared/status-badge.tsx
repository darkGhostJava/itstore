import { Badge } from "@/components/ui/badge";
import type { Item } from "@/lib/definitions";

type StatusBadgeProps = {
  status: Item["status"];
};

export function StatusBadge({ status }: StatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline";
  switch (status) {
    case "IN_STOCK":
      variant = "default";
      break;
    case "REPAIRED":
      variant = "default"; // Or choose another color like a blue
      break;
    case "DISTRIBUTED":
      variant = "secondary";
      break;
    case "UNDER_REPAIR":
      variant = "destructive";
      break;
    case "REFORMED":
      variant = "outline";
      break;
    default:
      variant = "outline";
  }
      
  return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
}
