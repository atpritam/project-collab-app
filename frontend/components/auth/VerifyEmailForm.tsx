"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Mail,
  Loader2,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { motion } from "framer-motion";

function LoadingForm() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
        </div>
      </main>
    </div>
  );
}

function VerifyEmailForm() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [emailAlreadyVerified, setEmailAlreadyVerified] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams?.get("code") || "";
  const emailParam = searchParams?.get("email") || "";

  useEffect(() => {
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    if (code && emailParam) {
      verifyEmail(code, decodeURIComponent(emailParam));
    }
  }, [code, emailParam]);

  const verifyEmail = async (verificationCode: string, userEmail: string) => {
    if (!verificationCode || !userEmail) {
      setError("Missing verification code or email");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: verificationCode,
          email: userEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setEmailAlreadyVerified(true);
          return;
        }
        throw new Error(data.message || "Email verification failed");
      }

      setSuccess(true);

      // Redirect to sign in page after 3 seconds
      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please provide your email address");
      return;
    }

    setIsResending(true);
    setError("");
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend verification email");
      }

      setResendSuccess(true);
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-0 shadow-lg dark:shadow-md dark:shadow-violet-900/10">
        <CardHeader className="space-y-1 text-center pb-0">
          <div className="relative w-full">
            <Link
              href="/"
              className="absolute left-0 top-0 inline-flex items-center text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Home</span>
            </Link>
            <div className="h-12 w-12 rounded-full bg-violet-600 dark:bg-violet-700 flex items-center justify-center mx-auto">
              <KeyRound className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Email Verification
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Verify your email address to activate your account
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {isVerifying ? (
            <div className="text-center py-8">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-600 dark:border-violet-400"></div>
              </div>
              <p className="mt-4 text-muted-foreground">
                Verifying your email...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center mb-4"
              >
                <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </motion.div>
              <div className="text-red-600 dark:text-red-400 font-medium mb-6">
                {error}
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    If you need us to send a new verification link, enter your
                    email below:
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 border border-input rounded-md text-sm shadow-sm placeholder-muted-foreground focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <Button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Email"
                  )}
                </Button>

                {resendSuccess && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-green-600 dark:text-green-400 text-sm mt-4">
                    <CheckCircle className="h-5 w-5 inline mr-2" />
                    Verification email sent! Please check your inbox.
                  </div>
                )}
              </div>
            </div>
          ) : success ? (
            <div className="text-center py-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center mb-4"
              >
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </motion.div>
              <div className="text-green-600 dark:text-green-400 font-medium mb-2">
                Email verified successfully!
              </div>
              <p className="text-muted-foreground mb-6">
                Your email has been verified. You'll be redirected to the sign
                in page shortly.
              </p>
              <Button
                asChild
                variant="default"
                className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
              >
                <Link href="/auth/signin">Go to Sign In</Link>
              </Button>
            </div>
          ) : emailAlreadyVerified ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="font-medium text-lg mb-2 text-green-600 dark:text-green-400">
                Email already verified
              </p>
              <p className="text-muted-foreground mb-4">
                Your email address is already verified. You can now sign in to
                your account.
              </p>
              <Button
                asChild
                variant="default"
                className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
              >
                <Link href="/auth/signin">Go to Sign In</Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="bg-violet-50 dark:bg-violet-900/20 p-6 rounded-lg">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-violet-100 dark:bg-violet-800/30 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
                <p className="font-medium text-lg mb-2 text-violet-700 dark:text-violet-300">
                  Check your email
                </p>
                <p className="text-violet-700/80 dark:text-violet-400/90 mb-4">
                  We've sent a verification link to your email address. Please
                  check your inbox and click the link to verify your account.
                </p>
                <div className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      If you didn't receive the email, check your spam folder or
                      enter your email to request a new verification link:
                    </p>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 border border-input rounded-md text-sm shadow-sm placeholder-muted-foreground focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    />
                  </div>

                  <Button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend Verification Email"
                    )}
                  </Button>

                  {resendSuccess && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-green-600 dark:text-green-400 text-sm mt-4">
                      <CheckCircle className="h-5 w-5 inline mr-2" />
                      Verification email sent! Please check your inbox.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center pt-0">
          <Button
            asChild
            variant="link"
            className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <Link href="/auth/signin" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// Suspense boundary
export default function VerifyEmail() {
  return (
    <Suspense fallback={<LoadingForm />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
