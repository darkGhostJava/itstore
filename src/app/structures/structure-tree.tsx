
"use client";

import * as React from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Building, User, HardDrive, Printer, ArrowLeft } from "lucide-react";
import type { Structure } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface StructureTreeProps {
  structure: Structure & { children?: Structure[] };
  isRoot?: boolean;
  onBack?: () => void;
}

const NODE_SIZE = 160; // Width of a node
const CHILD_ARC_RADIUS = 450;
const CHILD_ANGLE_SPREAD = 180;

export function StructureTree({ structure, onBack }: StructureTreeProps) {
  const [activeChildIndex, setActiveChildIndex] = React.useState<number | null>(null);

  const hasChildren = structure.children && structure.children.length > 0;
  const activeChild = activeChildIndex !== null && hasChildren ? structure.children![activeChildIndex] : null;

  const handleNodeClick = (index: number) => {
    setActiveChildIndex(index);
  };

  const handleBack = () => {
    setActiveChildIndex(null);
  };

  const getChildPosition = (index: number, total: number) => {
    const totalAngle = Math.min(CHILD_ANGLE_SPREAD, total * 45);
    const startAngle = -totalAngle / 2;
    const angleIncrement = total > 1 ? totalAngle / (total - 1) : 0;
    const angle = startAngle + index * angleIncrement;
    
    const x = CHILD_ARC_RADIUS * Math.cos((angle - 90) * (Math.PI / 180));
    const y = CHILD_ARC_RADIUS * Math.sin((angle - 90) * (Math.PI / 180));

    return { x, y: y + CHILD_ARC_RADIUS / 2 };
  };

  const Node = ({ s, onNodeClick, onBackClick, level = 0 }: { s: Structure, onNodeClick?: () => void, onBackClick?: () => void, level?: number }) => {
    const hasChildren = s.children && s.children.length > 0;
    const key = `${s.id ?? `L${level}`}-${s.name}`;

    return (
       <motion.div layout className="z-10 relative" key={key}>
          {onBackClick && (
            <Button variant="ghost" size="icon" onClick={onBackClick} className="absolute -top-12 left-1/2 -translate-x-1/2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div
            onClick={onNodeClick}
            className={cn(
                "group flex flex-col items-center justify-center w-[160px] h-auto p-3 rounded-lg border bg-card text-card-foreground shadow-md hover:shadow-lg transition-all duration-300",
                hasChildren && "cursor-pointer"
            )}>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <div className={cn("font-semibold truncate text-center")}>
                {s.name}
              </div>
            </div>

            {s.chef && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-1">
                <User className="h-3 w-3 shrink-0" /> {s.chef.firstName} {s.chef.lastName}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                  <HardDrive className="h-3 w-3" />
                  {s.materielCount ?? 0}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                  <Printer className="h-3 w-3" />
                  {s.consCount ?? 0}
                </Badge>
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
                  <DropdownMenuItem>Assign Chef</DropdownMenuItem>
                  <DropdownMenuItem asChild>
                      <Link href={`/structures/${s.id}`}>View Details</Link>
                  </DropdownMenuItem>
              </DropdownMenuContent>
             </DropdownMenu>
          </div>
       </motion.div>
    );
  }

  return (
    <div className="relative flex flex-col items-center p-8">
        <AnimatePresence>
            {!activeChild && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                >
                    <Node s={structure} onBackClick={onBack} />
                </motion.div>
            )}
        </AnimatePresence>

      <AnimatePresence>
        {!activeChild && hasChildren && (
             <motion.div
                layout
                className="relative mt-12"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                  <svg className="absolute top-0 left-1/2 overflow-visible pointer-events-none">
                      {structure.children?.map((_, index) => {
                          const pos = getChildPosition(index, structure.children!.length);
                          const startX = 0;
                          const startY = -48;
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
                  
                  <div className="relative flex justify-center items-start">
                    {structure.children?.map((child, index) => {
                      const pos = getChildPosition(index, structure.children!.length);
                      return (
                        <motion.div
                            key={child.id ?? `${structure.id}-${index}`}
                            className="absolute"
                            style={{
                                top: `${pos.y - NODE_SIZE / 2}px`,
                                left: `${pos.x - NODE_SIZE / 2}px`,
                            }}
                             initial={{ opacity: 0, y: -20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ duration: 0.3, delay: 0.1 * index }}
                        >
                            <Node s={child} onNodeClick={() => handleNodeClick(index)} level={index + 1}/>
                        </motion.div>
                      )
                    })}
                  </div>
              </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeChild && (
            <motion.div 
              className="absolute top-1/2 left-1/2"
              initial={{ opacity: 0, scale: 0.5, x: '-50%', y: '-50%'}}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%'}}
              exit={{ opacity: 0, scale: 0.5}}
              transition={{ duration: 0.4, ease: "backOut" }}
            >
                <StructureTree 
                    structure={activeChild}
                    isRoot={false}
                    onBack={handleBack}
                />
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
