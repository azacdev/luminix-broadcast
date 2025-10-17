"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Send,
  Calendar,
  Eye,
  Edit,
  Mail,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

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
import { SendBroadcastModal } from "./send-broadcast-modal";
import { ResendBroadcastModal } from "./resend-broadcast-modal";
import { DeleteBroadcastModal } from "./delete-broadcast-modal";

export function BroadcastsClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const trpc = useTRPC();

  const { data: broadcasts = [], refetch } = useQuery(
    trpc.broadcasts.getMany.queryOptions()
  );

  const filteredBroadcasts = broadcasts.filter((broadcast) => {
    const title = broadcast.title || "";
    const subject = broadcast.subject || "";
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || broadcast.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-green-100 text-blue-800",
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
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center flex-wrap gap-2 justify-between">
        <div className="flex items-center flex-wrap gap-2 space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search broadcasts..."
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Broadcasts ({filteredBroadcasts.length})</CardTitle>
          <CardDescription>
            Manage your newsletter broadcasts and campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBroadcasts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {broadcasts.length === 0
                  ? "No broadcasts yet"
                  : "No broadcasts found"}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                {broadcasts.length === 0
                  ? "Get started by creating your first newsletter broadcast."
                  : "Try adjusting your search terms or filters to find what you're looking for."}
              </p>
              {broadcasts.length === 0 && (
                <Link href="/broadcasts/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first broadcast
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBroadcasts.map((broadcast) => (
                  <TableRow key={broadcast.id}>
                    <TableCell className="font-medium">
                      {broadcast.title}
                    </TableCell>
                    <TableCell>{broadcast.subject}</TableCell>
                    <TableCell>{getStatusBadge(broadcast.status)}</TableCell>
                    <TableCell>{broadcast.recipient_count || 0}</TableCell>
                    {/* <TableCell>{broadcast.created_at}</TableCell> */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/newsletter/broadcasts/${broadcast.id}/preview`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </Link>
                          </DropdownMenuItem>

                          {/* Edit - only for draft and failed */}
                          {(broadcast.status === "draft" ||
                            broadcast.status === "failed") && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/newsletter/broadcasts/${broadcast.id}/edit`}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {/* Send/Schedule - only for draft and failed */}
                          {(broadcast.status === "draft" ||
                            broadcast.status === "failed") && (
                            <>
                              <SendBroadcastModal
                                broadcast={broadcast}
                                onSent={() => refetch()}
                              >
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  Send Now
                                </DropdownMenuItem>
                              </SendBroadcastModal>

                              {broadcast.status === "draft" && (
                                <SendBroadcastModal
                                  broadcast={broadcast}
                                  onSent={() => refetch()}
                                  allowScheduling
                                >
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Schedule
                                  </DropdownMenuItem>
                                </SendBroadcastModal>
                              )}
                            </>
                          )}

                          {/* Resend - only for sent broadcasts */}
                          {broadcast.status === "sent" && (
                            <ResendBroadcastModal
                              broadcast={broadcast}
                              onResent={() => refetch()}
                            >
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Resend
                              </DropdownMenuItem>
                            </ResendBroadcastModal>
                          )}

                          <DropdownMenuSeparator />

                          {/* Delete */}
                          <DeleteBroadcastModal
                            broadcast={broadcast}
                            onDeleted={() => refetch()}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DeleteBroadcastModal>
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
