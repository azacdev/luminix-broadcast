"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Save, Eye, Send, Clock, FileText, Mail } from "lucide-react";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";

import RichTextEditor from "./rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const broadcastFormSchema = z.object({
  title: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  fromEmail: z.string().optional(),
  scheduledAt: z.date().optional(),
});

const publishedBroadcastSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must be less than 200 characters"),
  content: z.string().min(1, "Content is required"),
  fromEmail: z.string().email("Valid email is required"),
});

type BroadcastFormData = z.infer<typeof broadcastFormSchema>;

interface EditBroadcastFormProps {
  broadcastId: string;
}

export function EditBroadcastForm({ broadcastId }: EditBroadcastFormProps) {
  const router = useRouter();
  const [schedulingOption, setSchedulingOption] = useState<string>("now");
  const [customDateTime, setCustomDateTime] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const trpc = useTRPC();

  const { data: broadcast, isLoading: initialLoading } = useQuery(
    trpc.broadcasts.getOne.queryOptions({ id: broadcastId })
  );

  const updateBroadcast = useMutation(
    trpc.broadcasts.updateOne.mutationOptions()
  );

  const sendBroadcast = useMutation(trpc.broadcasts.send.mutationOptions());

  const form = useForm<BroadcastFormData>({
    resolver: zodResolver(broadcastFormSchema),
    defaultValues: {
      title: "",
      subject: "",
      content: "",
      fromEmail: "newsletter@azacdev.com",
      scheduledAt: new Date(),
    },
  });

  useEffect(() => {
    if (broadcast) {
      form.reset({
        title: broadcast.title || "",
        subject: broadcast.subject || "",
        content: broadcast.content || "",
        fromEmail: broadcast.from_email || "newsletter@azacdev.com",
      });
    }
  }, [broadcast, form]);

  const handleTitleChange = (value: string) => {
    form.setValue("title", value);
  };

  const saveDraft = async () => {
    try {
      const formData = form.getValues();

      const payload = {
        id: broadcastId,
        title: formData.title?.trim() || "Untitled Draft",
        subject: formData.subject?.trim() || "No Subject",
        content: formData.content?.trim() || "",
        fromEmail: formData.fromEmail?.trim() || "newsletter@azacdev.com",
      };

      await updateBroadcast.mutateAsync(payload);
      toast.success("Draft saved successfully");
      router.push("/dashboard/newsletter/broadcasts");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    }
  };

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

  const onSubmit = async (data: BroadcastFormData) => {
    const publishedValidation = publishedBroadcastSchema.safeParse(data);
    if (!publishedValidation.success) {
      const errors = publishedValidation.error.issues;
      errors.forEach((error) => {
        toast.error(`${error.path.join(".")}: ${error.message}`);
      });
      return;
    }

    if (schedulingOption === "custom" && !customDateTime) {
      toast.error("Please select a date and time for scheduling");
      return;
    }

    try {
      const scheduledTime = getScheduledTime();

      const payload = {
        id: broadcastId,
        title: data.title!,
        subject: data.subject!,
        content: data.content!,
        fromEmail: data.fromEmail!,
      };

      await updateBroadcast.mutateAsync(payload);
      await sendBroadcast.mutateAsync({
        id: broadcastId,
        scheduledAt: scheduledTime,
      });

      const message =
        schedulingOption === "now"
          ? "Broadcast sent successfully!"
          : "Broadcast scheduled successfully!";
      toast.success(message);
      router.push("/dashboard/newsletter/broadcasts");
    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast.error("Failed to send broadcast");
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading broadcast...</p>
        </div>
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p>Broadcast not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentTitle = form.watch("title");
  const currentSubject = form.watch("subject");
  const currentContent = form.watch("content");
  const currentFromEmail = form.watch("fromEmail");

  const canSend = broadcast.status === "draft" || broadcast.status === "failed";
  const isLoading = updateBroadcast.isPending || sendBroadcast.isPending;
  const isSaving = updateBroadcast.isPending;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span
              className={cn(
                "text-sm px-2 py-1",
                broadcast.status === "draft" && "bg-yellow-100 text-yellow-800",
                broadcast.status === "sent" && "bg-green-100 text-green-800",
                broadcast.status === "scheduled" &&
                  "bg-green-100 text-blue-800",
                broadcast.status === "failed" && "bg-red-100 text-red-800"
              )}
            >
              {broadcast.status.charAt(0).toUpperCase() +
                broadcast.status.slice(1)}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            disabled={!currentTitle && !currentContent}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>

        <Card className="p-8 space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Enter your broadcast title..."
                        {...field}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className={cn(
                          "!text-2xl font-bold border-t-0 border-l-0 border-r-0 px-0 py-2 placeholder:text-muted-foreground/50 focus-visible:ring-0 bg-transparent h-auto",
                          "border-b border-input"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-border">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Subject
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Email subject line" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Content
                    </FormLabel>
                    <FormControl>
                      <RichTextEditor
                        content={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {canSend && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Scheduling Options
                  </h3>
                  <RadioGroup
                    value={schedulingOption}
                    onValueChange={setSchedulingOption}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="now" id="now" />
                      <Label htmlFor="now">Send immediately</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1hour" id="1hour" />
                      <Label htmlFor="1hour">Send in 1 hour</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="24hours" id="24hours" />
                      <Label htmlFor="24hours">Send in 24 hours</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1week" id="1week" />
                      <Label htmlFor="1week">Send in 1 week</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1month" id="1month" />
                      <Label htmlFor="1month">Send in 1 month</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom">
                        Schedule for specific date & time
                      </Label>
                    </div>
                  </RadioGroup>

                  {schedulingOption === "custom" && (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="customDateTime">Select Date & Time</Label>
                      <Input
                        id="customDateTime"
                        type="datetime-local"
                        value={customDateTime}
                        onChange={(e) => setCustomDateTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </Card>
              )}

              <div className="flex justify-between items-center pt-6 border-t">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>

                <div className="flex items-center space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={saveDraft}
                    disabled={isSaving || isLoading}
                    className="flex items-center space-x-2 bg-transparent"
                  >
                    {isSaving ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                  </Button>

                  {canSend && (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2"
                    >
                      {isLoading ? (
                        <Clock className="w-4 h-4 animate-spin" />
                      ) : schedulingOption === "now" ? (
                        <Send className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>
                        {isLoading
                          ? "Processing..."
                          : schedulingOption === "now"
                          ? "Send Now"
                          : "Schedule Broadcast"}
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </Card>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Email Preview</h3>
            <div className="border bg-gray-50 min-h-[400px] overflow-auto">
              <div className="bg-white m-2 shadow-sm">
                <div className="bg-[hsl(155,100%,20%)] px-6 py-7 text-center">
                  <div className="w-[135px] h-[37.5px] bg-white/20 mx-auto mb-[6px]"></div>
                  <p className="text-white text-base m-0 opacity-90">
                    Newsletter Update
                  </p>
                  <div className="w-[60px] h-[3px] bg-white opacity-30 mx-auto mt-3"></div>
                </div>

                <div className="px-6 py-7">
                  <h1 className="text-[hsl(155,25%,15%)] text-[26px] font-bold m-0 mb-6 text-center">
                    {currentTitle || "Your broadcast title will appear here"}
                  </h1>

                  <div className="bg-white p-6 border-2 border-[hsl(120,15%,88%)]">
                    <div
                      className="text-gray-700 text-[15px] leading-[1.6] m-0"
                      dangerouslySetInnerHTML={{
                        __html:
                          currentContent ||
                          "<p>Your content will appear here...</p>",
                      }}
                    />
                  </div>
                </div>

                <hr className="border-[hsl(120,15%,88%)] my-6" />

                <div className="bg-[hsl(155,100%,20%)] px-6 py-6 text-center">
                  <p className="text-white text-[13px] m-0 mb-3 opacity-90">
                    Thank you for subscribing to the Northwest Governors Forum
                    newsletter.
                  </p>
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-white text-[11px] m-0 mb-[6px] opacity-80">
                      © {new Date().getFullYear()} Northwest Governors Forum.
                      All rights reserved.
                    </p>
                    <p className="text-white text-[11px] m-0 mb-[6px] opacity-70">
                      Northwest Region, Nigeria
                    </p>
                    <p className="text-white text-[10px] m-0 opacity-60">
                      <a href="#" className="underline">
                        Unsubscribe
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              <p>
                <strong>From:</strong> {currentFromEmail}
              </p>
              <p>
                <strong>Subject:</strong>{" "}
                {currentSubject || "Your subject line"}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
