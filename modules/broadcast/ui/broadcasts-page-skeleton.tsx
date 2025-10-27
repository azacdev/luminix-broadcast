import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function BroadcastsPageSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Page Header */}
      <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-9 w-[280px]" />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex items-center flex-wrap gap-2 justify-between">
          <div className="flex items-center flex-wrap gap-2 space-x-2">
            {/* Search Input Skeleton */}
            <Skeleton className="h-10 w-[300px]" />
            {/* Status Filter Skeleton */}
            <Skeleton className="h-10 w-[150px]" />
          </div>
          {/* Create Button Skeleton */}
          <Skeleton className="h-10 w-[170px]" />
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                {/* Card Title Skeleton */}
                <Skeleton className="h-6 w-[180px]" />
                {/* Card Description Skeleton */}
                <Skeleton className="h-4 w-[320px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Table Skeleton */}
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Skeleton className="h-4 w-4" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-4 w-[60px]" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-4 w-[70px]" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-4 w-[60px]" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-4 w-[80px]" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-4 w-[70px]" />
                      </TableHead>
                      <TableHead className="text-right">
                        <Skeleton className="h-4 w-[60px] ml-auto" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-[200px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-[150px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[80px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-[50px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-8 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Skeleton */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[150px]" />
                <div className="flex items-center space-x-6 lg:space-x-8">
                  <Skeleton className="h-8 w-[180px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-[60px]" />
                    <Skeleton className="h-8 w-[80px]" />
                    <Skeleton className="h-8 w-[60px]" />
                    <Skeleton className="h-8 w-[60px]" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
