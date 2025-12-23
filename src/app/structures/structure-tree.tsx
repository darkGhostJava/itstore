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
import { ChevronRight, MoreVertical, Building, User } from "lucide-react";
import type { Structure } from "@/lib/definitions";
import { cn } from "@/lib/utils";

interface StructureTreeProps {
  structure: Structure & { children?: Structure[] };
  isLast?: boolean;
}

export function StructureTree({ structure, isLast = true }: StructureTreeProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const hasChildren = structure.children && structure.children.length > 0;

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        {/* Trigger and Main Content */}
        <div className="flex-1 flex items-center p-2 rounded-md hover:bg-muted/50 transition-colors">
          {hasChildren && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight className={cn("h-5 w-5 transition-transform", isOpen && "rotate-90")} />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          )}
          {!hasChildren && <div className="w-8 h-8"></div>}

          <div className="flex flex-col ml-2">
            <Link href={`/structures/${structure.id}`} className="font-semibold hover:underline flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" /> {structure.name}
            </Link>
            {structure.chef && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> {structure.chef.firstName} {structure.chef.lastName}
              </p>
            )}
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
            <DropdownMenuItem asChild>
              <Link href={`/structures/${structure.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Assign Chef</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children Content */}
      {hasChildren && (
        <CollapsibleContent asChild>
           <div className="relative pl-10">
              {/* Vertical connecting line */}
              <div className="absolute left-[23px] top-0 h-full w-px bg-border -z-10"></div>
              <div className="space-y-2 py-2">
                {structure.children?.map((child, index) => (
                  <StructureTree 
                    key={child.id} 
                    structure={child} 
                    isLast={index === (structure.children?.length ?? 0) - 1} 
                  />
                ))}
              </div>
           </div>
        </CollapsibleContent>
      )}
    </div>
  );
}
