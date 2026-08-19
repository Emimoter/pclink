"use client";

import { useState } from "react";
import { Check, Truck, MapPin, Building2, ChevronDown, Loader2, Zap, ShieldCheck } from "lucide-react";
import { PROVINCES, calculateShippingQuote, ShippingQuoteResult } from "@/lib/shipping";
import { motion, AnimatePresence } from "framer-motion";

export default function ShippingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("BA");
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShippingQuoteResult | null>(null);
  const [error, setError] = useState("");

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipCode.trim()) {
      setError("Por favor, ingresá un código postal.");
      return;
    }
    setError("");
    setLoading(true);

    setTimeout(() => {
      const quote = calculateShippingQuote(selectedProvince, zipCode.trim());
      setResult(quote);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="w-full mt-6 bg-surface/60 border border-border/80 rounded-2xl p-5 md:p-6 shadow-sm">
      {/* Trust Badges */}
      <div className="space-y-2.5 mb-5 text-sm font-medium text-primary">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </span>
          <span>Envío en el lapso de 3 a 5 días hábiles</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </span>
          <span>
            Envíos a todo el país por <strong>ANDREANI</strong>
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </span>
          <span>Garantía oficial escrita de 6 meses</span>
        </div>
      </div>

      {/* Action button to open calculator */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full py-3.5 px-4 bg-[#e85d3f] hover:bg-[#d44d30] text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <Truck className="w-4 h-4" />
          Cotizar Envío
        </button>
      )}

      {/* Calculator Form */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCalculate} className="space-y-3.5 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">
                  Calcular costo a tu localidad
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              {/* Province Selector */}
              <div className="relative">
                <select
                  value={selectedProvince}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    setResult(null);
                  }}
                  className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all cursor-pointer"
                >
                  {PROVINCES.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Postal Code Input */}
              <div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Código postal (ej: 7600 o 1425)"
                  value={zipCode}
                  onChange={(e) => {
                    setZipCode(e.target.value);
                    setError("");
                    setResult(null);
                  }}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-primary placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
                />
                {error && <p className="text-xs text-red-500 font-semibold mt-1 pl-1">{error}</p>}
              </div>

              {/* Calculate Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#e85d3f] hover:bg-[#d44d30] disabled:opacity-50 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  "Calcular"
                )}
              </button>
            </form>

            {/* Results Display */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 pt-4 border-t border-border/80 space-y-2.5"
              >
                {result.isMarDelPlata && result.localOptions ? (
                  <div className="space-y-2">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      📍 <strong>¡Estás en Mar del Plata!</strong> Tenés envíos locales en el día y retiro gratis:
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border text-xs">
                      <div className="flex items-center gap-2.5">
                        <Truck className="w-4 h-4 text-accent shrink-0" />
                        <div>
                          <div className="font-bold text-primary">Envío Estándar (Local)</div>
                          <div className="text-[11px] text-muted">{result.localOptions.standard.deliveryTime}</div>
                        </div>
                      </div>
                      <span className="font-bold text-primary">${result.localOptions.standard.cost.toLocaleString("es-AR")}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border text-xs">
                      <div className="flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <div className="font-bold text-primary">Envío Inmediato Express</div>
                          <div className="text-[11px] text-muted">{result.localOptions.immediate.deliveryTime}</div>
                        </div>
                      </div>
                      <span className="font-bold text-primary">${result.localOptions.immediate.cost.toLocaleString("es-AR")}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border text-xs">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <div className="font-bold text-primary">Retiro en Sucursal Central</div>
                          <div className="text-[11px] text-muted">{result.localOptions.pickup.deliveryTime}</div>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">Gratis</span>
                    </div>
                  </div>
                ) : result.andreaniOptions ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-accent mb-1">
                      <Truck className="w-3.5 h-3.5" /> Opciones de Envío Nacional ANDREANI:
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border text-xs">
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-[#e85d3f] shrink-0" />
                        <div>
                          <div className="font-bold text-primary">{result.andreaniOptions.homeDelivery.label}</div>
                          <div className="text-[11px] text-muted">Llega en {result.andreaniOptions.homeDelivery.deliveryTime}</div>
                        </div>
                      </div>
                      <span className="font-bold text-primary font-mono text-sm">
                        ${result.andreaniOptions.homeDelivery.cost.toLocaleString("es-AR")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border text-xs">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-[#e85d3f] shrink-0" />
                        <div>
                          <div className="font-bold text-primary">{result.andreaniOptions.branchPickup.label}</div>
                          <div className="text-[11px] text-muted">Llega en {result.andreaniOptions.branchPickup.deliveryTime}</div>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        ${result.andreaniOptions.branchPickup.cost.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
