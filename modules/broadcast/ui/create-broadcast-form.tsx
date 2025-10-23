"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Eye, Send, Clock, FileText, Mail } from "lucide-react";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

import RichTextEditor from "./rich-text-editor";
import { EmailPreview } from "./email-preview";
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

export function CreateBroadcastForm() {
  const router = useRouter();
  const [schedulingOption, setSchedulingOption] = useState<string>("now");
  const [customDateTime, setCustomDateTime] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const trpc = useTRPC();

  const createBroadcast = useMutation(trpc.broadcasts.create.mutationOptions());

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

  const handleTitleChange = (value: string) => {
    form.setValue("title", value);
  };

  const saveDraft = async () => {
    try {
      const formData = form.getValues();

      const payload: any = {
        title: formData.title?.trim() || "Untitled Draft",
        subject: formData.subject?.trim() || "No Subject",
        content: formData.content?.trim() || "",
        fromEmail: formData.fromEmail?.trim() || "newsletter@azacdev.com",
      };

      await createBroadcast.mutateAsync(payload);
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
        title: data.title!,
        subject: data.subject!,
        content: data.content!,
        fromEmail: data.fromEmail!,
        scheduledAt: scheduledTime,
      };

      const newBroadcast = await createBroadcast.mutateAsync(payload);
      await sendBroadcast.mutateAsync({
        id: newBroadcast.id,
        scheduledAt: scheduledTime,
      });

      const message =
        schedulingOption === "now"
          ? "Broadcast sent successfully!"
          : "Broadcast scheduled successfully!";
      toast.success(message);
      router.push("/broadcasts");
    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast.error("Failed to send broadcast");
    }
  };

  const currentTitle = form.watch("title");
  const currentSubject = form.watch("subject");
  const currentContent = form.watch("content");
  const currentFromEmail = form.watch("fromEmail");

  const isLoading = createBroadcast.isPending || sendBroadcast.isPending;
  const isSaving = createBroadcast.isPending;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm px-2 py-1 bg-yellow-100 text-yellow-800">
              Draft
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
                          "border-b border-input shadow-none"
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-border">
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
                    <span>{isSaving ? "Saving..." : "Save Draft"}</span>
                  </Button>

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
            <EmailPreview
              title={currentTitle || ""}
              content={currentContent || ""}
              subject={currentSubject || ""}
              fromEmail={currentFromEmail || ""}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
