import { CreateBroadcastForm } from "@/modules/broadcast/ui/create-broadcast-form";
import Link from "next/link";

export default function NewBroadcastPage() {
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

      <h2 className="text-3xl font-bold tracking-tight">
        Create New Broadcast
      </h2>

      <CreateBroadcastForm />
    </div>
  );
}
