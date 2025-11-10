// "use client";

// import type React from "react";
// import { useState } from "react";

// import { toast } from "sonner";
// import { useTRPC } from "@/trpc/client";
// import { useMutation } from "@tanstack/react-query";
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
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// interface AddSubscriberModalProps {
//   children: React.ReactNode;
//   onSubscriberAdded: () => void;
// }

// export function AddSubscriberModal({
//   children,
//   onSubscriberAdded,
// }: AddSubscriberModalProps) {
//   const [open, setOpen] = useState(false);
//   const [email, setEmail] = useState("");
//   const trpc = useTRPC();

//   const createSubscriber = useMutation(
//     trpc.subscribers.create.mutationOptions({
//       onSuccess: () => {
//         toast.success("Subscriber added successfully!");
//         setEmail("");
//         setOpen(false);
//         onSubscriberAdded();
//       },
//       onError: (error) => {
//         if (error.message.includes("already subscribed")) {
//           toast.error("This email is already subscribed");
//         } else {
//           toast.error(error.message || "Failed to add subscriber");
//         }
//       },
//     })
//   );

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!email.trim()) {
//       toast.error("Please enter an email address");
//       return;
//     }

//     createSubscriber.mutate({ email: email.trim() });
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>{children}</DialogTrigger>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle>Add New Subscriber</DialogTitle>
//           <DialogDescription>
//             Add a new email address to your newsletter subscriber list.
//           </DialogDescription>
//         </DialogHeader>
//         <form onSubmit={handleSubmit}>
//           <div className="grid gap-4 py-4">
//             <div className="grid gap-2">
//               <Label htmlFor="email">Email Address</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="subscriber@example.com"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => setOpen(false)}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" disabled={createSubscriber.isPending}>
//               {createSubscriber.isPending ? "Adding..." : "Add Subscriber"}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

"use client";

import type React from "react";
import { useState } from "react";

import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SUBSCRIBER_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "announcements", label: "Announcements" },
  { value: "updates", label: "Updates" },
  { value: "newsletters", label: "Newsletters" },
  { value: "promotions", label: "Promotions" },
];

interface AddSubscriberModalProps {
  children: React.ReactNode;
  onSubscriberAdded: () => void;
}

export function AddSubscriberModal({
  children,
  onSubscriberAdded,
}: AddSubscriberModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("general");
  const trpc = useTRPC();

  const createSubscriber = useMutation(
    trpc.subscribers.create.mutationOptions({
      onSuccess: () => {
        toast.success("Subscriber added successfully!");
        setEmail("");
        setCategory("general");
        setOpen(false);
        onSubscriberAdded();
      },
      onError: (error) => {
        if (error.message.includes("already subscribed")) {
          toast.error("This email is already subscribed");
        } else {
          toast.error(error.message || "Failed to add subscriber");
        }
      },
    })
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    createSubscriber.mutate({
      email: email.trim(),
      category: category as any,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Subscriber</DialogTitle>
          <DialogDescription>
            Add a new email address to your newsletter subscriber list and
            assign a category.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="subscriber@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
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
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSubscriber.isPending}>
              {createSubscriber.isPending ? "Adding..." : "Add Subscriber"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
