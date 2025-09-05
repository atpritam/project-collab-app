"use client";

import React, { useRef, useEffect, Suspense } from "react";
import { useInView } from "framer-motion";
import { useSearchParams } from "next/navigation";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import Testimonials from "@/components/home/Testimonials";
import CTA from "@/components/home/CTA";
import Pricing from "@/components/home/Pricing";
import { Loader2 } from "lucide-react";

function SearchParamsHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const hash =
      searchParams.get("section") || window.location.hash.replace("#", "");
    if (hash) {
      const element = document.getElementById(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [searchParams]);

  return null;
}

function SearchParamsLoading() {
  return (
    <div className="flex items-center justify-center py-4">
      <Loader2 className="h-4 w-4 animate-spin text-violet-700" />
    </div>
  );
}

function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const pricingInView = useInView(pricingRef, { once: true, amount: 0.2 });
  const testimonialsInView = useInView(testimonialsRef, {
    once: true,
    amount: 0.2,
  });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.2 });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <Suspense fallback={<SearchParamsLoading />}>
        <SearchParamsHandler />
      </Suspense>

      <main className="flex-grow">
        {/* Hero Section */}
        <div id="hero">
          <Hero ref={heroRef} heroInView={heroInView} />
        </div>

        {/* Features Section */}
        <div id="features">
          <Features ref={featuresRef} featuresInView={featuresInView} />
        </div>

        {/* Pricing Section */}
        <div id="pricing">
          <Pricing ref={pricingRef} pricingInView={pricingInView} />
        </div>

        {/* Testimonials Section */}
        <div id="testimonials">
          <Testimonials
            ref={testimonialsRef}
            testimonialsInView={testimonialsInView}
          />
        </div>

        {/* CTA Section */}
        <div id="cta">
          <CTA ref={ctaRef} ctaInView={ctaInView} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function HomePage() {
  return <Home />;
}
