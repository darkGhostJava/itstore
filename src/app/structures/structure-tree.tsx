
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
  Card,
  CardContent
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, MoreVertical, Building, User } from "lucide-react";
import type { Structure } from "@/lib/definitions";

interface StructureTreeProps {
  structure: Structure & { children?: Structure[] };
}

export function StructureTree({ structure }: StructureTreeProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const hasChildren = structure.children && structure.children.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {hasChildren && (
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <ChevronRight className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                        <span className="sr-only">Toggle</span>
                    </Button>
                </CollapsibleTrigger>
             )}
             {!hasChildren && <div className="w-10"></div>}

            <div className="flex flex-col">
              <Link href={`/structures/${structure.id}`} className="font-semibold hover:underline flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground"/> {structure.name}
              </Link>
              {structure.chef && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4"/> {structure.chef.firstName} {structure.chef.lastName}
                </p>
              )}
            </div>
          </div>

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
        </CardContent>
      </Card>
      
      {hasChildren && (
        <CollapsibleContent className="pl-8 pt-4 space-y-4 border-l ml-6">
          {structure.children?.map((child) => (
            <StructureTree key={child.id} structure={child} />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
