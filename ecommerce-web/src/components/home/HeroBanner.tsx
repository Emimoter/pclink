"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useBanners, type Banner } from "@/hooks/useBanners";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  const displayBanners = activeBanners.length > 0 ? activeBanners : FALLBACK_BANNERS;

  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % displayBanners.length);
    }, 6000);

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
      <div className="relative w-full z-20 bg-surface/40 border border-border/80 flex items-center justify-center aspect-[32/9] rounded-[1.5rem] md:rounded-[2rem] animate-pulse">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-transparent rounded-full animate-spin" />
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
    <div className="relative w-full z-20 group overflow-hidden aspect-[32/9] rounded-[1.5rem] md:rounded-[2rem]">
      
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
          <Link href={targetLink} className="block relative w-full h-full cursor-pointer select-none bg-black flex items-center justify-center">
            {currentBanner.imageUrl ? (
              <img
                src={currentBanner.imageUrl}
                alt={`Banner Slide ${index + 1}`}
                className="w-full h-full object-contain"
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

      {/* Navigation Arrows (Visible only if more than 1 banner, hidden on mobile/shown on hover) */}
      {displayBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/95 backdrop-blur-sm text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-slate-100/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white hover:scale-105 active:scale-95 cursor-pointer hidden md:flex"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/95 backdrop-blur-sm text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-slate-100/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white hover:scale-105 active:scale-95 cursor-pointer hidden md:flex"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Pagination Dots (Bottom Center) */}
      {displayBanners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2.5 bg-black/20 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/5">
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
  );
}
