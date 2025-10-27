"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

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
import { ImportDropdown } from "./import-dropdown";
import { AddSubscriberModal } from "./add-subscriber-modal";
import { SubscribersDataTable } from "./subscribers-data-table";
import { subscribersColumns } from "./subscribers-columns";
import { SubscribersTableSkeleton } from "./subscribers-table-skeleton";

interface SubscribersClientProps {
  initialPage?: number;
  initialPageSize?: number;
}

export function SubscribersClient({
  initialPage = 1,
  initialPageSize = 10,
}: SubscribersClientProps) {
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
    trpc.subscribers.getMany.queryOptions({
      page,
      limit: pageSize,
    })
  );

  const deleteMany = useMutation(
    trpc.subscribers.deleteMany.mutationOptions({
      onSuccess: (result) => {
        toast.success(`Successfully deleted ${result.deleted} subscriber(s)`);
        setShowDeleteDialog(false);
        setRowSelection({});
        refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete subscribers");
      },
    })
  );

  const subscribers = data?.subscribers || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  // Memoize filtered subscribers to prevent unnecessary recalculations
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((subscriber) => {
      const email = subscriber.email || "";
      const matchesSearch = email
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || subscriber.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [subscribers, searchTerm, filterStatus]);

  // Get selected subscriber IDs from rowSelection state
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key as keyof typeof rowSelection])
      .map((index) => filteredSubscribers[Number.parseInt(index)]?.id)
      .filter(Boolean);
  }, [rowSelection, filteredSubscribers]);

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one subscriber to delete");
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
          <ImportDropdown onImportComplete={() => refetch()} />
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscribers ({total})</CardTitle>
              <CardDescription>
                Manage your newsletter subscribers and their preferences
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
            <SubscribersTableSkeleton />
          ) : filteredSubscribers.length === 0 ? (
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
            <SubscribersDataTable
              columns={subscribersColumns}
              data={filteredSubscribers}
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
            <DialogTitle>Delete Subscribers</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length}{" "}
              subscriber(s)? This action cannot be undone and will remove them
              from both your database and Resend audience.
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
