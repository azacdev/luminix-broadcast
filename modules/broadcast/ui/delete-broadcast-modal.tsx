"use client";

import type React from "react";
import { useState } from "react";

import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeleteBroadcastModalProps {
  children: React.ReactNode;
  broadcast: {
    id: string;
    title: string;
    subject: string;
  };
  onDeleted: () => void;
}

export function DeleteBroadcastModal({
  children,
  broadcast,
  onDeleted,
}: DeleteBroadcastModalProps) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();

  const deleteBroadcast = useMutation(
    trpc.broadcasts.deleteOne.mutationOptions({
      onSuccess: () => {
        toast.success("Broadcast deleted successfully!");
        setOpen(false);
        onDeleted();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete broadcast");
      },
    })
  );

  const handleDelete = async () => {
    deleteBroadcast.mutate({ id: broadcast.id });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Broadcast</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this broadcast? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium">{broadcast.title}</h4>
          <p className="text-sm text-muted-foreground">{broadcast.subject}</p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteBroadcast.isPending}
          >
            {deleteBroadcast.isPending ? "Deleting..." : "Delete Broadcast"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
