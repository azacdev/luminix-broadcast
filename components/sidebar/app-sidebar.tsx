"use client";

import Link from "next/link";
import * as React from "react";
import Image from "next/image";
import { IconUsers, IconSend } from "@tabler/icons-react";

import { NavMain } from "@/components/sidebar/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Subscribers",
      url: "/subscribers",
      icon: IconUsers,
    },
    {
      title: "Broadcasts",
      url: "/broadcasts",
      icon: IconSend,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.jpg"
                alt="Luminix Studio"
                width={32}
                height={32}
                className="rounded-md"
              />
              <span className="text-base font-semibold">
                Luminix Newsletter
              </span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  );
}
