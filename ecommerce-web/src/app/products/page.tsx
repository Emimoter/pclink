"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/product/ProductCard";
import { Loader2, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CATEGORIES, getCategoryName } from "@/lib/categories";

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get("category");
  const category = rawCategory ? rawCategory.toUpperCase() : null;
  const [search, setSearch] = useState("");
  
  const { products, loading, error } = useProducts({
    category: category || undefined,
  });

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8 max-w-7xl">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-surface border border-border p-6 rounded-2xl sticky top-24 shadow-sm">
          <div className="flex items-center gap-2 mb-8 pb-4 border-b border-border">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-primary tracking-tight">Filtros</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Buscar</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-medium"
                />
                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-muted mb-4 uppercase tracking-wider">Categorías</h3>
              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                <ul className="space-y-2 text-sm text-muted font-medium">
                  <li>
                    <a 
                      href="/products" 
                      className={`block py-1 transition-colors ${!category ? "text-accent font-bold" : "hover:text-primary"}`}
                    >
                      Todas
                    </a>
                  </li>
                  {CATEGORIES.map((cat) => (
                    <li key={cat.id}>
                      <a 
                        href={`/products?category=${cat.id}`} 
                        className={`block py-1 transition-colors ${category === cat.id ? "text-accent font-bold" : "hover:text-primary"}`}
                      >
                        {cat.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-3 tracking-tight">
            {category ? `Catálogo: ${getCategoryName(category)}` : "Todos los Productos"}
          </h1>
          <p className="text-muted font-medium">
            Mostrando {filteredProducts.length} producto{filteredProducts.length !== 1 && 's'}
          </p>
        </div>

        {error && (
          <div className="p-6 bg-red-50 border border-red-200 text-red-600 rounded-xl mb-8 font-medium">
            Hubo un error al cargar los productos. Por favor intenta de nuevo.
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-surface border border-border rounded-2xl">
            <h3 className="text-xl font-bold text-primary mb-3">No se encontraron productos</h3>
            <p className="text-muted mb-8 max-w-md mx-auto">Intentá buscando en otra categoría o eliminando los filtros de búsqueda.</p>
            <Button variant="outline" onClick={() => { setSearch(""); window.location.href = '/products'; }}>
              Ver todos los productos
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
