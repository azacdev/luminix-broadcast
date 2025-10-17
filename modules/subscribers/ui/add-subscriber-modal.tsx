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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddSubscriberModalProps {
  children: React.ReactNode;
  onSubscriberAdded: () => void;
}

export function AddSubscriberModal({
  children,
  onSubscriberAdded,
}: AddSubscriberModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const trpc = useTRPC();

  const createSubscriber = useMutation(
    trpc.subscribers.create.mutationOptions({
      onSuccess: () => {
        toast.success("Subscriber added successfully!");
        setEmail("");
        setOpen(false);
        onSubscriberAdded();
      },
      onError: (error) => {
        if (error.message.includes("already subscribed")) {
          toast.error("This email is already subscribed");
        } else {
          toast.error(error.message || "Failed to add subscriber");
        }
      },
    })
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    createSubscriber.mutate({ email: email.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Subscriber</DialogTitle>
          <DialogDescription>
            Add a new email address to your newsletter subscriber list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="subscriber@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSubscriber.isPending}>
              {createSubscriber.isPending ? "Adding..." : "Add Subscriber"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
