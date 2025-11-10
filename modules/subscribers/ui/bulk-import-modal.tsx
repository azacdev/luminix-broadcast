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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SUBSCRIBER_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "announcements", label: "Announcements" },
  { value: "updates", label: "Updates" },
  { value: "newsletters", label: "Newsletters" },
  { value: "promotions", label: "Promotions" },
];

interface BulkImportModalProps {
  children: React.ReactNode;
  onImportComplete: () => void;
}

export function BulkImportModal({
  children,
  onImportComplete,
}: BulkImportModalProps) {
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState("");
  const [category, setCategory] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const trpc = useTRPC();

  const createSubscriber = useMutation(
    trpc.subscribers.create.mutationOptions()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emails.trim()) {
      toast.error("Please enter email addresses");
      return;
    }

    const emailList = emails
      .split(/[\n,;]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emailList.length === 0) {
      toast.error("No valid email addresses found");
      return;
    }

    setIsLoading(true);

    const results = {
      successful: [] as string[],
      failed: [] as string[],
    };

    // Process emails sequentially
    for (const email of emailList) {
      try {
        await createSubscriber.mutateAsync({
          email,
          category: category as any,
        });
        results.successful.push(email);
      } catch (error) {
        results.failed.push(email);
      }
    }

    const successCount = results.successful.length;
    const failCount = results.failed.length;

    if (successCount > 0) {
      toast.success(
        `Successfully added ${successCount} subscriber${
          successCount > 1 ? "s" : ""
        }`
      );
    }

    if (failCount > 0) {
      toast.error(
        `Failed to add ${failCount} subscriber${failCount > 1 ? "s" : ""}`
      );
    }

    setEmails("");
    setCategory("general");
    setOpen(false);
    setIsLoading(false);
    onImportComplete();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Subscribers</DialogTitle>
          <DialogDescription>
            Add multiple email addresses at once. Separate emails with commas,
            semicolons, or new lines.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Assign Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIBER_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                All imported subscribers will be assigned to this category
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="emails">Email Addresses</Label>
              <Textarea
                id="emails"
                placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                rows={8}
                required
              />
              <p className="text-sm text-muted-foreground">
                You can paste emails separated by commas, semicolons, or on
                separate lines.
              </p>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Importing..." : "Import Subscribers"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
