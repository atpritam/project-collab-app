"use client";

import { SessionProvider } from "next-auth/react";
import { UserSettingsProvider } from "@/components/context/UserSettingsContext";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <UserSettingsProvider>{children}</UserSettingsProvider>
    </SessionProvider>
  );
}
