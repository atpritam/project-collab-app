"use client";

import type React from "react";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Github,
  ArrowLeft,
  KeyRound,
  AlertCircle,
  Mail,
  Lock,
  UserIcon,
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
import { Separator } from "@/components/ui/separator";
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

function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setRegistrationSuccess(false);

    try {
      const response = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Registration successful, but now we need to verify email before logging in
      setRegistrationSuccess(true);
      setRegisteredEmail(email);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
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
            Create an account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Join our community of collaborators
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

          {registrationSuccess ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-2">
                Check your email
              </div>
              <p className="text-muted-foreground mb-6">
                Verification link sent to{" "}
                <span className="font-medium">{registeredEmail}</span>.{" "}
                <br></br> Click the link to activate your account.
              </p>
              <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg text-sm mb-6">
                <p className="text-violet-700 dark:text-violet-300">
                  <AlertCircle className="inline h-4 w-4 mr-2" />
                  Verify your email before you can sign in.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-foreground flex items-center"
                >
                  <UserIcon className="h-4 w-4 mr-1.5 text-violet-500 dark:text-violet-400" />
                  Full name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground flex items-center"
                >
                  <Mail className="h-4 w-4 mr-1.5 text-violet-500 dark:text-violet-400" />
                  Email address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground flex items-center"
                >
                  <Lock className="h-4 w-4 mr-1.5 text-violet-500 dark:text-violet-400" />
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Simple password strength checker
                    if (e.target.value.length === 0) {
                      setPasswordStrength(0);
                    } else if (e.target.value.length < 8) {
                      setPasswordStrength(1);
                    } else if (
                      e.target.value.match(/[A-Z]/) &&
                      e.target.value.match(/[0-9]/)
                    ) {
                      setPasswordStrength(3);
                    } else if (
                      e.target.value.match(/[A-Z]/) ||
                      e.target.value.match(/[0-9]/)
                    ) {
                      setPasswordStrength(2);
                    } else {
                      setPasswordStrength(1);
                    }
                  }}
                  placeholder="••••••••"
                />
                {password && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex gap-1 h-1.5">
                      <div
                        className={`h-full w-1/3 rounded-l-full ${
                          passwordStrength >= 1
                            ? passwordStrength === 1
                              ? "bg-red-500"
                              : passwordStrength === 2
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      ></div>
                      <div
                        className={`h-full w-1/3 ${
                          passwordStrength >= 2
                            ? passwordStrength === 2
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      ></div>
                      <div
                        className={`h-full w-1/3 rounded-r-full ${
                          passwordStrength >= 3
                            ? "bg-green-500"
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-800 text-white font-medium py-2.5"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>
                    Creating account...
                  </>
                ) : (
                  "Sign up"
                )}
              </Button>
            </form>
          )}

          {!registrationSuccess && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleSocialSignIn("google")}
                  variant="outline"
                  className="w-full border-border bg-background text-foreground hover:bg-muted font-medium"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  onClick={() => handleSocialSignIn("github")}
                  variant="outline"
                  className="w-full border-border bg-background text-foreground hover:bg-muted font-medium"
                >
                  <Github className="h-5 w-5 mr-2" />
                  GitHub
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center pt-0">
          <div className="text-sm text-center">
            <span className="text-muted-foreground"></span>{" "}
            <Button
              asChild
              variant="link"
              className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 p-0"
            >
              <Link
                href="/auth/signin"
                className="flex items-center inline-flex"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Already have an account? Sign in
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// Suspense boundary
export default function SignUp() {
  return (
    <Suspense fallback={<LoadingForm />}>
      <SignUpForm />
    </Suspense>
  );
}
