"use client";

import React, { useRef } from "react";
import { useInView } from "framer-motion";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import Testimonials from "@/components/home/Testimonials";
import CTA from "@/components/home/CTA";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const testimonialsInView = useInView(testimonialsRef, {
    once: true,
    amount: 0.2,
  });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.2 });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <Hero ref={heroRef} heroInView={heroInView} />

        {/* Features Section */}
        <Features ref={featuresRef} featuresInView={featuresInView} />

        {/* Testimonials Section */}
        <Testimonials
          ref={testimonialsRef}
          testimonialsInView={testimonialsInView}
        />

        {/* CTA Section */}
        <CTA ref={ctaRef} ctaInView={ctaInView} />
      </main>

      <Footer />
    </div>
  );
}
