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

interface SendBroadcastModalProps {
  children: React.ReactNode;
  broadcast: {
    id: string;
    title: string;
    subject: string;
  };
  onSent: () => void;
  allowScheduling?: boolean;
}

export function SendBroadcastModal({
  children,
  broadcast,
  onSent,
  allowScheduling = false,
}: SendBroadcastModalProps) {
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const trpc = useTRPC();

  const sendBroadcast = useMutation(
    trpc.broadcasts.send.mutationOptions({
      onSuccess: () => {
        toast.success(
          scheduledAt
            ? "Broadcast scheduled successfully!"
            : "Broadcast sent successfully!"
        );
        setScheduledAt("");
        setOpen(false);
        onSent();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send broadcast");
      },
    })
  );

  const handleSend = async () => {
    sendBroadcast.mutate({
      id: broadcast.id,
      scheduledAt: scheduledAt || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {allowScheduling ? "Send or Schedule Broadcast" : "Send Broadcast"}
          </DialogTitle>
          <DialogDescription>
            {allowScheduling
              ? "Send your broadcast now or schedule it for later."
              : "Are you sure you want to send this broadcast now?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium">{broadcast.title}</h4>
            <p className="text-sm text-muted-foreground">{broadcast.subject}</p>
          </div>

          {allowScheduling && (
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Schedule for later (optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to send immediately
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sendBroadcast.isPending}>
            {sendBroadcast.isPending
              ? "Sending..."
              : scheduledAt
              ? "Schedule Broadcast"
              : "Send Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
