
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
      <div className="w-full min-h-[600px] flex items-center justify-center overflow-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center gap-8">
            <Skeleton className="h-24 w-40 rounded-lg" />
            <div className="flex gap-16">
              <Skeleton className="h-24 w-40 rounded-lg" />
              <Skeleton className="h-24 w-40 rounded-lg" />
              <Skeleton className="h-24 w-40 rounded-lg" />
            </div>
          </div>
        ) : (
          <div className="p-4">
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
    </div>
  );
}

    