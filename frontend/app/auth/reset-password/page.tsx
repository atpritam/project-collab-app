import type { Metadata } from "next";
import ResetPassword from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | ProjectCollab",
  description: "Set a new password for your ProjectCollab account",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <ResetPassword />
      </div>
    </div>
  );
}
