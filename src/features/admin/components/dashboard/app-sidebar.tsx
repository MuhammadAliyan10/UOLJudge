"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Users,
  FileStack,
  Settings,
  LogOut,
  Shield,
  ChevronUp,
  User2,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/features/shared/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/features/shared/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/features/shared/ui/alert-dialog";
import { logoutAction } from "@/server/actions/auth/auth";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Contests", href: "/admin/contests", icon: Trophy },
  { name: "Teams", href: "/admin/teams", icon: Users },
  { name: "Jury", href: "/admin/users/jury", icon: Shield },
  { name: "Logs", href: "/admin/logs", icon: FileStack },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [openLogout, setOpenLogout] = useState(false);
  const { setOpenMobile } = useSidebar();

  const handleLogout = async () => {
    await logoutAction();
    // Force full browser refresh to clear Client Router Cache
    window.location.href = "/login";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image src={"/Logo.png"} alt="Logo" width={24} height={24} />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">UOLJudge</span>
                  <span className="text-xs text-muted-foreground">
                    Admin Panel
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      onClick={() => setOpenMobile(false)}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <User2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Admin</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Administrator
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <AlertDialog open={openLogout} onOpenChange={setOpenLogout}>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sign out?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to sign out of the admin console?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLogout}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sign Out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
