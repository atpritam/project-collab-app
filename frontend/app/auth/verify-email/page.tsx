import type { Metadata } from "next";
import VerifyEmail from "@/components/auth/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify Email | Nudge",
  description: "Verify your email address for your Nudge account",
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <VerifyEmail />
      </div>
    </div>
  );
}
