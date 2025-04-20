"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, User, LogOut, ChevronDown, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import UserAuthStatus from "@/components/auth/UserAuthStatus";

export default function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch user profile data when authenticated
  useEffect(() => {
    if (isAuthenticated && session?.user?.id) {
      const fetchUserProfile = async () => {
        setIsLoading(true);
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserProfile();
    }
  }, [isAuthenticated, session?.user?.id]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // user data
  const userName = userData?.name || "";
  const userEmail = userData?.email || "";
  const userImage = userData?.image || "";

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm"
          : "bg-background"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <motion.div
                className="h-10 w-10 rounded-full bg-violet-700 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </motion.div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-purple-600">
                Nudge
              </span>
            </Link>
            <nav className="hidden sm:ml-8 sm:flex sm:space-x-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 text-foreground/70 hover:text-violet-900"
                  >
                    Features
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/features/project-management"
                      className="flex items-center gap-2"
                    >
                      <div className="h-8 w-8 rounded-md bg-violet-100 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-violet-700" />
                      </div>
                      <div>
                        <p className="font-medium">Project Management</p>
                        <p className="text-xs text-muted-foreground">
                          Organize your work
                        </p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/features/collaboration"
                      className="flex items-center gap-2"
                    >
                      <div className="h-8 w-8 rounded-md bg-violet-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-violet-700" />
                      </div>
                      <div>
                        <p className="font-medium">Team Collaboration</p>
                        <p className="text-xs text-muted-foreground">
                          Work together seamlessly
                        </p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                asChild
                className="text-foreground/70 hover:text-violet-900"
              >
                <Link href="/pricing">Pricing</Link>
              </Button>

              <Button
                variant="ghost"
                asChild
                className="text-foreground/70 hover:text-violet-900"
              >
                <Link href="/testimonials">Testimonials</Link>
              </Button>

              <Button
                variant="ghost"
                asChild
                className="text-foreground/70 hover:text-violet-900"
              >
                <Link href="/faq">FAQ</Link>
              </Button>

              {isAuthenticated && (
                <Button
                  variant="ghost"
                  asChild
                  className="text-foreground/70 hover:text-violet-900"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )}
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Theme Toggle */}
            <ThemeToggle />

            {status === "loading" || isLoading ? (
              <div className="h-10 w-24 bg-muted animate-pulse rounded-md ml-4"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4 ml-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="rounded-full h-10 w-10 p-0 overflow-hidden"
                    >
                      <Avatar className="h-10 w-10 border border-violet-100">
                        <AvatarImage
                          src={userImage}
                          alt={userName}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-700 text-white text-sm">
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="pb-2">
                      <UserAuthStatus />
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <Zap className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-4 ml-4">
                <Button
                  asChild
                  variant="ghost"
                  className="text-foreground/70 hover:text-violet-900"
                >
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="bg-violet-700 hover:bg-violet-900 text-white"
                >
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500 ml-2"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="sm:hidden bg-background"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="pt-2 pb-3 space-y-1 px-4">
              <Link
                href="/features"
                className="block py-2 px-3 text-base font-medium text-foreground/70 hover:bg-violet-50 hover:text-violet-900 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="block py-2 px-3 text-base font-medium text-foreground/70 hover:bg-violet-50 hover:text-violet-900 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/testimonials"
                className="block py-2 px-3 text-base font-medium text-foreground/70 hover:bg-violet-50 hover:text-violet-900 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </Link>
              <Link
                href="/faq"
                className="block py-2 px-3 text-base font-medium text-foreground/70 hover:bg-violet-50 hover:text-violet-900 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              {isAuthenticated && (
                <Link
                  href="/dashboard"
                  className="block py-2 px-3 text-base font-medium text-foreground/70 hover:bg-violet-50 hover:text-violet-900 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
            </div>
            <div className="pt-4 pb-3 border-t border-muted">
              {status === "loading" || isLoading ? (
                <div className="px-4">
                  <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
                </div>
              ) : isAuthenticated ? (
                <UserAuthStatus
                  mobile={true}
                  onAction={() => setMobileMenuOpen(false)}
                />
              ) : (
                <div className="mt-3 space-y-1 px-2">
                  <Link
                    href="/auth/signin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:bg-violet-50 hover:text-violet-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:bg-violet-50 hover:text-violet-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
