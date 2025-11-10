"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { RemoveSubscriberModal } from "./remove-subscriber-modal";

export type Subscriber = {
  id: string;
  email: string;
  status: string;
  category: string;
  source: string | null;
  created_at: Date | null;
};

export const subscribersColumns: ColumnDef<Subscriber>[] = [
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
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as string;
      const colors: Record<string, string> = {
        general: "bg-gray-100 text-gray-800",
        announcements: "bg-blue-100 text-blue-800",
        updates: "bg-purple-100 text-purple-800",
        newsletters: "bg-indigo-100 text-indigo-800",
        promotions: "bg-amber-100 text-amber-800",
      };
      return (
        <Badge
          variant="outline"
          className={colors[category] || "bg-gray-100 text-gray-800"}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const colors = {
        active: "bg-green-100 text-green-800",
        unsubscribed: "bg-red-100 text-red-800",
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
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("source")}</div>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Subscribed",
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
      const subscriber = row.original;

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
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard
                    .writeText(subscriber.email)
                    .then(() => {
                      toast.success("Email copied to clipboard");
                    })
                    .catch(() => {
                      toast.error("Failed to copy email");
                    });
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <RemoveSubscriberModal
                subscriberId={subscriber.id}
                subscriberEmail={subscriber.email}
                onRemove={() => window.location.reload()}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </RemoveSubscriberModal>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
