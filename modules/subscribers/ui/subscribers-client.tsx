"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Upload,
  Copy,
} from "lucide-react";

import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BulkImportModal } from "./bulk-import-modal";
import { AddSubscriberModal } from "./add-subscriber-modal";
import { RemoveSubscriberModal } from "./remove-subscriber-modal";

export function SubscribersClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const trpc = useTRPC();

  const { data: subscribers = [], refetch } = useQuery(
    trpc.subscribers.getMany.queryOptions()
  );

  const filteredSubscribers = subscribers.filter((subscriber) => {
    const email = subscriber.email || "";
    const matchesSearch = email
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || subscriber.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
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
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center flex-wrap gap-2 justify-between">
        <div className="flex items-center flex-wrap gap-2 space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <BulkImportModal onImportComplete={() => refetch()}>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
          </BulkImportModal>
          <AddSubscriberModal onSubscriberAdded={() => refetch()}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Subscriber
            </Button>
          </AddSubscriberModal>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscribers ({filteredSubscribers.length})</CardTitle>
          <CardDescription>
            Manage your newsletter subscribers and their preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubscribers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {subscribers.length === 0
                  ? "No subscribers yet"
                  : "No subscribers found"}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                {subscribers.length === 0
                  ? "Get started by adding your first newsletter subscriber."
                  : "Try adjusting your search terms or filters to find what you're looking for."}
              </p>
              {subscribers.length === 0 && (
                <AddSubscriberModal onSubscriberAdded={() => refetch()}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first subscriber
                  </Button>
                </AddSubscriberModal>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium">
                      {subscriber.email}
                    </TableCell>
                    <TableCell>{getStatusBadge(subscriber.status)}</TableCell>
                    <TableCell className="capitalize">
                      {subscriber.source}
                    </TableCell>
                    {/* <TableCell>{subscriber.created_at}</TableCell> */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
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
                            <Copy />
                            Copy email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <RemoveSubscriberModal
                            subscriberId={subscriber.id}
                            subscriberEmail={subscriber.email}
                            onRemove={() => refetch()}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </RemoveSubscriberModal>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
