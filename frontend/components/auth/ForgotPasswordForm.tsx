"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, KeyRound, AlertCircle } from "lucide-react";
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

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(`/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send password reset email");
      }

      setSuccess(true);
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
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
            Reset your password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            We'll send you a link to reset your password
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
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

          {success ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg text-green-600 dark:text-green-400 mb-6">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="font-medium text-lg mb-2 text-green-700 dark:text-green-300">
                  Check your email
                </p>
                <p className="text-green-700/80 dark:text-green-400/90">
                  If your email is in our system, you will receive a password
                  reset link shortly. Please check the spam folder if you don't
                  see it in your inbox.
                </p>
              </div>
              <Button
                asChild
                variant="default"
                className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
              >
                <Link href="/auth/signin">Return to Sign In</Link>
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground flex items-center"
                >
                  <Mail className="h-4 w-4 mr-1.5 text-violet-500 dark:text-violet-400" />
                  Email Address
                </label>
                <p className="text-sm text-muted-foreground">
                  Enter the email address associated with your account.
                </p>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
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
