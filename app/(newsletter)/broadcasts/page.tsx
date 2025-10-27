import Link from "next/link";
import { Suspense } from "react";
import { Mail } from "lucide-react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { getQueryClient, trpc } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import { BroadcastsClient } from "@/modules/broadcast/ui/broadcasts-client";
import { BroadcastsPageSkeleton } from "@/modules/broadcast/ui/broadcasts-page-skeleton";

export default async function BroadcastsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const queryClient = getQueryClient();

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;

  try {
    void queryClient.prefetchQuery(
      trpc.broadcasts.getMany.queryOptions({
        page,
        limit,
      })
    );

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Newsletter Broadcasts
          </h2>
        </div>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<BroadcastsPageSkeleton />}>
            <BroadcastsClient initialPage={page} initialPageSize={limit} />
          </Suspense>
        </HydrationBoundary>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center p-4 md:p-8 pt-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to load broadcasts
          </h3>
          <p className="text-gray-600 mb-4">
            There was an error loading your broadcast data.
          </p>
          <Link href="/dashboard/newsletter/broadcasts">
            <Button variant="outline">Try Again</Button>
          </Link>
        </div>
      </div>
    );
  }
}
