"use client";

import type React from "react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { checkPassword } from "@/lib/utils";

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

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";

  useEffect(() => {
    // Validate the token when component mounts
    const validateToken = async () => {
      if (!token) {
        setError("Missing reset token");
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/reset/validate-reset-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok || !data.valid) {
          setError("This password reset link is invalid or has expired");
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } catch (error) {
        console.error("Token validation error:", error);
        setError("Failed to validate reset token");
        setTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  useEffect(() => {
    // Simple password strength checker
    if (password.length === 0) {
      setPasswordStrength(0);
    } else if (password.length < 8) {
      setPasswordStrength(1);
    } else if (password.match(/[A-Z]/) && password.match(/[0-9]/)) {
      setPasswordStrength(3);
    } else if (password.match(/[A-Z]/) || password.match(/[0-9]/)) {
      setPasswordStrength(2);
    } else {
      setPasswordStrength(1);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // check password
    if (!checkPassword(password)) {
      setError(
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
      return;
    }

    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/auth/reset/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess(true);

      // sign in redirect after 3 seconds
      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
      console.error("Password reset error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-green-500";
      default:
        return "bg-gray-200 dark:bg-gray-700";
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
            Create new password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Your new password must be different from previously used passwords
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {isValidating ? (
            <div className="text-center py-8">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-600 dark:border-violet-400"></div>
              </div>
              <p className="mt-4 text-muted-foreground">
                Validating reset token...
              </p>
            </div>
          ) : !tokenValid ? (
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
                {error || "This password reset link is invalid or has expired"}
              </div>
              <Button
                asChild
                variant="default"
                className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
              >
                <Link href="/auth/forgot-password">
                  Request a new password reset link
                </Link>
              </Button>
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
                Password reset successful!
              </div>
              <p className="text-muted-foreground mb-6">
                Your password has been updated. You'll be redirected to the sign
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
          ) : (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400 mb-6 flex items-start"
                >
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground flex items-center"
                  >
                    <ShieldCheck className="h-4 w-4 mr-1.5 text-violet-500 dark:text-violet-400" />
                    New Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  {password && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex gap-1 h-1.5">
                        <div
                          className={`h-full w-1/3 rounded-l-full ${
                            passwordStrength >= 1
                              ? getStrengthColor()
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        ></div>
                        <div
                          className={`h-full w-1/3 ${
                            passwordStrength >= 2
                              ? getStrengthColor()
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        ></div>
                        <div
                          className={`h-full w-1/3 rounded-r-full ${
                            passwordStrength >= 3
                              ? getStrengthColor()
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {passwordStrength === 0 && "Enter a password"}
                        {passwordStrength === 1 && "Weak password"}
                        {passwordStrength === 2 && "Medium password"}
                        {passwordStrength === 3 && "Strong password"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-foreground flex items-center"
                  >
                    <ShieldCheck className="h-4 w-4 mr-1.5 text-violet-500 dark:text-violet-400" />
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-800 text-white font-medium py-2.5"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </>
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
              Sign In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// Suspense boundary
export default function ResetPassword() {
  return (
    <Suspense fallback={<LoadingForm />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
