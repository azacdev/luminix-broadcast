"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Mail, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

interface BroadcastPreviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BroadcastPreviewPage({
  params,
}: BroadcastPreviewPageProps) {
  const { id } = use(params);
  const trpc = useTRPC();

  if (!id) {
    notFound();
  }

  const {
    data: broadcast,
    isLoading,
    isError,
  } = useQuery(
    trpc.broadcasts.getOne.queryOptions({
      id,
    })
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center p-4 md:p-8 pt-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading broadcast...
          </h3>
          <p className="text-gray-600">
            Please wait while we fetch the broadcast details.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !broadcast) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center p-4 md:p-8 pt-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Broadcast not found
          </h3>
          <p className="text-gray-600 mb-4">
            The broadcast you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Link href="/dashboard/newsletter/broadcasts">
            <Button variant="outline">Go back to broadcasts</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-dvh w-full p-4 md:p-8 pt-6">
      <div className="w-full">
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
              <span className="text-muted-foreground italic">
                Untitled Draft
              </span>
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
              {/* Created: {new Date(broadcast.created_at).toLocaleDateString()} */}
            </p>
          </div>
        </div>

        {/* Email Preview Section */}
        <div className="mx-auto max-w-[600px] border-t border-black pt-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Email Preview
          </h2>

          <div className="bg-gray-100 p-6">
            <div className="bg-white shadow-lg overflow-hidden">
              {/* Email Header - Matches Newsletter Broadcast Email */}
              <div className="bg-[hsl(155,100%,20%)] px-6 py-7 text-center">
                <Image
                  src={"/logo.png"}
                  alt="Northwest Governors Forum"
                  width="180"
                  height="50"
                  className="mx-auto mb-[6px]"
                />
                <p className="text-white text-base m-0 opacity-90">
                  Newsletter Update
                </p>
                <div className="w-[60px] h-[3px] bg-white opacity-30 mx-auto mt-3"></div>
              </div>

              {/* Email Content - Matches Newsletter Broadcast Email */}
              <div className="px-6 py-7">
                <h1 className="text-[hsl(155,25%,15%)] text-[26px] font-bold m-0 mb-6 text-center">
                  {broadcast.title || "Untitled Broadcast"}
                </h1>

                <div className="bg-white p-6 border-2 border-[hsl(120,15%,88%)]">
                  {broadcast.content && broadcast.content.trim() ? (
                    <div
                      className="text-gray-700 text-[15px] leading-[1.6] m-0"
                      dangerouslySetInnerHTML={{
                        __html: broadcast.content,
                      }}
                    />
                  ) : (
                    <p className="text-gray-500 italic text-center text-[15px]">
                      No content yet...
                    </p>
                  )}
                </div>
              </div>

              <hr className="border-[hsl(120,15%,88%)] my-6" />

              {/* Email Footer - Matches Newsletter Broadcast Email */}
              <div className="bg-[hsl(155,100%,20%)] px-6 py-6 text-center">
                <p className="text-white text-[13px] m-0 mb-3 opacity-90">
                  Thank you for subscribing to the Northwest Governors Forum
                  newsletter.
                </p>

                <div className="border-t border-white border-opacity-20 pt-4 mt-4">
                  <p className="text-white text-[11px] m-0 mb-[6px] opacity-80">
                    © {new Date().getFullYear()} Northwest Governors Forum. All
                    rights reserved.
                  </p>
                  <p className="text-white text-[11px] m-0 mb-[6px] opacity-70">
                    Northwest Region, Nigeria
                  </p>
                  <p className="text-white text-[10px] m-0 opacity-60">
                    You&apos;re receiving this email because you subscribed to
                    our newsletter.{" "}
                    <a href="#" className="text-white underline">
                      Unsubscribe
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
