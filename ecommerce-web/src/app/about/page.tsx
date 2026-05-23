"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Cpu, MapPin, ArrowRight, Printer, RotateCcw, Wrench, Clock, Phone, History } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function AboutPage() {
  const stats = [
    { label: "Trayectoria", value: "30+ Años" },
    { label: "Ubicación", value: "Tejedor 554" },
    { label: "Garantía Técnica", value: "100% Escrita" },
    { label: "Soporte", value: "Especializado" },
  ];

  const services = [
    {
      icon: Wrench,
      title: "Reparación de PC & Notebooks",
      desc: "Servicio técnico integral de hardware a nivel de componentes. Realizamos reballing, reparación de cortocircuitos en placa madre, cambio de pantallas, teclados, bisagras y mantenimiento térmico profundo.",
      cols: "md:col-span-8",
    },
    {
      icon: Printer,
      title: "Servicio Técnico de Impresoras",
      desc: "Mantenimiento preventivo y correctivo multimarca (Láser y Sistema Continuo). Solución a fallas mecánicas de arrastre de papel, limpieza de cabezales y calibración de inyectores.",
      cols: "md:col-span-4",
    },
    {
      icon: Cpu,
      title: "Software & Optimización",
      desc: "Instalación limpia de sistemas operativos, respaldos preventivos, remoción de troyanos/adware y optimización avanzada del sistema para maximizar la velocidad de trabajo.",
      cols: "md:col-span-4",
    },
    {
      icon: RotateCcw,
      title: "Recuperación de Datos",
      desc: "Rescate de información sensible en unidades lógicas y físicas dañadas. Recuperamos archivos de discos rígidos mecánicos (HDD), SSDs, memorias SD y pendrives con sectores corruptos.",
      cols: "md:col-span-4",
    },
    {
      icon: ShieldCheck,
      title: "Venta de Hardware e Insumos",
      desc: "Provisión de componentes seleccionados de última generación, placas de video, microprocesadores, discos de estado sólido y accesorios informáticos con garantía oficial.",
      cols: "md:col-span-4",
    },
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
    <div className="bg-background min-h-screen pb-20 relative overflow-hidden">
      {/* Ambient background light blurs */}
      <div className="absolute top-10 left-0 w-[400px] h-[400px] bg-accent/4 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-slate-200/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Hero Section - Asymmetric Split Screen */}
      <section className="relative pt-24 pb-12 z-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
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
                className="text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tighter leading-none"
              >
                Tres Décadas de <br />
                <span className="text-accent">Evolución Tecnológica</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-muted text-sm md:text-base max-w-xl leading-relaxed font-medium"
              >
                Más de 30 años liderando el servicio técnico especializado y la provisión de insumos informáticos de alta gama en la Costa Atlántica. Diagnósticos honestos, electrónica de precisión y laboratorio propio.
              </motion.p>
            </div>
            
            {/* Right Brand Badge (4 cols) - Clean, larger, circular brand mark */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="md:col-span-4 flex md:justify-end justify-center pt-4 md:pt-2"
            >
              <div className="relative p-2.5 bg-white rounded-full border border-border shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:scale-[1.03] transition-transform duration-500">
                <img
                  src="/logo.png"
                  alt="PC Link Logo"
                  className="h-28 w-28 md:h-36 md:w-36 object-contain rounded-full"
                />
                <div className="absolute -bottom-1 -right-1 bg-accent border-2 border-white text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-md font-sans">
                  Est. 1995
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar - Negative Space Layout with divider lines */}
      <section className="container mx-auto px-4 max-w-5xl z-10 relative mb-16">
        <div className="border-y border-border py-8 grid grid-cols-2 md:grid-cols-4 gap-y-6 divide-y md:divide-y-0 md:divide-x divide-border">
          {stats.map((stat, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              key={idx} 
              className="text-center px-4"
            >
              <div className="text-2xl md:text-3xl font-black text-primary font-sans tracking-tight">{stat.value}</div>
              <div className="text-[9px] text-muted font-bold uppercase tracking-wider mt-1.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* History & Story - Asymmetric Split */}
      <section className="py-12 container mx-auto px-4 max-w-5xl z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-1.5 text-accent text-[9px] font-black uppercase tracking-widest font-sans">
              <History className="w-3.5 h-3.5" /> Nuestra Trayectoria
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight leading-tight">
              Desde los microprocesadores clásicos hasta el hardware gamer de última generación.
            </h2>
            <div className="space-y-4 text-muted text-xs leading-relaxed max-w-[60ch]">
              <p>
                Fundada a comienzos de los años 90 en la ciudad de Mar del Plata, <strong className="text-primary font-bold">PC Link Computación</strong> nació con el firme compromiso de profesionalizar el servicio técnico informático y la venta de insumos en la zona norte de la ciudad.
              </p>
              <p>
                A lo largo de más de <strong className="text-primary font-bold">30 años de trayectoria ininterrumpida</strong>, hemos visto evolucionar la tecnología desde los primeros procesadores de escritorio hasta los setups gamer y de modelado 3D más exigentes del mercado. Esa misma evolución nos ha exigido un constante perfeccionamiento, capacitándonos continuamente y dotando a nuestro laboratorio con herramientas electrónicas de última generación.
              </p>
              <p>
                Hoy, seguimos ubicados en el corazón de la avenida Carlos Tejedor al 554, atendidos por sus propios dueños y técnicos fundadores, asegurando la misma atención honesta, transparente y certificada que nos ha caracterizado por más de tres décadas.
              </p>
            </div>
          </motion.div>

          {/* Elegant Bento Grid of Hardware (No people, compact size, 5 images) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end mt-8 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-3 w-full max-w-[320px] p-3 bg-surface/50 border border-border rounded-3xl"
            >
              {/* Image 1: GPU close-up (spans 2 columns) */}
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="col-span-2 aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-background"
              >
                <img
                  src="https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=350"
                  alt="GPU de Alto Rendimiento"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </motion.div>

              {/* Image 2: Microchips detail */}
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="col-span-1 aspect-square overflow-hidden rounded-xl border border-border bg-background"
              >
                <img
                  src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=250"
                  alt="Microchips de Precisión"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </motion.div>

              {/* Image 3: RAM modules */}
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="col-span-1 aspect-square overflow-hidden rounded-xl border border-border bg-background"
              >
                <img
                  src="https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=250"
                  alt="Módulos de Memoria RAM"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </motion.div>

              {/* Image 4: AIO Cooler */}
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="col-span-1 aspect-square overflow-hidden rounded-xl border border-border bg-background"
              >
                <img
                  src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=250"
                  alt="Refrigeración Líquida"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </motion.div>

              {/* Image 5: Mechanical keyboard switches */}
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="col-span-1 aspect-square overflow-hidden rounded-xl border border-border bg-background"
              >
                <img
                  src="https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=250"
                  alt="Interruptores Mecánicos"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </motion.div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Services Grid (Compact Bento Layout) */}
      <section className="py-20 bg-surface/30 border-y border-border z-10 relative">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[9px] uppercase font-black tracking-widest text-accent font-sans">
              Especialización técnica
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight leading-none">
              Nuestras Soluciones
            </h2>
            <p className="text-muted text-xs">
              Laboratorio electrónico propio especializado y venta de equipamiento informático con garantía escrita.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-12 gap-5"
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
                  <p className="text-muted text-[11px] leading-relaxed">{service.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Schedule, Location & Communication */}
      <section className="py-20 container mx-auto px-4 max-w-5xl z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: Horarios */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-surface border border-border rounded-3xl p-6 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-extrabold text-primary tracking-tight">Horarios de Atención</h3>
              <div className="space-y-2 text-xs text-muted">
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span>Lunes a Viernes (Mañana):</span>
                  <span className="font-extrabold text-primary font-sans">09:00 a 13:00 hs</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span>Lunes a Viernes (Tarde):</span>
                  <span className="font-extrabold text-primary font-sans">16:00 a 20:00 hs</span>
                </div>
                <div className="flex justify-between pb-0.5">
                  <span>Sábados:</span>
                  <span className="font-extrabold text-primary font-sans">09:00 a 13:00 hs</span>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-muted leading-relaxed">
              * Feriados nacionales el local permanece cerrado. Ante urgencias técnicas sugerimos contacto previo por WhatsApp.
            </p>
          </motion.div>

          {/* Card 2: Contacto */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="bg-surface border border-border rounded-3xl p-6 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent">
                <Phone className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-extrabold text-primary tracking-tight">Canales de Contacto</h3>
              <div className="space-y-2 text-xs text-muted">
                <div className="flex justify-between border-b border-border/50 pb-1.5 items-center">
                  <span>Teléfono Local:</span>
                  <span className="font-sans font-extrabold text-primary">223 353-3843</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-1.5 items-center">
                  <span>WhatsApp de Consulta:</span>
                  <span className="font-sans font-extrabold text-primary">223 546-8972</span>
                </div>
                <div className="flex justify-between pb-0.5 items-center">
                  <span>Dirección Local:</span>
                  <span className="font-extrabold text-primary text-right font-sans">Av. Carlos Tejedor 554</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/products" className="flex-1">
                <Button className="w-full rounded-xl py-4 text-xs font-bold uppercase tracking-wider h-auto">
                  Ver Tienda
                </Button>
              </Link>
              <a href="https://wa.me/5492235468972" target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="secondary" className="w-full rounded-xl py-4 text-xs font-bold uppercase tracking-wider h-auto gap-1">
                  WhatsApp <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
