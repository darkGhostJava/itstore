
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, MoreVertical, Building, User, Package } from "lucide-react";
import type { Structure } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StructureTreeProps {
  structure: Structure & { children?: Structure[] };
  isLast?: boolean;
}

export function StructureTree({ structure, isLast = true }: StructureTreeProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const hasChildren = structure.children && structure.children.length > 0;

  // Use a sensible default for id if it is null
  const linkId = structure.id ?? '#';
  const canNavigate = structure.id !== null;

  const LinkComponent = canNavigate ? Link : 'span';

  const NodeContent = (
    <div className="flex items-center gap-4">
        {/* Main Content */}
        <div className="flex-1 flex items-center p-2 rounded-md hover:bg-muted/50 transition-colors">
        {!hasChildren && <div className="w-8 h-8"></div>}
        
        {hasChildren && (
            <div className="h-8 w-8 flex items-center justify-center">
                 <ChevronRight className={cn("h-5 w-5 transition-transform", isOpen && "rotate-90")} />
                 <span className="sr-only">Toggle</span>
            </div>
        )}

        <div className="flex flex-col ml-2 flex-1">
            <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <LinkComponent href={`/structures/${linkId}`} className={cn("font-semibold flex items-center gap-2", canNavigate && "hover:underline")}>
                <Building className="h-4 w-4 text-muted-foreground" /> {structure.name}
                </LinkComponent>
                {structure.chef && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" /> {structure.chef.firstName} {structure.chef.lastName}
                </p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {structure.itemsCount ?? 0}
                </Badge>
            </div>
            </div>
        </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {canNavigate && (
            <DropdownMenuItem asChild>
                <Link href={`/structures/${linkId}`}>View Details</Link>
            </DropdownMenuItem>
            )}
            <DropdownMenuItem>Assign Chef</DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
  

  if (!hasChildren) {
      return <div className="relative">{NodeContent}</div>
  }

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen} className="relative">
      <CollapsibleTrigger asChild>
        {NodeContent}
      </CollapsibleTrigger>
      
      <CollapsibleContent asChild>
        <div className="relative pl-10">
            <div className="absolute left-[23px] top-0 h-full w-px bg-border -z-10"></div>
            <div className="space-y-2 py-2">
            {structure.children?.map((child, index) => (
                <StructureTree 
                key={child.id ?? index} 
                structure={child} 
                isLast={index === (structure.children?.length ?? 0) - 1} 
                />
            ))}
            </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

