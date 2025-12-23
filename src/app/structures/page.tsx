
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { fetchAllStructures } from "@/lib/data";
import type { Structure } from "@/lib/definitions";
import { Skeleton } from "@/components/ui/skeleton";
import { StructureTree } from "./structure-tree";

// Helper function to build the tree
const buildTree = (structures: Structure[]): Structure[] => {
  const structureMap: Record<number, Structure & { children: Structure[] }> = {};
  const tree: Structure[] = [];

  // Initialize map and add a children array to each structure
  structures.forEach(structure => {
    structureMap[structure.id] = { ...structure, children: [] };
  });

  // Build the tree
  structures.forEach(structure => {
    if (structure.parentId) {
      const parent = structureMap[structure.parentId];
      if (parent) {
        parent.children.push(structureMap[structure.id]);
      }
    } else {
      tree.push(structureMap[structure.id]);
    }
  });

  return tree;
};


export default function StructuresPage() {
  const [tree, setTree] = React.useState<Structure[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadStructures = async () => {
      setIsLoading(true);
      try {
        const allStructures = await fetchAllStructures();
        const hierarchicalData = buildTree(allStructures);
        setTree(hierarchicalData);
      } catch (error) {
        console.error("Failed to load structures:", error);
        setTree([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadStructures();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Structures"
        actions={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Structure
          </Button>
        }
      />
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full ml-8" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
            {tree.length > 0 ? (
                tree.map(structure => (
                    <StructureTree key={structure.id} structure={structure} />
                ))
            ) : (
                <p className="text-muted-foreground">No structures found.</p>
            )}
        </div>
      )}
    </div>
  );
}
