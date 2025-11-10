// "use client";

// import type React from "react";
// import { useState } from "react";
// import { Upload, Check } from "lucide-react";

// import { useTRPC } from "@/trpc/client";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { useMutation } from "@tanstack/react-query";

// interface CSVImportModalProps {
//   children: React.ReactNode;
//   onImportComplete: () => void;
// }

// export function CSVImportModal({
//   children,
//   onImportComplete,
// }: CSVImportModalProps) {
//   const [open, setOpen] = useState(false);
//   const [step, setStep] = useState<"upload" | "review">("upload");
//   const [emails, setEmails] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [isUploading, setIsUploading] = useState(false);

//   const trpc = useTRPC();
//   const createSubscriber = useMutation(
//     trpc.subscribers.create.mutationOptions()
//   );

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setIsUploading(true);
//     setUploadProgress(0);

//     const reader = new FileReader();

//     reader.onprogress = (event) => {
//       if (event.lengthComputable) {
//         const percentComplete = (event.loaded / event.total) * 100;
//         setUploadProgress(percentComplete);
//       }
//     };

//     reader.onload = (event) => {
//       try {
//         const csv = event.target?.result as string;
//         const lines = csv.split("\n").filter((line) => line.trim());

//         if (lines.length < 2) {
//           toast.error("CSV file must contain headers and at least one row");
//           setIsUploading(false);
//           setUploadProgress(0);
//           return;
//         }

//         const headerLine = lines[0];
//         const headers = headerLine.split(",").map((h) => h.trim());
//         const emailColumnIndex = headers.findIndex((h) =>
//           h.toLowerCase().includes("email")
//         );

//         if (emailColumnIndex === -1) {
//           toast.error("CSV must contain an 'email' column");
//           setIsUploading(false);
//           setUploadProgress(0);
//           return;
//         }

//         const parsedEmails: string[] = [];
//         for (let i = 1; i < lines.length; i++) {
//           const values = lines[i].split(",").map((v) => v.trim());
//           const email = values[emailColumnIndex]?.trim();
//           if (email) {
//             parsedEmails.push(email);
//           }
//         }

//         setEmails(parsedEmails);
//         setUploadProgress(100);
//         setIsUploading(false);
//         setStep("review");
//         toast.success(`Loaded ${parsedEmails.length} emails from CSV`);
//       } catch (error) {
//         toast.error("Failed to parse CSV file");
//         console.error(error);
//         setIsUploading(false);
//         setUploadProgress(0);
//       }
//     };
//     reader.readAsText(file);
//   };

//   const handleSubmit = async () => {
//     setIsLoading(true);

//     const results = {
//       successful: [] as string[],
//       failed: [] as string[],
//     };

//     for (const email of emails) {
//       try {
//         await createSubscriber.mutateAsync({ email });
//         results.successful.push(email);
//       } catch (error) {
//         results.failed.push(email);
//       }
//     }

//     const successCount = results.successful.length;
//     const failCount = results.failed.length;

//     if (successCount > 0) {
//       toast.success(
//         `Successfully added ${successCount} subscriber${
//           successCount > 1 ? "s" : ""
//         }`
//       );
//     }

//     if (failCount > 0) {
//       toast.error(
//         `Failed to add ${failCount} subscriber${failCount > 1 ? "s" : ""}`
//       );
//     }

//     setEmails([]);
//     setStep("upload");
//     setOpen(false);
//     setIsLoading(false);
//     onImportComplete();
//   };

//   const getStepStatus = (stepName: "upload" | "review") => {
//     const steps = ["upload", "review"];
//     const currentIndex = steps.indexOf(step);
//     const stepIndex = steps.indexOf(stepName);

//     if (stepIndex < currentIndex) return "completed";
//     if (stepIndex === currentIndex) return "active";
//     return "pending";
//   };

//   const validEmails = emails.filter((email) => email.trim());

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>{children}</DialogTrigger>
//       <DialogContent className="sm:max-w-[700px]">
//         {/* Step Indicator */}
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center gap-2">
//             <div
//               className={`flex items-center justify-center w-8 h-8 rounded-full ${
//                 getStepStatus("upload") === "completed"
//                   ? "bg-green-500 text-white"
//                   : getStepStatus("upload") === "active"
//                   ? "bg-primary text-white"
//                   : "bg-muted text-muted-foreground"
//               }`}
//             >
//               {getStepStatus("upload") === "completed" ? (
//                 <Check className="w-4 h-4" />
//               ) : (
//                 "1"
//               )}
//             </div>
//             <span className="text-sm font-medium">Upload</span>
//           </div>

