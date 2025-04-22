"use client";

import type React from "react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "sonner";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import { Loader2 } from "lucide-react";
import { UnifiedBreadcrumb } from "@/components/workspace/UnifiedBreadcrumb";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

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
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden bg-background w-full">
          <WorkspaceSidebar />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto py-2 px-4 md:px-6 lg:px-8">
              <UnifiedBreadcrumb />

              <div className="pt-2">{children}</div>

              <footer>
                <div className="mt-12 pt-6">
                  <p className="text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Nudge. All rights reserved.
                  </p>
                </div>
              </footer>
            </div>
          </main>
        </div>
        <Toaster position="top-right" />
      </SidebarProvider>
    </ThemeProvider>
  );
}
