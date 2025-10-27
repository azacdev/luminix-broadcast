import Link from "next/link";
import { Edit } from "lucide-react";
import { notFound } from "next/navigation";
import { caller } from "@/trpc/server";
import { render } from "@react-email/render";

import { Button } from "@/components/ui/button";
import BroadcastEmail from "@/emails/broadcast-email";

interface BroadcastPreviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BroadcastPreviewPage({
  params,
}: BroadcastPreviewPageProps) {
  const { id } = await params;

  const broadcast = await caller.broadcasts.getOne({ id });

  if (!broadcast) {
    notFound();
  }

  const emailHtml = await render(
    <BroadcastEmail
      title={broadcast.title || "Untitled Broadcast"}
      content={broadcast.content || "<p>No content yet...</p>"}
      previewText={broadcast.subject || "Newsletter Update"}
    />
  );

  return (
    <div className="min-h-dvh p-4 md:p-8">
      {/* Back Navigation and Edit Button */}
      <div className="pb-8 flex items-center justify-between">
        <Link
          href="/broadcasts"
          className="text-primary font-medium inline-flex gap-1 cursor-pointer hover:underline"
        >
          <p className="-mt-0.5">← </p> Back to Broadcasts
        </Link>
        <Button asChild>
          <Link href={`/broadcasts/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Broadcast
          </Link>
        </Button>
      </div>

      {/* Header Section */}
      <div className="mx-auto max-w-[800px] mb-8">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight font-clash-display mb-4">
          {!broadcast.title || broadcast.title === "Untitled Draft" ? (
            <span className="text-muted-foreground italic">Untitled Draft</span>
          ) : (
            broadcast.title
          )}
        </h1>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-4 pt-6">
          <p className="text-foreground md:text-[19px] text-base">
            Status:{" "}
            <span className="capitalize font-medium">{broadcast.status}</span>
          </p>
          <p className="text-foreground md:text-[19px] text-base">
            Subject: {broadcast.subject || "No subject"}
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-4">
          <p className="text-foreground md:text-[19px] text-base">
            From: {broadcast.from_email || "No sender specified"}
          </p>
          <p className="text-foreground md:text-[19px] text-base">
            Created:{" "}
            {broadcast.created_at
              ? new Date(broadcast.created_at).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <iframe
          srcDoc={emailHtml}
          className="w-full min-h-[600px] border-0"
          title="Email Preview"
        />
      </div>
    </div>
  );
}
