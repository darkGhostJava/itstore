
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { fetchStructureTree } from "@/lib/data";
import type { Structure } from "@/lib/definitions";
import { Skeleton } from "@/components/ui/skeleton";
import { StructureTree } from "./structure-tree";

export default function StructuresPage() {
  const [tree, setTree] = React.useState<Structure | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadStructures = async () => {
      setIsLoading(true);
      try {
        const structureTree = await fetchStructureTree();
        setTree(structureTree);
      } catch (error) {
        console.error("Failed to load structures:", error);
        setTree(null);
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
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          {tree ? (
            <StructureTree structure={tree} />
          ) : (
            <p className="text-muted-foreground text-center p-8">
              No structures found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
