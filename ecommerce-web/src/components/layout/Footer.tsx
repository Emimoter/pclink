import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border pt-24 pb-12 mt-auto">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24 mb-16">
          
          {/* Brand - Asymmetric split taking more space */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <Image
                src="/logo-circle.jpg"
                alt="PC Link Logo"
                width={48}
                height={48}
                className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
              />
              <span className="font-sans font-black text-lg md:text-xl tracking-wider text-primary">
                PC LINK
              </span>
            </Link>
            <p className="text-muted leading-relaxed text-lg max-w-md">
              La boutique de hardware en Mar del Plata. Configuración de equipos de alto rendimiento con precisión técnica y ensamble premium.
            </p>
          </div>

          {/* Links Grid */}
          <div className="md:col-span-7 grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="text-primary font-bold text-sm tracking-wide uppercase mb-2">Hardware</h3>
              <Link href="/products?category=GPU" className="text-muted hover:text-accent transition-colors">Placas de Video</Link>
              <Link href="/products?category=CPU" className="text-muted hover:text-accent transition-colors">Microprocesadores</Link>
              <Link href="/products?category=NOTEBOOK" className="text-muted hover:text-accent transition-colors">Notebooks</Link>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-primary font-bold text-sm tracking-wide uppercase mb-2">Contacto</h3>
              <a 
                href="https://maps.google.com/?q=Av.+Carlos+Tejedor+554,+Mar+del+Plata" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-accent transition-colors flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" /> Av. Carlos Tejedor 554
              </a>
              <a 
                href="https://wa.me/5492235468972" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-accent transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" /> 223 546 8972
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted">
          <p>© {new Date().getFullYear()} PC Link. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a 
              href="https://www.instagram.com/pclink.computacion/" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Instagram
            </a>
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
