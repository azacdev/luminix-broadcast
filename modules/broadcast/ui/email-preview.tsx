"use client";

import React, { useEffect, useState } from "react";
import { render } from "@react-email/render";
import BroadcastEmail from "@/emails/broadcast-email";

interface EmailPreviewProps {
  title: string;
  content: string;
  subject: string;
  fromEmail: string;
}

export function EmailPreview({
  title,
  content,
  subject,
  fromEmail,
}: EmailPreviewProps) {
  const [emailHtml, setEmailHtml] = useState<string>("");

  useEffect(() => {
    const generateHtml = async () => {
      const html = await render(
        <BroadcastEmail
          title={title || "Untitled Broadcast"}
          content={content || "<p>No content yet...</p>"}
          previewText={subject || "Newsletter Update"}
        />
      );
      setEmailHtml(html);
    };

    generateHtml();
  }, [title, content, subject]);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <iframe
          srcDoc={emailHtml}
          className="w-full min-h-[600px] border-0"
          title="Email Preview"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
