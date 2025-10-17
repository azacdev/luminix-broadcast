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

interface RemoveSubscriberModalProps {
  children: React.ReactNode;
  subscriberId: string;
  subscriberEmail: string;
  onRemove: () => void;
}

export function RemoveSubscriberModal({
  children,
  subscriberId,
  subscriberEmail,
  onRemove,
}: RemoveSubscriberModalProps) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();

  const deleteSubscriber = useMutation(
    trpc.subscribers.deleteOne.mutationOptions({
      onSuccess: () => {
        toast.success("Subscriber removed successfully");
        setOpen(false);
        onRemove();
      },
      onError: () => {
        toast.error("Failed to remove subscriber");
      },
    })
  );

  const handleRemove = async () => {
    deleteSubscriber.mutate({ id: subscriberId });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Remove Subscriber</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove{" "}
            <span className="font-semibold">{subscriberEmail}</span> from your
            subscriber list? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            disabled={deleteSubscriber.isPending}
          >
            {deleteSubscriber.isPending ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
