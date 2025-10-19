"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Mail, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BroadcastsDataTable } from "./broadcasts-data-table";
import { broadcastsColumns } from "./broadcasts-columns";
import { BroadcastsTableSkeleton } from "./broadcasts-table-skeleton";

interface BroadcastsClientProps {
  initialPage?: number;
  initialPageSize?: number;
}

export function BroadcastsClient({
  initialPage = 1,
  initialPageSize = 10,
}: BroadcastsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rowSelection, setRowSelection] = useState({});

  const trpc = useTRPC();

  // Update URL when page or pageSize changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (page !== 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }

    if (pageSize !== 10) {
      params.set("limit", pageSize.toString());
    } else {
      params.delete("limit");
    }

    const newUrl = params.toString()
      ? `?${params.toString()}`
      : window.location.pathname;

    router.replace(newUrl, { scroll: false });
  }, [page, pageSize, router, searchParams]);

  const { data, refetch, isLoading } = useQuery(
    trpc.broadcasts.getMany.queryOptions({
      page,
      limit: pageSize,
    })
  );

  const deleteMany = useMutation(
    trpc.broadcasts.deleteMany.mutationOptions({
      onSuccess: (result) => {
        toast.success(`Successfully deleted ${result.deleted} broadcast(s)`);
        setShowDeleteDialog(false);
        setRowSelection({});
        refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete broadcasts");
      },
    })
  );

  const broadcasts = data?.broadcasts || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  // Memoize filtered broadcasts
  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter((broadcast) => {
      const title = broadcast.title || "";
      const subject = broadcast.subject || "";
      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || broadcast.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [broadcasts, searchTerm, filterStatus]);

  // Get selected broadcast IDs from rowSelection state
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key as keyof typeof rowSelection])
      .map((index) => filteredBroadcasts[parseInt(index)]?.id)
      .filter(Boolean);
  }, [rowSelection, filteredBroadcasts]);

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one broadcast to delete");
      return;
    }
    setShowDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    if (selectedIds.length === 0) return;
    deleteMany.mutate({ ids: selectedIds });
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
        <Link href="/broadcasts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Broadcast
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Broadcasts ({total})</CardTitle>
              <CardDescription>
                Manage your newsletter broadcasts and campaigns
              </CardDescription>
            </div>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <BroadcastsTableSkeleton />
          ) : filteredBroadcasts.length === 0 ? (
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
            <BroadcastsDataTable
              columns={broadcastsColumns}
              data={filteredBroadcasts}
              pageCount={totalPages}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Broadcasts</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length} broadcast(s)?
              This action cannot be undone and will remove them from both your
              database and Resend.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={deleteMany.isPending}
            >
              {deleteMany.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
