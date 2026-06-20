"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, User, Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useProducts } from "@/hooks/useProducts";
import { getRelevanceScore } from "@/lib/search";
import { CATEGORIES } from "@/lib/categories";

function NavbarSearch({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchVal, setSearchVal] = useState(searchParams.get("search") || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { products } = useProducts();

  useEffect(() => {
    setSearchVal(searchParams.get("search") || "");
  }, [searchParams]);

  // Filter category suggestions client-side
  const categorySuggestions = searchVal.trim().length >= 2
    ? CATEGORIES.filter((c) => {
        const query = searchVal.toLowerCase();
        return (
          c.name.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query)
        );
      }).slice(0, 3)
    : [];

  // Filter product suggestions client-side
  const productSuggestions = searchVal.trim().length >= 2
    ? products
        .map((p) => ({ product: p, score: getRelevanceScore(p, searchVal) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.product)
        .slice(0, 5)
    : [];

  const hasSuggestions = categorySuggestions.length > 0 || productSuggestions.length > 0;

  const handleCategoryClick = (catId: string) => {
    const isStore = pathname === "/" || pathname === "/products";
    const targetPath = isStore ? pathname : "/products";
    
    // Set category, clear search
    const params = new URLSearchParams();
    params.set("category", catId);

    const newUrl = `${targetPath}?${params.toString()}`;
    
    if (!isStore) {
      router.push(newUrl);
    } else {
      router.replace(newUrl);
    }

    setSearchVal("");
    setShowSuggestions(false);

    // Smooth scroll to products catalog
    setTimeout(() => {
      const element = document.getElementById("products-catalog");
      if (element) {
        const yOffset = -100;
        const yPosition = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: yPosition, behavior: "smooth" });
      }
    }, 200);
  };

  const handleSearchSubmit = (value: string) => {
    const isStore = pathname === "/" || pathname === "/products";
    const targetPath = isStore ? pathname : "/";
    const params = new URLSearchParams(window.location.search);
    
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }

    const newUrl = `${targetPath}?${params.toString()}`;
    
    if (!isStore) {
      router.push(`/?search=${encodeURIComponent(value.trim())}`);
    } else {
      router.replace(newUrl);
    }

    setShowSuggestions(false);

    // Scroll to products catalog smoothly
    setTimeout(() => {
      const element = document.getElementById("products-catalog");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 200);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchSubmit(searchVal);
  };

  return (
    <form 
      onSubmit={onSubmit}
      className={cn("relative flex-1", className)}
    >
      <input
        type="text"
        placeholder="Buscar productos..."
        value={searchVal}
        onChange={(e) => {
          setSearchVal(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
        className="w-full h-12 md:h-[50px] bg-background border border-border rounded-full pl-12 pr-4 text-base focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-bold shadow-sm placeholder:text-muted/60"
      />
      <button 
        type="submit" 
        className="absolute left-4 top-1/2 -translate-y-1/2 hover:text-accent transition-colors focus:outline-none"
      >
        <Search className="w-5 h-5 md:w-[22px] md:h-[22px] text-muted hover:text-accent transition-colors" />
      </button>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && hasSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col divide-y divide-border"
          >
            {/* Category Suggestions */}
            {categorySuggestions.length > 0 && (
              <div className="flex flex-col p-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted px-3 py-1 font-sans text-left">
                  Categorías
                </p>
                {categorySuggestions.map((cat) => {
                  const IconComponent = cat.icon;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-surface cursor-pointer rounded-xl transition-colors text-left"
                    >
                      <div className="w-8 h-8 bg-accent/10 flex items-center justify-center rounded-lg text-accent shrink-0">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-bold text-primary truncate">
                          {cat.name}
                        </p>
                        <p className="text-[9px] text-muted font-bold uppercase tracking-wider font-mono">
                          Ver categoría
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted/60" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Product Suggestions */}
            {productSuggestions.length > 0 && (
              <div className="flex flex-col p-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted px-3 py-1 font-sans text-left">
                  Productos
                </p>
                {productSuggestions.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      router.push(`/products/${product.id}`);
                      setSearchVal("");
                      setShowSuggestions(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-surface cursor-pointer rounded-xl transition-colors text-left"
                  >
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-8 h-8 object-contain rounded-lg bg-surface shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-surface flex items-center justify-center rounded-lg shrink-0">
                        <Search className="w-4 h-4 text-muted" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-bold text-primary truncate">
                        {product.name}
                      </p>
                      <p className="text-[9px] text-accent font-bold uppercase tracking-wider font-mono">
                        {product.category?.replace(/-/g, ' ')}
                      </p>
                    </div>
                    <div className="text-xs md:text-sm font-black text-primary shrink-0 font-mono">
                      {typeof product.price === "number" && product.price > 0 
                        ? `$${product.price.toLocaleString("es-AR")}` 
                        : "Consultar"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.totalItems);
  const setIsOpen = useCartStore((state) => state.setIsOpen);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on page transition
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden p-2 text-muted hover:text-primary transition-colors focus:outline-none"
              aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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

          <Suspense fallback={<div className="hidden md:block flex-1 max-w-[700px] h-12 md:h-[50px] bg-surface border border-border rounded-full animate-pulse ml-4 md:ml-12 lg:ml-20" />}>
            <NavbarSearch className="hidden md:flex max-w-[700px] ml-4 md:ml-12 lg:ml-20" />
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

      {/* Mobile Search Row (visible only on mobile) */}
      <div className="md:hidden px-4 pb-4 pt-1 border-t border-border/10">
        <Suspense fallback={<div className="w-full h-12 bg-surface border border-border rounded-full animate-pulse" />}>
          <NavbarSearch className="flex w-full" />
        </Suspense>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="md:hidden border-b border-border bg-background/95 backdrop-blur-md absolute top-full left-0 right-0 overflow-hidden z-40 shadow-lg"
          >
            <nav className="flex flex-col p-6 gap-3">
              {navLinks.map((link) => {
                const isActive = link.href === "/"
                  ? pathname === "/" || pathname.startsWith("/products")
                  : pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "py-3 px-5 rounded-2xl text-sm font-bold transition-all flex items-center justify-between border border-transparent",
                      isActive
                        ? "text-accent bg-accent/5 border-accent/15"
                        : "text-muted hover:text-primary hover:bg-surface/50"
                    )}
                  >
                    <span>{link.label}</span>
                    <ArrowRight className={cn("w-4 h-4 transition-transform", isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2")} />
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