//           <div className="flex-1 h-0.5 mx-2 bg-muted" />

//           <div className="flex items-center gap-2">
//             <div
//               className={`flex items-center justify-center w-8 h-8 rounded-full ${
//                 getStepStatus("review") === "active"
//                   ? "bg-primary text-white"
//                   : "bg-muted text-muted-foreground"
//               }`}
//             >
//               2
//             </div>
//             <span className="text-sm font-medium">Review</span>
//           </div>
//         </div>

//         {/* Upload Step */}
//         {step === "upload" && (
//           <>
//             <DialogHeader>
//               <DialogTitle>Upload CSV File</DialogTitle>
//               <DialogDescription>
//                 Select a CSV file with an email column to import subscribers
//               </DialogDescription>
//             </DialogHeader>

//             <div className="border-2 border-dashed rounded-lg p-8 text-center">
//               <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
//               <p className="text-sm text-muted-foreground mb-4">
//                 Drop files here or{" "}
//                 <label className="text-primary cursor-pointer hover:underline">
//                   browse files
//                   <input
//                     type="file"
//                     accept=".csv"
//                     onChange={handleFileUpload}
//                     className="hidden"
//                     disabled={isUploading}
//                   />
//                 </label>
//               </p>
//               <p className="text-xs text-muted-foreground">
//                 CSV files only. Maximum 10MB.
//               </p>

//               {isUploading && (
//                 <div className="mt-6 space-y-2">
//                   <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
//                     <div
//                       className="bg-primary h-full transition-all duration-300"
//                       style={{ width: `${uploadProgress}%` }}
//                     />
//                   </div>
//                   <p className="text-xs text-muted-foreground">
//                     {Math.round(uploadProgress)}% uploaded
//                   </p>
//                 </div>
//               )}
//             </div>

//             <DialogFooter>
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setOpen(false)}
//                 disabled={isUploading}
//               >
//                 Cancel
//               </Button>
//             </DialogFooter>
//           </>
//         )}

//         {/* Review Step */}
//         {step === "review" && (
//           <>
//             <DialogHeader>
//               <DialogTitle>Review</DialogTitle>
//               <DialogDescription>
//                 Review the emails before importing
//               </DialogDescription>
//             </DialogHeader>

//             <div className="space-y-4">
//               <div className="flex gap-4 text-sm">
//                 <div className="bg-muted px-3 py-2 rounded">
//                   <div className="font-semibold">All</div>
//                   <div className="text-muted-foreground">{emails.length}</div>
//                 </div>
//                 <div className="bg-muted px-3 py-2 rounded">
//                   <div className="font-semibold">Valid</div>
//                   <div className="text-muted-foreground">
//                     {validEmails.length}
//                   </div>
//                 </div>
//                 <div className="bg-muted px-3 py-2 rounded">
//                   <div className="font-semibold">Error</div>
//                   <div className="text-destructive">
//                     {emails.length - validEmails.length}
//                   </div>
//                 </div>
//               </div>

