"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, Check, RefreshCw, ChevronRight } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { type Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface SidebarFiltersProps {
  products: Product[];
  selectedCategory: string | null;
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onlyStock: boolean;
  onOnlyStockChange: (val: boolean) => void;
  onlyOffers: boolean;
  onOnlyOffersChange: (val: boolean) => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
  selectedBrands: string[];
  onSelectedBrandsChange: (brands: string[]) => void;
  onClearFilters: () => void;
  isMobile?: boolean;
}

const COMMON_BRANDS = [
  "Asus", "Gigabyte", "Intel", "AMD", "Nvidia", "Corsair", "Logitech", 
  "Razer", "Kingston", "MSI", "Samsung", "Western Digital", "Crucial", 
  "Redragon", "Sentey", "HyperX", "Aorus", "TP-Link", "Epson", "HP", "Lenovo"
];

export default function SidebarFilters({
  products,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onlyStock,
  onOnlyStockChange,
  onlyOffers,
  onOnlyOffersChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  selectedBrands,
  onSelectedBrandsChange,
  onClearFilters,
  isMobile = false,
}: SidebarFiltersProps) {
  // Local state for price inputs to prevent lag
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  useEffect(() => {
    setLocalMin(minPrice);
  }, [minPrice]);

  useEffect(() => {
    setLocalMax(maxPrice);
  }, [maxPrice]);

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    onMinPriceChange(localMin);
    onMaxPriceChange(localMax);
  };

  // Reset local prices when parent is cleared
  const handleClear = () => {
    setLocalMin("");
    setLocalMax("");
    onClearFilters();
  };

  // Filter products by selected category to extract relevant brands
  const categoryProducts = selectedCategory 
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  // Dynamic brand extraction based on CURRENT category products name matches
  const availableBrands = Array.from(
    new Set(
      categoryProducts
        .map((p) => {
          const nameLower = p.name.toLowerCase();
          return COMMON_BRANDS.find((b) => nameLower.includes(b.toLowerCase()));
        })
        .filter(Boolean)
    )
  ) as string[];

  // Calculate product counts per category (based on the full list of products)
  const getCategoryCount = (catId: string) => {
    return products.filter((p) => p.category === catId).length;
  };

  const totalProducts = products.length;

  return (
    <div className={cn("flex flex-col gap-8 w-full", isMobile ? "px-6 py-6" : "")}>
      
      {/* Header and Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h2 className="text-lg font-black text-primary tracking-tight font-sans flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-accent" />
          Filtros
        </h2>
        {(selectedCategory || searchQuery || onlyStock || onlyOffers || minPrice || maxPrice || selectedBrands.length > 0) && (
          <button
            onClick={handleClear}
            className="text-[10px] font-black uppercase tracking-wider text-muted hover:text-accent transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Limpiar todo
          </button>
        )}
      </div>



      {/* Categories List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-sans">Categorías</h3>
        <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
          {/* Option: All */}
          <button
            onClick={() => onSelectCategory("ALL")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all cursor-pointer group",
              selectedCategory === null
                ? "bg-accent/5 text-accent border border-accent/15 shadow-sm"
                : "text-muted hover:text-primary hover:bg-surface border border-transparent"
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-60" />
              <span>Todas las Categorías</span>
            </div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-slate-200/60 transition-colors text-muted">
              {totalProducts}
            </span>
          </button>

          {/* Categories matching current products */}
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat.id);
            if (count === 0) return null;

            const IconComponent = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all cursor-pointer group",
                  isSelected
                    ? "bg-accent/5 text-accent border border-accent/15 shadow-sm"
                    : "text-muted hover:text-primary hover:bg-surface border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent className={cn("w-4 h-4", isSelected ? "text-accent" : "text-muted group-hover:text-primary")} />
                  <span className="truncate max-w-[150px]">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-slate-200/60 transition-colors text-muted">
                    {count}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted/40 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>



      {/* Price Range Filter */}
      <form onSubmit={handleApplyPrice} className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-sans">Rango de Precio</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            className="w-full h-10 bg-background hover:bg-surface border border-border rounded-xl px-3 text-xs focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-bold shadow-sm placeholder:text-muted/50 font-mono"
          />
          <span className="text-muted/50 font-bold">—</span>
          <input
            type="number"
            placeholder="Max"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            className="w-full h-10 bg-background hover:bg-surface border border-border rounded-xl px-3 text-xs focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-bold shadow-sm placeholder:text-muted/50 font-mono"
          />
          <button
            type="submit"
            className="h-10 px-3 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
          >
            Aplicar
          </button>
        </div>
      </form>

      {/* Brand Filters (only render if brands are found) */}
      {availableBrands.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-sans">Marcas</h3>
          <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
            {availableBrands.map((brand) => {
              const isChecked = selectedBrands.includes(brand);
              return (
                <label
                  key={brand}
                  className="flex items-center gap-2.5 cursor-pointer select-none text-sm text-muted hover:text-primary transition-colors font-semibold group"
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          onSelectedBrandsChange(selectedBrands.filter((b) => b !== brand));
                        } else {
                          onSelectedBrandsChange([...selectedBrands, brand]);
                        }
                      }}
                      className="peer appearance-none w-5 h-5 rounded-lg border border-border bg-background checked:border-accent checked:bg-accent focus:outline-none focus:ring-2 focus:ring-accent/15 cursor-pointer transition-all"
                    />
                    <Check className="absolute w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none stroke-[3]" />
                  </div>
                  <span className={cn(isChecked ? "text-primary font-bold" : "")}>{brand}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
      
    </div>
  );
}
