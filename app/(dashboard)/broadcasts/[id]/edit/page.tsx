import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EditBroadcastForm } from "@/modules/broadcast/ui/edit-broadcast-form";

interface EditBroadcastPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditBroadcastPage({ params }: EditBroadcastPageProps) {
  const { id } = use(params);

  if (!id) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="pb-8 flex items-center justify-between">
        <Link
          href="/broadcasts"
          className="text-primary font-medium inline-flex gap-1 cursor-pointer hover:underline"
        >
          <p className="-mt-0.5">← </p> Back to Broadcasts
        </Link>
      </div>
      <EditBroadcastForm broadcastId={id} />
    </div>
  );
}
