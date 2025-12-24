import { Badge } from "@/components/ui/badge";
import type { Item } from "@/lib/definitions";
import { Archive, ArchiveX, ArrowRightLeft, Package, ShieldCheck, Wrench } from "lucide-react";

type StatusBadgeProps = {
  status: Item["status"];
};

export function StatusBadge({ status }: StatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" | "reformed" | "repaired" | "distributed";
  let Icon: React.ElementType;

  switch (status) {
    case "IN_STOCK":
      variant = "default";
      Icon = Package;
      break;
    case "REPAIRED":
      variant = "repaired";
      Icon = ShieldCheck;
      break;
    case "DISTRIBUTED":
      variant = "distributed";
      Icon = ArrowRightLeft;
      break;
    case "UNDER_REPAIR":
      variant = "destructive";
      Icon = Wrench;
      break;
    case "REFORMED":
      variant = "reformed";
      Icon = ArchiveX;
      break;
    default:
      variant = "outline";
      Icon = Package;
  }
      
  return (
    <Badge variant={variant} className="flex items-center gap-1.5 w-fit">
      <Icon className="h-3 w-3" />
      <span>{status.replace(/_/g, " ")}</span>
    </Badge>
  );
}