//               <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
//                 <table className="w-full text-sm">
//                   <thead className="bg-muted sticky top-0">
//                     <tr>
//                       <th className="px-4 py-2 text-left font-semibold">
//                         Email
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {validEmails.slice(0, 10).map((email, index) => (
//                       <tr key={index} className="border-t">
//                         <td className="px-4 py-2">{email}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {validEmails.length > 10 && (
//                 <p className="text-xs text-muted-foreground">
//                   Showing 10 of {validEmails.length} emails
//                 </p>
//               )}
//             </div>

//             <DialogFooter>
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => {
//                   setStep("upload");
//                   setEmails([]);
//                 }}
//               >
//                 Back
//               </Button>
//               <Button onClick={handleSubmit} disabled={isLoading}>
//                 {isLoading ? "Importing..." : "Submit"}
//               </Button>
//             </DialogFooter>
//           </>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }

"use client";

import type React from "react";
import { useState } from "react";
import { Upload, Check } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";

const SUBSCRIBER_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "announcements", label: "Announcements" },
  { value: "updates", label: "Updates" },
  { value: "newsletters", label: "Newsletters" },
  { value: "promotions", label: "Promotions" },
];

interface CSVImportModalProps {
  children: React.ReactNode;
  onImportComplete: () => void;
}

export function CSVImportModal({
  children,
  onImportComplete,
}: CSVImportModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [emails, setEmails] = useState<string[]>([]);
  const [category, setCategory] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const trpc = useTRPC();
  const createSubscriber = useMutation(
    trpc.subscribers.create.mutationOptions()
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setUploadProgress(percentComplete);
      }
    };

    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          toast.error("CSV file must contain headers and at least one row");
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        const headerLine = lines[0];
        const headers = headerLine.split(",").map((h) => h.trim());
        const emailColumnIndex = headers.findIndex((h) =>
          h.toLowerCase().includes("email")
        );

        if (emailColumnIndex === -1) {
          toast.error("CSV must contain an 'email' column");
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        const parsedEmails: string[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());
          const email = values[emailColumnIndex]?.trim();
          if (email) {
            parsedEmails.push(email);
          }
        }

        setEmails(parsedEmails);
        setUploadProgress(100);
        setIsUploading(false);
        setStep("review");
        toast.success(`Loaded ${parsedEmails.length} emails from CSV`);
      } catch (error) {
        toast.error("Failed to parse CSV file");
        console.error(error);
        setIsUploading(false);
        setUploadProgress(0);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    const results = {
      successful: [] as string[],
      failed: [] as string[],
    };

    for (const email of emails) {
      try {
        await createSubscriber.mutateAsync({
          email,
          category: category as any,
        });
        results.successful.push(email);
      } catch (error) {
        results.failed.push(email);
      }
    }

    const successCount = results.successful.length;
    const failCount = results.failed.length;

    if (successCount > 0) {
      toast.success(
        `Successfully added ${successCount} subscriber${
          successCount > 1 ? "s" : ""
        }`
      );
    }

    if (failCount > 0) {
      toast.error(
        `Failed to add ${failCount} subscriber${failCount > 1 ? "s" : ""}`
      );
    }

    setEmails([]);
    setCategory("general");
    setStep("upload");
    setOpen(false);
    setIsLoading(false);
    onImportComplete();
  };

  const getStepStatus = (stepName: "upload" | "review") => {
    const steps = ["upload", "review"];
    const currentIndex = steps.indexOf(step);
    const stepIndex = steps.indexOf(stepName);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  const validEmails = emails.filter((email) => email.trim());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                getStepStatus("upload") === "completed"
                  ? "bg-green-500 text-white"
                  : getStepStatus("upload") === "active"
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {getStepStatus("upload") === "completed" ? (
                <Check className="w-4 h-4" />
              ) : (
                "1"
              )}
            </div>
            <span className="text-sm font-medium">Upload</span>
          </div>

          <div className="flex-1 h-0.5 mx-2 bg-muted" />

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                getStepStatus("review") === "active"
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <span className="text-sm font-medium">Review</span>
          </div>
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <>
            <DialogHeader>
              <DialogTitle>Upload CSV File</DialogTitle>
              <DialogDescription>
                Select a CSV file with an email column to import subscribers
              </DialogDescription>
            </DialogHeader>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Drop files here or{" "}
                <label className="text-primary cursor-pointer hover:underline">
                  browse files
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </p>
              <p className="text-xs text-muted-foreground">
                CSV files only. Maximum 10MB.
              </p>

              {isUploading && (
                <div className="mt-6 space-y-2">
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(uploadProgress)}% uploaded
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Review Step */}
        {step === "review" && (
          <>
            <DialogHeader>
              <DialogTitle>Review & Select Category</DialogTitle>
              <DialogDescription>
                Review the emails and assign a category before importing
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Category Selection */}
              <div className="grid gap-2">
                <Label htmlFor="category">Assign Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIBER_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  All imported subscribers will be assigned to this category
                </p>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="bg-muted px-3 py-2 rounded">
                  <div className="font-semibold">All</div>
                  <div className="text-muted-foreground">{emails.length}</div>
                </div>
                <div className="bg-muted px-3 py-2 rounded">
                  <div className="font-semibold">Valid</div>
                  <div className="text-muted-foreground">
                    {validEmails.length}
                  </div>
                </div>
                <div className="bg-muted px-3 py-2 rounded">
                  <div className="font-semibold">Error</div>
                  <div className="text-destructive">
                    {emails.length - validEmails.length}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {validEmails.slice(0, 10).map((email, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {validEmails.length > 10 && (
                <p className="text-xs text-muted-foreground">
                  Showing 10 of {validEmails.length} emails
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setEmails([]);
                  setCategory("general");
                }}
              >
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Importing..." : "Submit"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
