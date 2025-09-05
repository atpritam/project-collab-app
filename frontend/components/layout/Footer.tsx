"use client";

import type React from "react";

import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Mail, ArrowRight, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [srv, setSrv] = useState(false);
  const [locationLoaded, setLocationLoaded] = useState(false);


  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    try {
      const response = await fetch("/api/user/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubscribed(true);
        setEmail("");
        setTimeout(() => {
          setSubscribed(false);
        }, 600);
      }
      setIsSubscribing(false);
    } catch (error) {
      console.error("Subscription error:", error);
      setIsSubscribing(false);
    }
  };

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.country_code === 'IN') {
          setSrv(true);
        }
      } catch (error) {
        console.log('IP geolocation failed, trying browser geolocation');
        
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
                );
                const data = await response.json();
                
                if (data.countryCode === 'IN') {
                  setSrv(true);
                }
              } catch (error) {
                console.log('Reverse geocoding failed');
              } finally {
                setLocationLoaded(true);
              }
            },
            () => {
              setLocationLoaded(true);
            }
          );
        } else {
          setLocationLoaded(true);
        }
      } finally {
        setLocationLoaded(true);
      }
    };

    detectLocation();
  }, []);

  return (
    <footer className="border-t border-border bg-background">
      <div className="container px-4 py-12 md:px-6 md:py-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-6">
          <div className="flex flex-col gap-6 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <motion.div
                className="h-10 w-10 rounded-full bg-violet-600 dark:bg-violet-700 flex items-center justify-center"
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
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-400">
                Nudge
              </span>
            </Link>
            <p className="text-muted-foreground max-w-md">
              Streamline your team's workflow with our intuitive project
              management platform. Create projects, manage tasks, and
              collaborate effectively.
            </p>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Subscribe to our newsletter
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                <Input
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-800 text-white"
                  disabled={isSubscribing || subscribed}
                >
                  {isSubscribing ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>
                  ) : subscribed ? (
                    "Subscribed!"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </form>
            </div>
            <div className="flex gap-4">
              {!srv && locationLoaded && (
                <motion.div
                  whileHover={{ y: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Link
                    href="https://github.com/atpritam"
                    className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors p-2 rounded-full"
                  >
                    <Github className="h-5 w-5" />
                    <span className="sr-only">GitHub</span>
                  </Link>
                </motion.div>
              )}
              {!srv && locationLoaded && (
                <motion.div
                  whileHover={{ y: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Link
                    href="https://www.linkedin.com/in/atpritam/"
                    className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors p-2 rounded-full"
                  >
                    <Linkedin className="h-5 w-5" />
                    <span className="sr-only">LinkedIn</span>
                  </Link>
                </motion.div>
              )}
              <motion.div
                whileHover={{ y: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link
                  href={`${(srv) ? "mailto:nudge@pritam.studio" : "mailto:pritam@student.agh.edu.pl"}`}
                  className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors p-2 rounded-full"
                >
                  <Mail className="h-5 w-5" />
                  <span className="sr-only">Email</span>
                </Link>
              </motion.div>
              {srv && (
                <motion.div
                  whileHover={{ y: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Link
                    href="https://www.instagram.com/itssodope_/"
                    className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors p-2 rounded-full"
                  >
                    <Instagram className="h-5 w-5" />
                    <span className="sr-only">Instagram</span>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-foreground">Product</h3>
            <div className="space-y-3">
              <Link
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center group"
              >
                <span>Features</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center group"
              >
                <span>Pricing</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center group"
              >
                <span>Roadmap</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center group"
              >
                <span>Documentation</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-foreground">Company</h3>
            <div className="space-y-3">
              <Link
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center group"
              >
                <span>About</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center group"
              >
                <span>Blog</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center group"
              >
                <span>Careers</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center group"
              >
                <span>Contact</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-foreground">Legal</h3>
            <div className="space-y-3">
              <Link
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center group"
              >
                <span>Terms of Service</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center group"
              >
                <span>Privacy Policy</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center group"
              >
                <span>Cookie Policy</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center group"
              >
                <span>Data Processing</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nudge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
