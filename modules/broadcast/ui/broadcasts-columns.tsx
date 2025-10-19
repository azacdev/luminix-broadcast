"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  Calendar,
  Trash2,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SendBroadcastModal } from "./send-broadcast-modal";
import { ResendBroadcastModal } from "./resend-broadcast-modal";
import { DeleteBroadcastModal } from "./delete-broadcast-modal";

export type Broadcast = {
  id: string;
  title: string;
  subject: string;
  status: string;
  recipient_count: number | null;
  created_at: Date | null;
};

export const broadcastsColumns: ColumnDef<Broadcast>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("title")}</div>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => <div>{row.getValue("subject")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const colors = {
        draft: "bg-gray-100 text-gray-800",
        scheduled: "bg-blue-100 text-blue-800",
        sent: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800",
      };
      return (
        <Badge
          variant="outline"
          className={
            colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
          }
        >
          {status.toUpperCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "recipient_count",
    header: "Recipients",
    cell: ({ row }) => <div>{row.getValue("recipient_count") || 0}</div>,
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = row.getValue("created_at") as Date | null;
      return date
        ? date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const broadcast = row.original as any;

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/broadcasts/${broadcast.id}/preview`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Link>
              </DropdownMenuItem>

              {(broadcast.status === "draft" ||
                broadcast.status === "failed") && (
                <DropdownMenuItem asChild>
                  <Link href={`/broadcasts/${broadcast.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {(broadcast.status === "draft" ||
                broadcast.status === "failed") && (
                <>
                  <SendBroadcastModal
                    broadcast={broadcast}
                    onSent={() => window.location.reload()}
                  >
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Now
                    </DropdownMenuItem>
                  </SendBroadcastModal>

                  {broadcast.status === "draft" && (
                    <SendBroadcastModal
                      broadcast={broadcast}
                      onSent={() => window.location.reload()}
                      allowScheduling
                    >
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule
                      </DropdownMenuItem>
                    </SendBroadcastModal>
                  )}
                </>
              )}

              {broadcast.status === "sent" && (
                <ResendBroadcastModal
                  broadcast={broadcast}
                  onResent={() => window.location.reload()}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Resend
                  </DropdownMenuItem>
                </ResendBroadcastModal>
              )}

              <DropdownMenuSeparator />

              <DeleteBroadcastModal
                broadcast={broadcast}
                onDeleted={() => window.location.reload()}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DeleteBroadcastModal>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
