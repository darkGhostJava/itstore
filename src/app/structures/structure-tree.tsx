
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
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center p-2 rounded-md hover:bg-muted/50 transition-colors group">
        
        {/* Toggle and Icon */}
        <div className="h-8 w-8 flex items-center justify-center shrink-0">
          {hasChildren ? (
             <ChevronRight className={cn("h-5 w-5 transition-transform text-muted-foreground group-hover:text-foreground", isOpen && "rotate-90")} />
          ) : (
            <span className="w-5 h-5" /> // Placeholder for alignment
          )}
        </div>
        
        <Building className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />

        {/* Text content */}
        <div className="flex flex-col flex-1 truncate">
          <LinkComponent href={`/structures/${linkId}`} className={cn("font-semibold truncate", canNavigate && "hover:underline")}>
            {structure.name}
          </LinkComponent>
          {structure.chef && (
            <p className="text-sm text-muted-foreground flex items-center gap-2 truncate">
              <User className="h-4 w-4 shrink-0" /> {structure.chef.firstName} {structure.chef.lastName}
            </p>
          )}
        </div>

        {/* Badge and Actions */}
        <div className="flex items-center gap-2 ml-4">
          <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
            <Package className="h-3 w-3" />
            {structure.itemsCount ?? 0}
          </Badge>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
      </div>
    </div>
  );

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen} className="relative">
      {hasChildren ? (
        <CollapsibleTrigger asChild className="cursor-pointer">
          {NodeContent}
        </CollapsibleTrigger>
      ) : (
        NodeContent
      )}
      
      {hasChildren && (
        <CollapsibleContent asChild>
          <div className="relative pl-8">
            {/* Vertical connector line */}
            <div className="absolute left-[28px] top-0 h-full w-px bg-border -z-10"></div>
            <div className="space-y-1 py-1">
              {structure.children?.map((child, index) => (
                <div key={child.id ?? index} className="relative">
                  {/* Horizontal connector line */}
                  <div className="absolute left-[28px] top-[22px] w-4 h-px bg-border -z-10"></div>
                   <StructureTree 
                    structure={child} 
                    isLast={index === (structure.children?.length ?? 0) - 1} 
                  />
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
