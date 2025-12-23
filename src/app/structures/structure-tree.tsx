
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
import { motion, AnimatePresence } from "framer-motion";

interface StructureTreeProps {
  structure: Structure & { children?: Structure[] };
  isRoot?: boolean;
}

export function StructureTree({ structure, isRoot = false }: StructureTreeProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const hasChildren = structure.children && structure.children.length > 0;

  const linkId = structure.id ?? '#';
  const canNavigate = structure.id !== null;

  const LinkComponent = canNavigate ? Link : 'span';

  const NodeContent = (
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-card hover:bg-muted/50 transition-colors group border w-full min-w-[280px]",
        isOpen && "rounded-b-none"
      )}>
        {/* Toggle and Icon */}
        <div className="flex items-center shrink-0">
          {hasChildren ? (
            <CollapsibleTrigger asChild className="cursor-pointer">
              <div className="h-8 w-8 flex items-center justify-center">
                 <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className={cn("h-5 w-5 transition-transform text-muted-foreground group-hover:text-foreground")} />
                 </motion.div>
              </div>
            </CollapsibleTrigger>
          ) : (
            <span className="w-8 h-8" /> // Placeholder for alignment
          )}
        </div>

        <Building className="h-5 w-5 text-muted-foreground mr-2 shrink-0" />

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
  );

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen} className="relative flex items-start gap-6">
      {/* Node */}
      <div className="flex flex-col items-center">
        {NodeContent}
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isOpen && hasChildren && (
            <CollapsibleContent asChild forceMount className="relative">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex flex-col gap-4 pl-10"
                >
                    {/* Vertical line connecting children */}
                    <div className="absolute left-0 top-6 bottom-6 w-px bg-border -z-10"></div>
                    
                    {structure.children?.map((child, index) => (
                        <div key={child.id ?? index} className="relative">
                           {/* Horizontal line from parent to child */}
                           <div className="absolute -left-10 top-6 h-px w-10 bg-border -z-10"></div>
                           <StructureTree 
                                structure={child} 
                           />
                        </div>
                    ))}
                </motion.div>
            </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  );
}

