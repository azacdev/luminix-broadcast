"use client";

import { toast } from "sonner";
import { useState } from "react";
import { Calendar, Send, Clock, RotateCcw } from "lucide-react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ResendBroadcastModalProps {
  broadcast: {
    id: string;
    title: string;
    subject: string;
    content: string;
    from_email: string;
    status: string;
    created_at: string;
    sent_at?: string;
  };
  onResent: () => void;
  children: React.ReactNode;
}

export function ResendBroadcastModal({
  broadcast,
  onResent,
  children,
}: ResendBroadcastModalProps) {
  const [open, setOpen] = useState(false);
  const [schedulingOption, setSchedulingOption] = useState<string>("now");
  const [customDateTime, setCustomDateTime] = useState("");
  const trpc = useTRPC();

  const createBroadcast = useMutation(trpc.broadcasts.create.mutationOptions());

  const sendBroadcast = useMutation(trpc.broadcasts.send.mutationOptions());

  const getScheduledTime = (): string | undefined => {
    if (schedulingOption === "custom") {
      return customDateTime
        ? new Date(customDateTime).toISOString()
        : undefined;
    }

    const now = new Date();
    switch (schedulingOption) {
      case "now":
        return undefined;
      case "1hour":
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      case "24hours":
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case "1week":
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case "1month":
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return undefined;
    }
  };

  const handleResend = async () => {
    if (schedulingOption === "custom" && !customDateTime) {
      toast.error("Please select a date and time for scheduling");
      return;
    }

    try {
      const scheduledTime = getScheduledTime();

      // Create a new broadcast based on the existing one
      const newBroadcast = await createBroadcast.mutateAsync({
        title: broadcast.title,
        subject: broadcast.subject,
        content: broadcast.content,
        fromEmail: broadcast.from_email,
        scheduledAt: scheduledTime || "",
      });

      // Send the broadcast
      await sendBroadcast.mutateAsync({
        id: newBroadcast.id,
        scheduledAt: scheduledTime,
      });

      const message =
        schedulingOption === "now"
          ? "Broadcast resent successfully!"
          : "Broadcast resend scheduled successfully!";

      toast.success(message);
      setOpen(false);
      onResent();
    } catch (error) {
      console.error("Error resending broadcast:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to resend broadcast";
      toast.error(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resetForm = () => {
    setSchedulingOption("now");
    setCustomDateTime("");
  };

  const isLoading = createBroadcast.isPending || sendBroadcast.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Resend Broadcast
          </DialogTitle>
          <DialogDescription>
            Create and send a copy of this broadcast to your subscribers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Broadcast Details */}
          <Card className="p-4 bg-muted/50">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Original Broadcast</h4>
                <Badge variant="outline" className="text-xs">
                  {broadcast.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm font-medium">{broadcast.title}</p>
              <p className="text-xs text-muted-foreground">
                Subject: {broadcast.subject}
              </p>
              <p className="text-xs text-muted-foreground">
                Originally created: {formatDate(broadcast.created_at)}
              </p>
              {broadcast.sent_at && (
                <p className="text-xs text-muted-foreground">
                  Last sent: {formatDate(broadcast.sent_at)}
                </p>
              )}
            </div>
          </Card>

          {/* Scheduling Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">When to send</Label>
            <RadioGroup
              value={schedulingOption}
              onValueChange={setSchedulingOption}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="now" id="resend-now" />
                <Label htmlFor="resend-now" className="text-sm">
                  Send immediately
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1hour" id="resend-1hour" />
                <Label htmlFor="resend-1hour" className="text-sm">
                  Send in 1 hour
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="24hours" id="resend-24hours" />
                <Label htmlFor="resend-24hours" className="text-sm">
                  Send in 24 hours
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1week" id="resend-1week" />
                <Label htmlFor="resend-1week" className="text-sm">
                  Send in 1 week
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1month" id="resend-1month" />
                <Label htmlFor="resend-1month" className="text-sm">
                  Send in 1 month
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="resend-custom" />
                <Label htmlFor="resend-custom" className="text-sm">
                  Schedule for specific date & time
                </Label>
              </div>
            </RadioGroup>

            {schedulingOption === "custom" && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="resendDateTime" className="text-sm">
                  Select Date & Time
                </Label>
                <Input
                  id="resendDateTime"
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="max-w-xs"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleResend} disabled={isLoading}>
            {isLoading ? (
              <Clock className="mr-2 h-4 w-4 animate-spin" />
            ) : schedulingOption === "now" ? (
              <Send className="mr-2 h-4 w-4" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            {isLoading
              ? "Processing..."
              : schedulingOption === "now"
              ? "Resend Now"
              : "Schedule Resend"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
