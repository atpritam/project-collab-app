import type { Metadata } from "next";
import SignUp from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Sign Up | ProjectCollab",
  description: "Create a new ProjectCollab account",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="mt-10">
          <SignUp />
        </div>
      </div>
    </div>
  );
}
