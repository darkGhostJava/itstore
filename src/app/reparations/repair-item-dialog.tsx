
"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { markItemAsRepaired } from "@/lib/data";
import type { Item } from "@/lib/definitions";
import { Wrench } from "lucide-react";

interface RepairItemDialogProps {
  item: Item;
}

export function RepairItemDialog({ item }: RepairItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleRepair = async () => {
    setIsPending(true);
    try {
      // Assuming a logged-in user with ID 1
      await markItemAsRepaired(item.id, 1);
      toast({
        title: "Success",
        description: `Item with serial number ${item.serialNumber} has been marked as repaired.`,
      });
      setOpen(false);
      // Here you might want to trigger a data refresh for the table
    } catch (error) {
      console.error("Failed to mark item as repaired:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not mark the item as repaired.",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="text-green-600 focus:text-green-700"
      >
        <Wrench className="mr-2 h-4 w-4" />
        Mark as Repaired
      </DropdownMenuItem>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the item with serial number{" "}
              <span className="font-semibold">{item.serialNumber}</span> as
              repaired and change its status. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRepair}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPending ? "Confirming..." : "Confirm Repair"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
