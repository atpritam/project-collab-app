// Create this file at: app/auth/verification-success/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Email Verified | Nudge",
  description: "Your email has been successfully verified",
};

export default function VerificationSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          <Card className="border-0 shadow-lg dark:shadow-md dark:shadow-violet-900/10">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Email Verified Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Your email has been verified and your account is now active. You
                can now sign in to your account.
              </p>
              <Button
                asChild
                className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-800 text-white w-full"
              >
                <Link
                  href="/auth/signin"
                  className="flex items-center justify-center"
                >
                  Sign In to Your Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Need help? Contact our support team
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
