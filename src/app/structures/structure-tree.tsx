
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
import { MoreVertical, Building, User, Package, ChevronRight } from "lucide-react";
import type { Structure } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface StructureTreeProps {
  structure: Structure & { children?: Structure[] };
  isRoot?: boolean;
}

const NODE_SIZE = 160; // Width of a node
const CHILD_ARC_RADIUS = 450; // Radius for children placement, increased from 300
const CHILD_ANGLE_SPREAD = 180; // Max angle to spread children over in degrees, increased from 160

export function StructureTree({ structure, isRoot = true }: StructureTreeProps) {
  const [isOpen, setIsOpen] = React.useState(isRoot); // Keep root open by default
  const hasChildren = structure.children && structure.children.length > 0;

  const linkId = structure.id ?? '#';
  const canNavigate = structure.id !== null;

  const LinkComponent = canNavigate ? Link : 'div';
  
  const getChildPosition = (index: number, total: number) => {
    const totalAngle = Math.min(CHILD_ANGLE_SPREAD, total * 45);
    const startAngle = -totalAngle / 2;
    const angleIncrement = total > 1 ? totalAngle / (total - 1) : 0;
    const angle = startAngle + index * angleIncrement;
    
    const x = CHILD_ARC_RADIUS * Math.cos((angle - 90) * (Math.PI / 180));
    const y = CHILD_ARC_RADIUS * Math.sin((angle - 90) * (Math.PI / 180));

    return { x, y: y + CHILD_ARC_RADIUS / 2 };
  };

  return (
    <Collapsible asChild onOpenChange={setIsOpen} open={isOpen}>
      <div className="relative flex flex-col items-center p-8">
        {/* Node Content */}
        <motion.div layout className="z-10">
          <CollapsibleTrigger asChild disabled={!hasChildren} className={cn(hasChildren && "cursor-pointer")}>
            <div className={cn(
              "group flex flex-col items-center justify-center w-[160px] h-[100px] p-3 rounded-lg border bg-card text-card-foreground shadow-md hover:shadow-lg transition-all duration-300",
              isOpen && hasChildren && "border-primary shadow-primary/20",
            )}>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <LinkComponent href={`/structures/${linkId}`} className={cn("font-semibold truncate text-center", canNavigate && "hover:underline")}>
                  {structure.name}
                </LinkComponent>
              </div>

              {structure.chef && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-1">
                  <User className="h-3 w-3 shrink-0" /> {structure.chef.firstName} {structure.chef.lastName}
                </p>
              )}

              <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                    <Package className="h-3 w-3" />
                    {structure.itemsCount ?? 0}
                  </Badge>
                  {hasChildren && (
                     <motion.div animate={{ rotate: isOpen ? 90 : 0 }} className="text-muted-foreground">
                        <ChevronRight className="h-4 w-4" />
                     </motion.div>
                  )}
              </div>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 shrink-0 opacity-50 group-hover:opacity-100">
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
          </CollapsibleTrigger>
        </motion.div>

        {/* Children */}
        <AnimatePresence>
          {isOpen && hasChildren && (
            <CollapsibleContent forceMount asChild>
                <motion.div
                  layout
                  className="relative mt-12"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    {/* SVG Connectors */}
                    <svg className="absolute top-0 left-1/2 overflow-visible pointer-events-none">
                        {structure.children?.map((_, index) => {
                            const pos = getChildPosition(index, structure.children!.length);
                            const startX = 0;
                            const startY = -48; // from bottom of parent node
                            const endX = pos.x;
                            const endY = pos.y - NODE_SIZE/2 - 10;
                            return (
                                <motion.path
                                    key={index}
                                    d={`M ${startX} ${startY} C ${startX} ${startY + 60}, ${endX} ${endY - 60}, ${endX} ${endY}`}
                                    fill="none"
                                    stroke="hsl(var(--border))"
                                    strokeWidth="1.5"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
                                />
                            );
                        })}
                    </svg>
                    
                    {/* Child Nodes */}
                    <div className="relative flex justify-center items-start">
                      {structure.children?.map((child, index) => {
                        const pos = getChildPosition(index, structure.children!.length);
                        return (
                          <motion.div
                              key={child.id ?? index}
                              className="absolute"
                              style={{
                                  top: `${pos.y - NODE_SIZE / 2}px`,
                                  left: `${pos.x - NODE_SIZE / 2}px`,
                              }}
                               initial={{ opacity: 0, y: -20 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ duration: 0.3, delay: 0.1 * index }}
                          >
                              <StructureTree 
                                  structure={child}
                                  isRoot={false}
                              />
                          </motion.div>
                        )
                      })}
                    </div>
                </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
}
