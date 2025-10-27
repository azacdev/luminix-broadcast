"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { BulkImportModal } from "./bulk-import-modal";
import { CSVImportModal } from "./csv-import-modal";

interface ImportDropdownProps {
  onImportComplete: () => void;
}

export function ImportDropdown({ onImportComplete }: ImportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Bulk
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <BulkImportModal onImportComplete={onImportComplete}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            Add Manually
          </DropdownMenuItem>
        </BulkImportModal>
        <CSVImportModal onImportComplete={onImportComplete}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            Add CSV
          </DropdownMenuItem>
        </CSVImportModal>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
