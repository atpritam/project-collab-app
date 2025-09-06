"use client";

import type React from "react";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import { Loader2 } from "lucide-react";
import { UnifiedBreadcrumb } from "@/components/workspace/UnifiedBreadcrumb";
import { useIsMobile } from "@/hooks/use-mobile";
import { SubscriptionProvider } from "@/components/context/SubscriptionContext";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Redirect unauthenticated users to sign-in page
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SubscriptionProvider>
        <SidebarProvider>
          <div className="flex h-screen overflow-hidden bg-background w-full">
            <WorkspaceSidebar />
            <main
              className={`flex-1 overflow-auto ${
                pathname === "/messages" ? "overflow-hidden" : "overflow-auto"
              } md:pt-0 pt-14
               ${isMobile ? "px-0" : "px-8 lg:px-12"}`}
            >
              <div className="mx-auto py-2 px-4 md:px-6 lg:px-8">
                <UnifiedBreadcrumb />

                <div className="pt-4">{children}</div>
                {pathname !== "/messages" && (
                  <footer>
                    <div className="py-4">
                      <p className="text-center text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Nudge. All rights reserved.
                      </p>
                    </div>
                  </footer>
                )}
              </div>
            </main>
          </div>
        </SidebarProvider>
      </SubscriptionProvider>
    </ThemeProvider>
  );
}
