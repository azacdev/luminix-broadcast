import { Skeleton } from "@/components/ui/skeleton";

export default function BroadcastPreviewSkeleton() {
  return (
    <main className="relative min-h-dvh w-full p-4 md:p-8 pt-6">
      <div className="w-full">
        {/* Back Navigation */}
        <div className="pb-8 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Header Section */}
        <div className="mx-auto max-w-[800px] mb-8">
          <Skeleton className="h-12 w-3/4 mb-4" />

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-4 pt-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-48" />
          </div>

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-4">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        {/* Email Preview Section */}
        <div className="mx-auto max-w-[600px] border-t border-gray-200 pt-8">
          <Skeleton className="h-8 w-48 mx-auto mb-6" />

          <div className="bg-gray-100 p-8 rounded-lg">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Email Header Skeleton */}
              <div className="bg-gray-300 px-8 py-10 text-center">
                <Skeleton className="w-40 h-12 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
                <Skeleton className="w-16 h-1 mx-auto mt-4" />
              </div>

              {/* Email Content Skeleton */}
              <div className="px-8 py-10">
                <Skeleton className="h-8 w-3/4 mx-auto mb-8" />

                <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100">
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-4 w-5/6 mb-3" />
                  <Skeleton className="h-4 w-4/5 mb-3" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>

              {/* Email Footer Skeleton */}
              <div className="bg-gray-300 px-8 py-8 text-center">
                <Skeleton className="h-4 w-64 mx-auto mb-4" />
                <div className="border-t border-gray-400 pt-5 mt-5">
                  <Skeleton className="h-3 w-48 mx-auto mb-2" />
                  <Skeleton className="h-3 w-56 mx-auto mb-2" />
                  <Skeleton className="h-3 w-40 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
