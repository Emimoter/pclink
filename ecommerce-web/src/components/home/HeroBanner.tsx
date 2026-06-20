"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useBanners, type Banner } from "@/hooks/useBanners";
import { ChevronLeft, ChevronRight, Truck, Gift, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const FALLBACK_BANNERS: Banner[] = [
  {
    id: "welcome",
    title: "",
    subtitle: "",
    ctaLabel: "",
    imageUrl: "/images/welcome_banner.png",
    targetCategory: undefined,
    targetProductId: undefined,
    targetPath: undefined,
    active: true,
    order: 0,
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring" as const, stiffness: 300, damping: 30 },
      opacity: { duration: 0.3 },
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    transition: {
      x: { type: "spring" as const, stiffness: 300, damping: 30 },
      opacity: { duration: 0.3 },
    },
  }),
};

export default function HeroBanner() {
  const { banners, loading } = useBanners();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const activeBanners = banners.length > 0 
    ? banners.filter(b => b.active)
    : FALLBACK_BANNERS;

  // Fallback to FALLBACK_BANNERS if all are inactive
  const displayBanners = activeBanners.length > 0 ? activeBanners : FALLBACK_BANNERS;

  // Auto-play effect
  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % displayBanners.length);
    }, 6000); // Rotate every 6 seconds

    return () => clearInterval(timer);
  }, [displayBanners.length, index]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDirection(1);
    setIndex((prev) => (prev + 1) % displayBanners.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDirection(-1);
    setIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);
  };

  if (loading) {
    return (
      <div className="relative w-full max-w-7xl mx-auto z-20 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
        {/* Left Column Skeleton */}
        <div className="w-full lg:col-span-9 aspect-[2/1] rounded-[1.5rem] md:rounded-[2rem] bg-surface/40 border border-border/80 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-transparent rounded-full animate-spin" />
        </div>
        {/* Right Column Skeletons */}
        <div className="hidden lg:grid lg:col-span-3 grid-rows-2 gap-6">
          <div className="rounded-[1.5rem] bg-surface/40 border border-border/80" />
          <div className="rounded-[1.5rem] bg-surface/40 border border-border/80" />
        </div>
      </div>
    );
  }

  const currentBanner = displayBanners[index];

  let targetLink = "/products";
  if (currentBanner.targetPath) {
    targetLink = currentBanner.targetPath;
  } else if (currentBanner.targetCategory) {
    targetLink = `/products?category=${currentBanner.targetCategory.toLowerCase()}`;
  } else if (currentBanner.targetProductId) {
    targetLink = `/products/${currentBanner.targetProductId}`;
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto z-20 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      
      {/* Slider Container */}
      <div className="relative w-full lg:col-span-9 aspect-[2/1] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group">
        
        {/* Banner Content Slider */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            <Link href={targetLink} className="block relative w-full h-full cursor-pointer select-none">
              {currentBanner.imageUrl ? (
                <img
                  src={currentBanner.imageUrl}
                  alt={`Banner Slide ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-[8000ms] ease-out scale-100 hover:scale-[1.035]"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent/20 via-surface to-background flex items-center justify-center">
                  <span className="text-muted font-bold text-sm tracking-widest uppercase">PClink Computación</span>
                </div>
              )}
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows (Visible only if more than 1 banner) */}
        {displayBanners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/60 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/60 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </>
        )}

        {/* Pagination Dots (Bottom Center) */}
        {displayBanners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2.5 bg-black/20 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/5">
            {displayBanners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300 cursor-pointer",
                  i === index 
                    ? "bg-accent w-5" 
                    : "bg-white/40 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Promo Cards Column */}
      <div className="hidden lg:grid lg:col-span-3 grid-rows-2 gap-6">
        
        {/* Card 1: Garantía */}
        <Link 
          href="/about" 
          className="group relative overflow-hidden rounded-[1.5rem] border border-slate-800/80 transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.12)] cursor-pointer select-none"
        >
          <div className="absolute inset-0">
            <img 
              src="/images/warranty_banner.png" 
              alt="Garantía PC Link" 
              className="w-full h-full object-cover object-left transition-transform duration-500 group-hover:scale-[1.025]"
              draggable={false}
            />
          </div>
        </Link>
 
        {/* Card 2: Asesoramiento */}
        <a 
          href="https://wa.me/5492235468972" 
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden rounded-[1.5rem] border border-slate-800/80 transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.12)] cursor-pointer select-none"
        >
          <div className="absolute inset-0">
            <img 
              src="/images/advice_banner.png" 
              alt="Asesoramiento Gratuito PC Link" 
              className="w-full h-full object-cover object-left transition-transform duration-500 group-hover:scale-[1.025]"
              draggable={false}
            />
          </div>
        </a>

      </div>
    </div>
  );
}
