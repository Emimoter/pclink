"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Search, ShoppingCart, User, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";

function NavbarSearch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchVal, setSearchVal] = useState(searchParams.get("search") || "");

  useEffect(() => {
    setSearchVal(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (value: string) => {
    setSearchVal(value);
    const isStore = pathname === "/" || pathname === "/products";
    const targetPath = isStore ? pathname : "/";
    const params = new URLSearchParams(window.location.search);
    
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    if (!isStore) {
      router.push(`/?search=${encodeURIComponent(value)}`);
    } else {
      router.replace(`${targetPath}?${params.toString()}`);
    }
  };

  return (
    <div className="relative flex-1 max-w-[700px] min-w-[130px] ml-4 md:ml-12 lg:ml-20">
      <input
        type="text"
        placeholder="Buscar productos..."
        value={searchVal}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full h-12 md:h-[50px] bg-background border border-border rounded-full pl-12 pr-4 text-sm md:text-base focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-bold shadow-sm placeholder:text-muted/60"
      />
      <Search className="w-5 h-5 md:w-[22px] md:h-[22px] text-muted absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.totalItems);
  const setIsOpen = useCartStore((state) => state.setIsOpen);

  const navLinks = [
    { href: "/", label: "Tienda" },
    { href: "/pcclub", label: "PClink Club" },
    { href: "/about", label: "Sobre nosotros" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        "glass border-b border-border shadow-sm"
      )}
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Left Side: Logo & Search */}
        <div className="flex items-center gap-6 flex-1 max-w-[900px] min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button className="md:hidden p-2 text-muted hover:text-primary">
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-circle.png"
                alt="PC Link Logo"
                width={48}
                height={48}
                className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                priority
              />
            </Link>
          </div>

          <Suspense fallback={<div className="flex-1 max-w-[700px] h-12 md:h-[50px] bg-surface border border-border rounded-full animate-pulse ml-4 md:ml-12 lg:ml-20" />}>
            <NavbarSearch />
          </Suspense>
        </div>

        {/* Right Side: Desktop Nav & Actions */}
        <div className="flex items-center gap-4 sm:gap-6 ml-auto shrink-0">
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-muted relative">
            {navLinks.map((link) => {
              const isActive = link.href === "/"
                ? pathname === "/" || pathname.startsWith("/products")
                : pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative py-1 transition-colors duration-300 font-sans tracking-wide",
                    isActive
                      ? "text-accent font-bold"
                      : "text-muted hover:text-primary"
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute -bottom-1.5 inset-x-0 h-[2.5px] bg-accent rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 text-muted">
            <Link href="/profile" className="p-2 hover:text-primary transition-colors">
              <User className="w-5 h-5" />
            </Link>
            <button 
              onClick={() => setIsOpen(true)}
              className="p-2 hover:text-primary transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
