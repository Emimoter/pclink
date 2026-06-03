"use client";

import { useRef } from "react";
import { ShieldCheck, Cpu, MapPin, ArrowRight, ArrowLeft, Printer, RotateCcw, Wrench, Clock, Phone, Star, Sparkles, Calculator, Compass, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AboutPage() {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollAmount = clientWidth * 0.8;
      carouselRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const reasons = [
    {
      icon: Cpu,
      title: "Servicio Técnico de Precisión",
      desc: "Diagnósticos honestos y reparaciones electrónicas a nivel de componentes con instrumental de diagnóstico avanzado."
    },
    {
      icon: ShieldCheck,
      title: "Respaldo y Garantía Escrita",
      desc: "Todas nuestras reparaciones y componentes vendidos cuentan con cobertura formal de garantía para tu total tranquilidad."
    },
    {
      icon: Calculator,
      title: "Presupuestos sin Sorpresas",
      desc: "Emitimos el diagnóstico detallado y el valor final. Procedemos únicamente con tu previa validación y confirmación."
    },
    {
      icon: Compass,
      title: "Atención Técnica Fundadora",
      desc: "Atendido por sus dueños fundadores desde 1995, asegurando asesoramiento técnico calificado y respuestas claras."
    }
  ];

  const reviews = [
    {
      name: "Mariana Dopchiz",
      stars: 5,
      date: "Hace 9 meses",
      text: "Es la segunda computadora que llevo para hacerle cambios que mejoren su eficiencia/rendimiento y: Hacen un diagnóstico y te informan los cambios que hay que hacer y cual es su valor para que vos lo valides y a partir de ahí proceden. No te encontras con sorpresas. Lo hacen en tiempo récord, cumplen con el plazo acordado y a un precio razonable de mercado.",
      response: "Hola Mariana, muchísimas gracias por tu reseña ! valoramos mucho tu opinión."
    },
    {
      name: "Carolina Picone",
      stars: 5,
      date: "Hace 3 meses",
      text: "Increíble la atención! Necesitaba funcionando mi computadora con urgencia y me lo solucionaron rapidísimo. Muy genios!",
      response: "Hola Carolina, muchas gracias por tu reseña !!"
    },
    {
      name: "andrea pollo",
      stars: 5,
      date: "Hace un año",
      text: "Excelente atención y asesoramiento!!!  Rápidos y resolutivos. Lleve una impresora por problemas de inyectores tapados de 48hs estaba lista. Agradezco totalmente la rapidez ya que es de uso laboral. Tienen opciones de tinta originales y genéricas a un muy bien precio.",
      response: "Muy amable Andrea, agradecemos tu opinión y buena onda!"
    },
    {
      name: "Rocío Lascano Pérez",
      stars: 5,
      date: "Hace 4 meses",
      text: "Llevé mí computadora para actualizar, me asesoraron muy bien y cumplieron con el tiempo de arreglo que habían quedado. Súper conforme con el lugar.",
      response: "Hola Rocío, muchas gracias por tu reseña !!"
    },
    {
      name: "Gabriel Alberto Gandiani",
      stars: 5,
      date: "Hace 9 meses",
      text: "La atención es excelente y calificada. Buscan que encuentres la solución a tu problema. Las reparaciones y los equipos que venden son de muy buena calidad. Altamente recomendables.",
      response: "Hola Gabriel, muchas gracias por tu reseña y opinión."
    },
    {
      name: "Florencia Fortier",
      stars: 5,
      date: "Hace 9 meses",
      text: "Excelente servicio y rapidez. Instalaron los programas que necesitaba en el día, sin perjudicar mi tiempo de trabajo. Ademas, me asesoraron correctamente. Gracias!",
      response: "Hola Florencia muchas gracias por tu reseña !"
    }
  ];

  const services = [
    {
      icon: Wrench,
      title: "Reparación de PC & Notebooks",
      desc: "Servicio técnico integral de hardware a nivel de componentes. Realizamos reballing, reparación de cortocircuitos en placa madre, cambio de pantallas, teclados, bisagras y mantenimiento térmico profundo.",
      cols: "md:col-span-8"
    },
    {
      icon: Printer,
      title: "Soporte Técnico de Impresoras",
      desc: "Mantenimiento preventivo y correctivo multimarca (Láser y Sistema Continuo). Solución a fallas mecánicas de arrastre de papel, limpieza de cabezales y calibración de inyectores.",
      cols: "md:col-span-4"
    },
    {
      icon: Cpu,
      title: "Software & Optimización",
      desc: "Instalación limpia de sistemas operativos, respaldos preventivos, remoción de software malicioso y optimización avanzada del sistema para maximizar la velocidad de trabajo.",
      cols: "md:col-span-4"
    },
    {
      icon: RotateCcw,
      title: "Recuperación de Datos",
      desc: "Rescate de información sensible en unidades lógicas y físicas dañadas. Recuperamos archivos de discos rígidos mecánicos (HDD), SSDs, memorias SD y pendrives con sectores corruptos.",
      cols: "md:col-span-4"
    },
    {
      icon: ShieldCheck,
      title: "Hardware e Insumos",
      desc: "Provisión de componentes seleccionados de última generación, placas de video, microprocesadores, discos de estado sólido y accesorios informáticos con garantía oficial.",
      cols: "md:col-span-4"
    }
  ];



  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  } as const;

  return (
    <main className="bg-background min-h-screen pb-20 relative overflow-hidden w-full max-w-full">
      {/* Ambient background light blurs */}
      <div className="absolute top-10 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-slate-200/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* 1. Hero Section - Cinematic Split */}
      <section className="relative pt-24 pb-16 z-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Content (8 cols) */}
            <div className="md:col-span-8 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1 bg-accent/5 border border-accent/15 rounded-full text-accent text-[9px] font-black tracking-widest uppercase font-sans"
              >
                <MapPin className="w-3.5 h-3.5" /> Av. Carlos Tejedor 554 · Mar del Plata
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tighter leading-none max-w-4xl"
              >
                Tu tienda de tecnología <br />
                <span className="text-accent">en Mar del Plata</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-muted text-sm md:text-base max-w-xl leading-relaxed font-medium"
              >
                Lideramos el soporte especializado y la provisión de insumos informáticos de alta gama en la Costa Atlántica. Brindamos diagnósticos honestos, electrónica de precisión y servicio técnico propio.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-wrap gap-4 pt-2"
              >
                <a href="https://wa.me/5492235468972" target="_blank" rel="noopener noreferrer">
                  <Button className="rounded-full px-6 py-4 text-xs font-bold uppercase tracking-wider h-auto gap-2 group shadow-md">
                    <span>Contactar por WhatsApp</span>
                    <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center transition-all group-hover:translate-x-0.5">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </span>
                  </Button>
                </a>
                <Link href="/products">
                  <Button variant="secondary" className="rounded-full px-6 py-4 text-xs font-bold uppercase tracking-wider h-auto border border-border">
                    Ver Catálogo
                  </Button>
                </Link>
              </motion.div>
            </div>
            
            {/* Right Brand Badge (4 cols) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="hidden md:flex md:col-span-4 justify-center pt-4 md:pt-0"
            >
              <div className="relative p-2.5 bg-white rounded-full border border-border shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:scale-[1.03] transition-transform duration-500">
                <img
                  src="/logo.png"
                  alt="PC Link Logo"
                  className="h-40 w-40 md:h-52 md:w-52 object-contain rounded-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. ¿Por qué elegir PC Link? Section */}
      <section className="py-24 border-t border-border bg-surface/10 z-10 relative">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[9px] uppercase font-black tracking-widest text-accent font-sans block">
              Nuestros Valores
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight leading-none">
              ¿Por qué elegir PC Link?
            </h2>
            <p className="text-muted text-xs">
              La tranquilidad de dejar tu equipamiento tecnológico en manos de profesionales capacitados.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {reasons.map((reason, idx) => (
              <motion.div
                variants={itemVariants}
                key={idx}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex-none bg-surface/50 border border-border p-1.5 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.005)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.02)] transition-all duration-500"
              >
                <div className="bg-background border border-border/40 p-6 rounded-[calc(2rem-0.375rem)] h-full flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent">
                      <reason.icon className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-sm font-extrabold text-primary tracking-tight">{reason.title}</h3>
                    <p className="text-muted text-[11px] leading-relaxed">{reason.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 3. Reviews Section */}
      <section className="py-24 border-t border-border bg-surface/5 z-10 relative">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="text-[9px] uppercase font-black tracking-widest text-accent font-sans block">
                Opiniones Reales
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight leading-none">
                Lo que dicen de nosotros
              </h2>
              <p className="text-muted text-xs max-w-md">
                Nuestros clientes valoran la rapidez, honestidad y precisión de nuestro servicio técnico especializado.
              </p>
            </div>

            {/* Scorecard and Carousel controls wrapper to keep them together without overlap */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Scorecard Box */}
              <div className="flex items-center gap-4 bg-surface border border-border p-4 rounded-3xl shadow-sm">
                <div className="text-center border-r border-border/80 pr-4">
                  <div className="text-3xl font-black text-primary font-sans leading-none font-extrabold">4.4</div>
                  <div className="text-[8px] text-muted font-bold uppercase tracking-wider mt-1.5">Puntuación</div>
                </div>
                <div className="space-y-1">
                  <div className="flex gap-0.5 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    {/* Half star implementation */}
                    <div className="relative">
                      <Star className="w-4 h-4 text-slate-200 fill-current" />
                      <div className="absolute top-0 left-0 overflow-hidden w-[40%] text-amber-400">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted font-semibold">
                    Basado en <strong className="text-primary">84 reseñas</strong> en Google
                  </div>
                </div>
              </div>

              {/* Carousel scroll arrows */}
              <div className="flex gap-2 self-center">
                <button
                  onClick={() => scroll("left")}
                  className="w-10 h-10 rounded-full border border-border bg-surface hover:bg-slate-50 text-muted hover:text-primary transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-[0.95]"
                  aria-label="Anterior"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scroll("right")}
                  className="w-10 h-10 rounded-full border border-border bg-surface hover:bg-slate-50 text-muted hover:text-primary transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-[0.95]"
                  aria-label="Siguiente"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Carousel Viewport */}
          <div className="relative group">
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-8 pt-2 scroll-smooth"
            >
              {reviews.map((rev, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex-none w-[300px] md:w-[320px] lg:w-[calc((100%-3rem)/3)] bg-surface/50 border border-border p-1.5 rounded-[2rem] snap-start shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)] transition-all duration-500"
                >
                  <div className="bg-background border border-border/40 p-6 rounded-[calc(2rem-0.375rem)] h-full flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-black font-sans">
                            {rev.name[0].toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-primary truncate max-w-[150px] leading-tight">
                              {rev.name}
                            </h4>
                            <span className="text-[9px] text-muted mt-0.5 block">{rev.date}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-0.5 text-amber-400">
                          {[...Array(rev.stars)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>

                      {/* Review Text */}
                      <p className="text-[11px] leading-relaxed text-muted italic font-medium">
                        &quot;{rev.text}&quot;
                      </p>
                    </div>

                    {/* Owner Response */}
                    {rev.response && (
                      <div className="bg-surface/60 border border-border/30 rounded-2xl p-3 text-[10px] text-muted space-y-1">
                        <div className="font-bold text-primary flex items-center gap-1.5 uppercase text-[8px] tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                          Respuesta de PC Link
                        </div>
                        <p className="leading-relaxed font-medium">
                          {rev.response}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA to Google Reviews */}
          <div className="text-center pt-4">
            <a
              href="https://www.google.com/search?q=pclink+computacion+mar+del+plata#lrd=0x9584d96ab2cd6b93:0xc75225e6488d3c6d,1,,,,"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button
                variant="secondary"
                className="rounded-full px-6 py-4 h-auto text-xs font-bold uppercase tracking-wider flex items-center gap-2 group border border-border/80 hover:border-muted shadow-sm transition-all"
              >
                <span>Leer más opiniones en Google</span>
                <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center transition-all group-hover:translate-x-0.5">
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Button>
            </a>
          </div>
        </div>
      </section>



      {/* 5. Qué hacemos Section - Asymmetric Bento Grid */}
      <section className="py-24 bg-surface/30 border-y border-border z-10 relative">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[9px] uppercase font-black tracking-widest text-accent font-sans block">
              Servicios Especializados
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight leading-none">
              Qué hacemos
            </h2>
            <p className="text-muted text-xs">
              Especialización en hardware, servicio técnico electrónico calificado y provisión de equipamiento informático.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6 grid-flow-dense"
          >
            {services.map((service, idx) => (
              <motion.div 
                variants={itemVariants}
                key={idx} 
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`${service.cols} bg-background border border-border rounded-3xl p-6 space-y-4 flex flex-col justify-between hover:shadow-[0_12px_30px_rgba(0,0,0,0.015)] hover:border-slate-300 transition-all duration-300`}
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent">
                    <service.icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-extrabold text-primary text-xs uppercase tracking-wider">{service.title}</h3>
                  <p className="text-muted text-[11px] leading-relaxed font-medium">{service.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>



      {/* 7. Horarios y ubicación Section */}
      <section className="py-24 border-t border-border bg-surface/5 z-10 relative">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[9px] uppercase font-black tracking-widest text-accent font-sans block">
              Contacto y Local
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight leading-none">
              Horarios y ubicación
            </h2>
            <p className="text-muted text-xs">
              Ubicación del local comercial y horarios de atención al cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left: Schedule details */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-surface border border-border rounded-[2rem] p-8 space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-lg font-extrabold text-primary tracking-tight">Horarios de Atención</h3>
                <div className="space-y-3 text-xs text-muted font-medium">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span>Lunes a Viernes (Mañana):</span>
                    <span className="font-extrabold text-primary font-sans">09:00 a 13:00 hs</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span>Lunes a Viernes (Tarde):</span>
                    <span className="font-extrabold text-primary font-sans">16:00 a 20:00 hs</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>Sábados:</span>
                    <span className="font-extrabold text-primary font-sans">09:00 a 13:00 hs</span>
                  </div>
                </div>
              </div>
              <p className="text-[9.5px] text-muted leading-relaxed">
                * Los días feriados nacionales el establecimiento permanece cerrado. Para soporte técnico o consultas urgentes fuera de hora, le sugerimos comunicarse por WhatsApp.
              </p>
            </motion.div>

            {/* Right: Map and Contact Info */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="bg-surface border border-border rounded-[2rem] p-8 space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-lg font-extrabold text-primary tracking-tight">Ubicación y Contacto</h3>
                <div className="space-y-3 text-xs text-muted font-medium">
                  <div className="flex justify-between border-b border-border/50 pb-2 items-center">
                    <span>Dirección Comercial:</span>
                    <span className="font-extrabold text-primary text-right font-sans">Av. Carlos Tejedor 554</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2 items-center">
                    <span>Teléfono Fijo:</span>
                    <span className="font-sans font-extrabold text-primary">223 353-3843</span>
                  </div>
                  <div className="flex justify-between pb-1 items-center">
                    <span>WhatsApp Consultas:</span>
                    <span className="font-sans font-extrabold text-primary">223 546-8972</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <a 
                  href="https://www.google.com/maps/place/PC+Link/@-37.9620023,-57.5615781,17z/data=!3m1!4b1!4m6!3m5!1s0x9584d96ab2cd6b93:0xc75225e6488d3c6d!8m2!3d-37.9620066!4d-57.5589978!16s%2Fg%2F11b7ck7gpx?entry=ttu" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full rounded-xl py-4 text-xs font-bold uppercase tracking-wider h-auto gap-2 group justify-center">
                    <span>Cómo llegar</span>
                    <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center transition-all group-hover:translate-x-0.5">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </span>
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 8. CTA Final Section */}
      <section className="py-24 container mx-auto px-4 max-w-5xl z-10 relative">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 border border-slate-900 shadow-2xl p-8 md:p-12 text-center space-y-6">
          {/* Radial blur backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15),transparent_60%)] pointer-events-none" />
          
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <span className="text-[9px] uppercase font-black tracking-widest text-accent font-sans block">
              Contacto Directo
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              ¿Tu computadora necesita asistencia técnica?
            </h2>
            <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed">
              Traé tu equipo a nuestro local para un diagnóstico técnico profesional, o consultanos previamente por WhatsApp para coordinar la asistencia inmediata.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap justify-center gap-4 pt-4">
            <a href="https://wa.me/5492235468972" target="_blank" rel="noopener noreferrer">
              <Button className="rounded-full px-8 py-4 h-auto text-xs font-bold uppercase tracking-wider flex items-center gap-2 group shadow-lg">
                <span>Escribir por WhatsApp</span>
                <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center transition-all group-hover:translate-x-0.5">
                  <ArrowRight className="w-3 h-3 text-white" />
                </span>
              </Button>
            </a>
            <Link href="/products">
              <Button variant="secondary" className="rounded-full px-8 py-4 h-auto text-xs font-bold uppercase tracking-wider border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-850 hover:text-white">
                Ver Catálogo de Insumos
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
