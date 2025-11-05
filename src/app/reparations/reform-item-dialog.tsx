
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
import { markItemAsReformed } from "@/lib/data";
import type { Item } from "@/lib/definitions";
import { ArchiveX } from "lucide-react";

interface ReformItemDialogProps {
  item: Item;
}

export function ReformItemDialog({ item }: ReformItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleReform = async () => {
    setIsPending(true);
    try {
      // Assuming a logged-in user with ID 1
      await markItemAsReformed(item.id, 1);
      toast({
        title: "Success",
        description: `Item with serial number ${item.serialNumber} has been marked as reformed.`,
      });
      setOpen(false);
      // Here you might want to trigger a data refresh for the table
    } catch (error) {
      console.error("Failed to mark item as reformed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not mark the item as reformed.",
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
        className="text-destructive focus:text-destructive/90"
      >
        <ArchiveX className="mr-2 h-4 w-4" />
        Mark as Reformed
      </DropdownMenuItem>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the item with serial number{" "}
              <span className="font-semibold">{item.serialNumber}</span> as
              reformed. This action is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReform}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isPending ? "Confirming..." : "Confirm Reform"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
