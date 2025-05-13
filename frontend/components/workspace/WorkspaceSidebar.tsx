"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Users,
  Settings,
  LogOut,
  MessageSquare,
  PlusCircle,
  User,
  Zap,
  Menu,
  ChevronRight,
  FolderIcon,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function WorkspaceSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [userData, setUserData] = useState<any>(null);
  const { state, toggleSidebar } = useSidebar();

  useEffect(() => {
    if (session?.user?.id) {
      const fetchUserProfile = async () => {
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      };

      fetchUserProfile();
    }
  }, [session?.user?.id]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const isLinkActive = (path: string | string[]) => {
    if (Array.isArray(path)) {
      return path.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const userName = userData?.name || session?.user?.name || "";
  const userEmail = userData?.email || session?.user?.email || "";
  const userImage = userData?.image || session?.user?.image || "";

  // Shared navigation links
  const navigationLinks = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "Dashboard",
      isActive: isLinkActive("/dashboard"),
    },
    {
      href: "/projects",
      icon: <FolderIcon className="h-4 w-4" />,
      label: "Projects",
      isActive: isLinkActive(["/projects", "/projects/create"]),
    },
    {
      href: "/tasks",
      icon: <CheckSquare className="h-4 w-4" />,
      label: "Tasks",
      isActive: isLinkActive(["/tasks", "/tasks/create"]),
    },
    {
      href: "/calendar",
      icon: <Calendar className="h-4 w-4" />,
      label: "Calendar",
      isActive: isLinkActive("/calendar"),
    },
    {
      href: "/messages",
      icon: <MessageSquare className="h-4 w-4" />,
      label: "Messages",
      isActive: isLinkActive("/messages"),
    },
    {
      href: "/team",
      icon: <Users className="h-4 w-4" />,
      label: "Team",
      isActive: isLinkActive("/team"),
    },
  ];

  // Mobile sidebar
  const MobileSidebar = () => (
    <div className="md:hidden fixed top-0 left-0 z-40 h-14 w-full bg-background border-b border-border/40 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r">
            <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
            <div className="flex flex-col h-full">
              <div className="border-b border-border/40 p-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-violet-700 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-purple-600">
                    Nudge
                  </span>
                </Link>
              </div>

              <div className="flex-1 overflow-auto py-4">
                <div className="space-y-1 px-3">
                  {navigationLinks.map((link) => (
                    <Button
                      key={link.href}
                      variant={
                        pathname === link.href ||
                        pathname?.startsWith(`${link.href}/`)
                          ? "default"
                          : "ghost"
                      }
                      className={`w-full justify-start ${
                        pathname === link.href ||
                        pathname?.startsWith(`${link.href}/`)
                          ? "bg-violet-700 hover:bg-violet-800 text-white"
                          : ""
                      }`}
                      asChild
                    >
                      <Link href={link.href}>
                        {link.icon}
                        <span className="ml-2">{link.label}</span>
                      </Link>
                    </Button>
                  ))}
                </div>

                <div className="mt-6 px-3">
                  <div className="flex justify-between items-center text-sm font-medium text-muted-foreground px-4 py-2">
                    <span>Quick Links</span>
                  </div>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start mt-1"
                      asChild
                    >
                      <Link href="/projects/create">
                        <ChevronRight className="h-4 w-4 mr-1" />
                        <span>Create Project</span>
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start mt-1"
                      asChild
                    >
                      <Link href="/tasks/create">
                        <ChevronRight className="h-4 w-4 mr-1" />
                        <span>Create Task</span>
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start mt-1"
                      asChild
                    >
                      <Link href="/calendar?tab=deadlines">
                        <ChevronRight className="h-4 w-4 mr-1" />
                        <span>Deadlines</span>
                      </Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>

              <div className="border-t border-border/40 p-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 p-2 w-full justify-start"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={userImage}
                          alt={userName}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-700 text-white text-xs">
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-sm">
                        <span className="font-medium">
                          {userName.split(" ")[0]}
                        </span>
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {userEmail}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <SheetClose asChild>
                        <Link href="/profile" className="cursor-pointer w-full">
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                      </SheetClose>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <SheetClose asChild>
                        <Link
                          href="/settings"
                          className="cursor-pointer w-full"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                      </SheetClose>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <ThemeToggle />
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <SheetClose asChild>
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex w-full items-center text-red-600 focus:text-red-600 cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign out
                        </button>
                      </SheetClose>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-violet-700 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-purple-600">
            Nudge
          </span>
        </Link>
      </div>

      <div className="flex items-center">
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage
            src={userImage}
            alt={userName}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-700 text-white text-xs">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );

  // Desktop sidebar
  const DesktopSidebar = () => (
    <Sidebar className="hidden md:flex" collapsible="icon">
      <SidebarHeader
        className={`border-b border-border/40 p-4 flex items-center justify-between ${
          state == "expanded" ? "flex-row" : "flex-col"
        }`}
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-violet-700 flex items-center justify-center group-data-[collapsible=icon]:mx-auto">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-purple-600 transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden">
            Nudge
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full hidden md:flex cursor-pointer"
          onClick={toggleSidebar}
        >
          {state === "expanded" ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationLinks.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={link.isActive}
                          tooltip={link.label}
                        >
                          <Link href={link.href}>
                            {link.icon}
                            <span>{link.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {state === "collapsed" && (
                        <TooltipContent
                          side="right"
                          className="group-data-[state=expanded]:hidden"
                        >
                          {link.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex justify-between items-center">
            <span>Quick Actions</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isLinkActive("/projects")}
                  tooltip="Create Project"
                >
                  <Link href="/projects/create">
                    <ChevronRight className="h-4 w-4" />
                    <span>Create Project</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isLinkActive("/tasks")}
                  tooltip="Create Task"
                >
                  <Link href="/tasks/create">
                    <ChevronRight className="h-4 w-4" />
                    <span>Create Task</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isLinkActive("/calendar")}
                  tooltip="Deadlines"
                >
                  <Link href="/calendar?tab=deadlines">
                    <ChevronRight className="h-4 w-4" />
                    <span>Deadlines</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        <div
          className={`flex items-center justify-between ${
            state === "collapsed" ? "flex-col" : ""
          }`}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`flex items-center gap-2 p-2 w-full cursor-pointer ${
                  state === "collapsed" ? "justify-center" : "justify-start"
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={userImage}
                    alt={userName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-700 text-white text-xs">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`flex flex-col items-start text-sm ${
                    state === "collapsed" ? "hidden" : ""
                  }`}
                >
                  <span className="font-medium">{userName.split(" ")[0]}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {userEmail}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="p-2">
                <ThemeToggle />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );

  return (
    <>
      <MobileSidebar />
      <DesktopSidebar />
    </>
  );
}
