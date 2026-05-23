"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ShoppingCart, User, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";

export default function Navbar() {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.totalItems);
  const setIsOpen = useCartStore((state) => state.setIsOpen);

  const navLinks = [
    { href: "/products", label: "Tienda" },
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
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <button className="md:hidden p-2 text-muted hover:text-primary">
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-text-v2.png"
              alt="PC Link Logo"
              width={150}
              height={48}
              className="h-7 md:h-8 w-auto object-contain transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted relative">
          {navLinks.map((link) => {
            const isActive = link.href === "/products"
              ? pathname.startsWith("/products")
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

        {/* Actions */}
        <div className="flex items-center gap-4 text-muted">
          <Link href="/products" className="p-2 hover:text-primary transition-colors hidden sm:block">
            <Search className="w-5 h-5" />
          </Link>
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
    </header>
  );
}
