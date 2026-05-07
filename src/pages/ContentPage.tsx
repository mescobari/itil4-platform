import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AMAZON_KDP_URL } from '../lib/config';
import {
  BookOpen, Shield, Star, Download, ArrowRight, Menu, X,
  ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Reading progress bar ─────────────────────────────────────────────────────
function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <div className="fixed top-0 left-0 z-50 w-full h-1 bg-transparent">
      <div
        className="h-full bg-linear-to-r from-[#6B2D91] to-[#FF6B35] transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ onBuy }: { onBuy: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { label: 'Capítulos', id: 'chapters' },
    { label: 'Contenido', id: 'accordion' },
    { label: 'Bonuses',   id: 'bonuses'   },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <nav className={`fixed top-1 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigate('/itil4')} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#6B2D91] to-[#8B5CF6] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className={`font-bold text-sm transition-colors ${scrolled ? 'text-[#1A1A1A]' : 'text-white'}`}>
            ITIL 4 Foundation
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className={`text-sm font-medium transition-colors hover:text-[#8B5CF6] ${scrolled ? 'text-gray-600' : 'text-white/80'}`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBuy}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-[#FF6B35] to-[#e85520] text-white text-sm font-bold hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Comprar — $37
          </button>
          <button
            className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-gray-700' : 'text-white'}`}
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="w-full text-left px-6 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-[#6B2D91] transition-colors"
            >
              {l.label}
            </button>
          ))}
          <div className="px-6 py-4 border-t border-gray-100">
            <button
              onClick={() => { onBuy(); setMenuOpen(false); }}
              className="w-full py-3 rounded-xl bg-linear-to-r from-[#FF6B35] to-[#e85520] text-white font-bold text-sm"
            >
              Comprar Ahora — $37
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection({ onBuy, onSample }: { onBuy: () => void; onSample: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-[70vh] bg-linear-to-br from-[#0a0014] via-[#1a0033] to-[#2d0060] overflow-hidden flex items-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-5%] w-125 h-125 rounded-full bg-[#6B2D91] opacity-25 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-87.5 h-87.5 rounded-full bg-[#8B5CF6] opacity-20 blur-3xl" />
      </div>
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        {/* Badge */}
        <div className={`flex justify-center mb-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FF6B35]/20 border border-[#FF6B35]/40 text-[#FF6B35] text-sm font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse inline-block" />
            Edición 2024–2026 · +380 páginas
          </span>
        </div>

        {/* Title */}
        <div className={`text-center transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Lo Que Incluye{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#c084fc] to-[#FF6B35]">
              Tu Libro
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            Más que teoría: tu mapa completo hacia la certificación garantizada.
            <br className="hidden sm:block" />
            Cada sección fue diseñada para que apruebes a la primera.
          </p>
        </div>

        {/* Stats */}
        <div className={`flex flex-wrap justify-center gap-6 mb-10 transition-all duration-700 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {[
            { value: '3',    label: 'Capítulos'     },
            { value: '40',   label: 'Exámenes tipo' },
            { value: '+380', label: 'Páginas'        },
            { value: '3',    label: 'Bonuses'        },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <button
            onClick={onBuy}
            className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-linear-to-r from-[#FF6B35] to-[#e85520] text-white font-bold text-lg shadow-lg hover:shadow-orange-500/40 hover:scale-105 transition-all duration-200"
          >
            Comprar Ahora — $37
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onSample}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold text-lg hover:bg-white/20 transition-all duration-200"
          >
            <Download className="w-5 h-5" />
            Descargar Muestra PDF
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Chapter Cards ────────────────────────────────────────────────────────────
const CHAPTERS = [
  {
    emoji: '🧭',
    title: 'Tu Brújula',
    chapter: 'Capítulo 1',
    badge: 'Plan de 4 semanas',
    badgeColor: 'bg-purple-100 text-purple-700',
    borderColor: 'border-purple-200 hover:border-[#6B2D91]',
    iconBg: 'from-[#6B2D91] to-[#8B5CF6]',
    sections: [
      '1.1 Introducción al camino',
      '1.2 Tu mapa de viaje',
      '1.3 Hoja de ruta 4 semanas',
      '1.4 Puente teoría-acción',
      '1.5 Los tres pilares del éxito',
      '1.6 Los 5 espejismos del estudio',
      '1.7 Ética profesional ITIL',
      '1.8 Tu momento ha llegado',
    ],
  },
  {
    emoji: '🏗️',
    title: 'Base Técnica',
    chapter: 'Capítulo 2',
    badge: '12 herramientas esenciales',
    badgeColor: 'bg-blue-100 text-blue-700',
    borderColor: 'border-blue-200 hover:border-blue-500',
    iconBg: 'from-[#3b82f6] to-[#6366f1]',
    sections: [
      '2.1 Lecciones de los años 80',
      '2.2 Las cuatro dimensiones',
      '2.3 Ecosistemas de servicios',
      '2.4 Las siete brújulas guía',
      '2.5 Las doce herramientas clave',
      '2.6 Trampas del examen y cómo evitarlas',
    ],
  },
  {
    emoji: '✅',
    title: 'Solucionario',
    chapter: 'Capítulo 3',
    badge: 'Con explicaciones detalladas',
    badgeColor: 'bg-green-100 text-green-700',
    borderColor: 'border-green-200 hover:border-green-500',
    iconBg: 'from-[#10b981] to-[#059669]',
    sections: [
      '40 preguntas tipo examen real',
      'Análisis de cada opción de respuesta',
      'Justificación paso a paso',
      'Errores comunes identificados',
      'Técnica del eliminado progresivo',
      'Estrategia de tiempo por pregunta',
    ],
  },
];

function ChapterCards({ onBuy }: { onBuy: () => void }) {
  const { ref, visible } = useReveal();
  return (
    <section id="chapters" ref={ref} className="py-20 bg-linear-to-b from-white to-[#faf5ff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1 rounded-full bg-[#6B2D91]/10 text-[#6B2D91] text-sm font-semibold mb-4 tracking-wide">
            Estructura del Libro
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            3 Capítulos, Un Solo Objetivo
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            Cada capítulo cumple un rol específico en tu preparación. No sobra nada, no falta nada.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {CHAPTERS.map((ch, i) => (
            <div
              key={ch.chapter}
              className={`group relative bg-white rounded-2xl border-2 ${ch.borderColor} p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block">{ch.chapter}</span>
              <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${ch.iconBg} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-2xl">{ch.emoji}</span>
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{ch.title}</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-5 ${ch.badgeColor}`}>
                {ch.badge}
              </span>
              <ul className="space-y-2 flex-1">
                {ch.sections.map(s => (
                  <li key={s} className="flex items-start gap-2 text-sm text-gray-600" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    <span className="mt-1 w-4 h-4 rounded-full bg-[#6B2D91]/10 shrink-0 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6B2D91]" />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={`mt-14 text-center transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <button
            onClick={onBuy}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-linear-to-r from-[#6B2D91] to-[#8B5CF6] text-white font-bold text-lg shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-200"
          >
            Quiero Acceder a Todo Esto — $37
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-gray-400 mt-3">✓ Entrega instantánea Kindle &nbsp;·&nbsp; ✓ Garantía Amazon &nbsp;·&nbsp; ✓ Compra segura en Amazon</p>
        </div>
      </div>
    </section>
  );
}

// ─── Content Accordion ────────────────────────────────────────────────────────
const ACCORDION_DATA = [
  {
    id: 'cap1',
    title: 'Capítulo 1: Tu Plan — La Brújula del Estudiante',
    emoji: '🧭',
    color: 'text-[#6B2D91]',
    bgColor: 'bg-[#6B2D91]/5',
    borderColor: 'border-[#6B2D91]/20',
    items: [
      {
        section: '1.1 Introducción al Camino',
        desc: 'Por qué ITIL 4 Foundation es la certificación de gestión de servicios más solicitada del mercado. Contexto del examen: 40 preguntas, 65 minutos, nota mínima 26/40 (65%).',
      },
      {
        section: '1.2 Tu Mapa de Viaje',
        desc: 'Visión panorámica de todo lo que vas a estudiar. Cómo los tres capítulos se conectan entre sí para llevarte desde cero hasta el examen con confianza total.',
      },
      {
        section: '1.3 Hoja de Ruta: 4 Semanas al Examen',
        desc: 'Plan día a día estructurado: Semana 1 (fundamentos), Semana 2 (SVS y prácticas), Semana 3 (simulacros intensivos), Semana 4 (estrategia final y repaso). Tiempos de estudio diario recomendados.',
      },
      {
        section: '1.4 El Puente entre Teoría y Acción',
        desc: 'Cómo ITIL 4 se aplica en organizaciones reales. Casos de uso de TI que el examen espera que reconozcas. No memorices definiciones: entiende el contexto.',
      },
      {
        section: '1.5 Los Tres Pilares del Éxito',
        desc: 'Comprensión (no memorización pura), práctica con exámenes tipo, y gestión del tiempo en sala. Estos tres elementos diferencian a quien aprueba del que reprueba.',
      },
      {
        section: '1.6 Los 5 Espejismos del Estudio',
        desc: 'Los errores más comunes que cometen los candidatos ITIL: estudiar el glosario de atrás hacia adelante, sesgar por experiencia laboral, ignorar las prácticas secundarias, confiar solo en dumps, y subestimar el tiempo.',
      },
      {
        section: '1.7 Ética Profesional en ITIL',
        desc: 'El componente ético que aparece en varias preguntas del examen. ITIL no solo es técnico: el marco promueve valores profesionales que el examinador evalúa en preguntas de escenario.',
      },
      {
        section: '1.8 Tu Momento Ha Llegado',
        desc: 'Mentalidad de certificación: cómo gestionar la ansiedad antes del examen, qué hacer las 48 horas previas, y por qué el 80% de quienes reprueban podrían haber aprobado con la preparación correcta.',
      },
    ],
  },
  {
    id: 'cap2',
    title: 'Capítulo 2: Fundamentos Técnicos — La Base Sólida',
    emoji: '🏗️',
    color: 'text-[#3b82f6]',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    items: [
      {
        section: '2.1 Lecciones de los Años 80 a Hoy',
        desc: 'De ITIL v1 a ITIL 4: cómo evolucionó el marco. Por qué ITIL 4 integró Agile, DevOps y Lean. El nuevo enfoque en valor co-creado y por qué cambia la lógica del examen.',
      },
      {
        section: '2.2 Las Cuatro Dimensiones del Servicio',
        desc: 'Organizaciones y personas · Información y tecnología · Socios y proveedores · Flujos de valor y procesos. Cómo el examen usa las 4 dimensiones en preguntas de escenario.',
      },
      {
        section: '2.3 Ecosistemas de Servicios: El SVS',
        desc: 'El Sistema de Valor del Servicio explicado sin jerga. La Cadena de Valor del Servicio (SVC): Planear, Mejorar, Involucrar, Diseñar y Transicionar, Obtener/Construir, Entregar y Soportar.',
      },
      {
        section: '2.4 Los Siete Principios Guía',
        desc: 'Enfocarse en el valor · Empezar donde estás · Progresar iterativamente con retroalimentación · Colaborar y promover la visibilidad · Pensar holísticamente · Mantenerlo simple · Optimizar y automatizar. Técnica mnemotécnica incluida.',
      },
      {
        section: '2.5 Las 14 Prácticas de Gestión',
        desc: 'Gestión de incidentes, problemas, cambios, activos, niveles de servicio, mesa de servicio, y más. Para cada práctica: definición exacta del examen, propósito, actividades clave, y la pregunta tipo que suele aparecer.',
      },
      {
        section: '2.6 Trampas del Examen y Cómo Evitarlas',
        desc: 'Las 12 trampas más frecuentes en las preguntas del examen oficial. Cómo distinguir entre "incidente" y "problema", entre "cambio de emergencia" y "cambio de rutina". Palabras clave que delatan la respuesta correcta.',
      },
    ],
  },
  {
    id: 'cap3',
    title: 'Capítulo 3: Solucionario — 40 Exámenes Tipo Resueltos',
    emoji: '✅',
    color: 'text-[#10b981]',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    items: [
      {
        section: '40 Preguntas Tipo Examen Real',
        desc: 'Preguntas con el mismo formato, nivel de dificultad y distribución temática del examen oficial ITIL 4 Foundation. Distribuidas en las mismas proporciones del examen real.',
      },
      {
        section: 'Análisis Teórico por Pregunta',
        desc: 'Para cada pregunta: identificación del módulo del temario involucrado, los conceptos que evalúa, y el nivel de dificultad (básico / intermedio / avanzado). Mapeo contra el syllabus oficial.',
      },
      {
        section: 'Justificación Detallada de Respuestas',
        desc: 'No solo "la respuesta es B". Para cada pregunta: por qué las 4 opciones son correctas o incorrectas, qué criterio del examinador aplicó, y qué concepto hay que reforzar si fallas.',
      },
      {
        section: 'Explicación de Errores Comunes',
        desc: 'Las confusiones más frecuentes de los candidatos analizadas respuesta por respuesta. Por qué la opción trampa parece correcta y cómo entrenarse para no caer.',
      },
      {
        section: 'Técnica del Eliminado Progresivo',
        desc: 'Metodología para eliminar 2 opciones en 10 segundos y concentrarte en las 2 restantes. Aplicada a cada pregunta del solucionario con práctica guiada.',
      },
      {
        section: 'Estrategia de Tiempo: 65 Minutos Bien Usados',
        desc: 'Distribución óptima del tiempo por pregunta. Qué hacer si te atascas. Cómo revisar al final. Técnica de marcado para preguntas dudosas. Objetivo: terminar con 10 minutos de revisión.',
      },
    ],
  },
];

function AccordionItem({
  item, isOpen, onToggle,
}: {
  item: typeof ACCORDION_DATA[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div className={`rounded-2xl border-2 ${item.borderColor} overflow-hidden transition-all duration-300 ${isOpen ? item.bgColor : 'bg-white'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left group"
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl">{item.emoji}</span>
          <span className={`font-bold text-lg ${item.color}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {item.title}
          </span>
        </div>
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${isOpen ? 'bg-[#6B2D91] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-[#6B2D91]'}`}>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <div
        ref={contentRef}
        style={{ height: `${height}px`, overflow: 'hidden', transition: 'height 0.35s ease' }}
      >
        <div className="px-6 pb-6 grid sm:grid-cols-2 gap-4">
          {item.items.map(sub => (
            <div key={sub.section} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="font-semibold text-sm text-[#1A1A1A] mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {sub.section}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                {sub.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentAccordion() {
  const [openId, setOpenId] = useState<string | null>('cap1');
  const { ref, visible } = useReveal();

  return (
    <section id="accordion" ref={ref} className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1 rounded-full bg-[#6B2D91]/10 text-[#6B2D91] text-sm font-semibold mb-4 tracking-wide">
            Contenido Detallado
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Explora Cada Sección
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            Clic en cada capítulo para ver exactamente qué aprenderás. Sin sorpresas.
          </p>
        </div>

        <div className={`space-y-4 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {ACCORDION_DATA.map(item => (
            <AccordionItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Bonus Grid ───────────────────────────────────────────────────────────────
const BONUSES = [
  {
    emoji: '📋',
    title: 'Checklist: 7 Días Previos',
    value: '$27',
    color: 'from-[#6B2D91] to-[#8B5CF6]',
    border: 'border-purple-200',
    desc: 'El plan exacto para los 7 días previos al examen. Qué revisar, qué descansar, cómo llegar en óptimas condiciones mentales y técnicas.',
    items: ['Checklist diario día 7 al día 1', 'Rutina de repaso final', 'Gestión del estrés pre-examen', 'Logística en sala: qué llevar'],
  },
  {
    emoji: '📖',
    title: 'Glosario de Términos Clave',
    value: '$17',
    color: 'from-[#3b82f6] to-[#6366f1]',
    border: 'border-blue-200',
    desc: 'Los 80+ conceptos que sí o sí aparecen en el examen. Definiciones exactas del syllabus oficial con ejemplos de cómo el examen los usa en preguntas.',
    items: ['80+ términos del syllabus oficial', 'Acrónimos y siglas explicados', 'Confusiones más frecuentes', 'Tarjetas de repaso incluidas'],
  },
  {
    emoji: '👥',
    title: 'Acceso Grupo Privado',
    value: '$53',
    color: 'from-[#10b981] to-[#059669]',
    border: 'border-green-200',
    desc: 'Comunidad exclusiva de candidatos y certificados ITIL 4. Resuelve dudas, comparte avances y accede a recursos adicionales de la comunidad.',
    items: ['Grupo privado de estudio', 'Preguntas respondidas por certificados', 'Actualizaciones del syllabus', 'Soporte directo por WhatsApp'],
  },
];

function BonusGrid({ onBuy }: { onBuy: () => void }) {
  const { ref, visible } = useReveal();
  return (
    <section id="bonuses" ref={ref} className="py-20 bg-linear-to-b from-[#faf5ff] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-sm font-semibold mb-4 tracking-wide">
            Bonuses Incluidos — Sin costo adicional
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            3 Regalos que Aceleran tu Preparación
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            Valor total de los bonuses: <span className="font-bold text-[#1A1A1A]">$97</span>. Incluidos con tu compra del libro.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {BONUSES.map((b, i) => (
            <div
              key={b.title}
              className={`group bg-white rounded-2xl border-2 ${b.border} p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${b.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{b.emoji}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-gray-400 line-through">Valor normal</span>
                  <span className="text-xl font-extrabold text-[#FF6B35]">{b.value}</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>{b.title}</h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed flex-1" style={{ fontFamily: "'Open Sans', sans-serif" }}>{b.desc}</p>
              <ul className="space-y-2">
                {b.items.map(it => (
                  <li key={it} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <span className="text-green-600 text-[10px] font-bold">✓</span>
                    </span>
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Value stack */}
        <div className={`mt-14 max-w-lg mx-auto bg-linear-to-br from-[#0a0014] to-[#1a0033] rounded-2xl p-8 text-center transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-gray-400 text-sm mb-4 uppercase tracking-widest">Lo que obtienes hoy</p>
          <div className="space-y-2 text-left mb-6">
            {[
              { label: 'Libro ITIL 4 Foundation (+380 pág.)', price: '$97' },
              { label: 'Checklist 7 Días',                   price: '$27' },
              { label: 'Glosario de Términos',               price: '$17' },
              { label: 'Grupo Privado',                      price: '$53' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">✓ {row.label}</span>
                <span className="text-gray-500 text-sm line-through">{row.price}</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="text-white font-bold">Total valor</span>
              <span className="text-gray-400 line-through text-lg">$194</span>
            </div>
          </div>
          <div className="mb-6">
            <span className="text-gray-400 text-sm block mb-1">Tu inversión hoy</span>
            <span className="text-5xl font-extrabold text-white">$37</span>
          </div>
          <button
            onClick={onBuy}
            className="w-full py-4 rounded-xl bg-linear-to-r from-[#FF6B35] to-[#e85520] text-white font-bold text-lg hover:shadow-orange-500/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
          >
            ¡Quiero Todo Esto Ahora!
          </button>
          <p className="text-gray-500 text-xs mt-3">✓ Entrega instantánea Kindle · ✓ Compra segura en Amazon</p>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────
function CTASection({ onBuy, onSample }: { onBuy: () => void; onSample: () => void }) {
  const { ref, visible } = useReveal();
  return (
    <section ref={ref} className="py-24 bg-linear-to-br from-[#0a0014] via-[#1a0033] to-[#2d0060] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-100 h-100 rounded-full bg-[#6B2D91] opacity-30 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-100 h-100 rounded-full bg-[#FF6B35] opacity-10 blur-3xl" />
      </div>
      <div className={`relative z-10 max-w-2xl mx-auto px-4 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          ))}
        </div>
        <p className="text-gray-300 italic text-sm mb-8">
          "Aprobé con 87%. Las explicaciones del solucionario son lo que realmente marca la diferencia."
          <br /><span className="text-gray-400 not-italic">— Carlos R., IT Service Manager, Lima</span>
        </p>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Todo Este Contenido
          <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#c084fc] to-[#FF6B35]">
            por Solo $37
          </span>
        </h2>
        <p className="text-gray-400 mb-2">
          <span className="line-through text-gray-500 text-lg">$97</span>
          <span className="ml-2 text-white font-bold text-2xl">$37</span>
          <span className="ml-2 px-2 py-0.5 rounded bg-[#FF6B35]/20 text-[#FF6B35] text-xs font-bold">-62%</span>
        </p>
        <p className="text-gray-500 text-sm mb-10">Precio especial por tiempo limitado — Edición 2024–2026</p>

        <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
          <Shield className="w-8 h-8 text-green-400 shrink-0" />
          <div className="text-left">
            <p className="text-white font-bold text-sm">Garantía de 7 días sin preguntas</p>
            <p className="text-gray-400 text-xs">Si no estás satisfecho, te devolvemos el dinero.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onBuy}
            className="group flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-linear-to-r from-[#FF6B35] to-[#e85520] text-white font-bold text-xl shadow-lg hover:shadow-orange-500/40 hover:scale-105 transition-all duration-200"
          >
            ¡Quiero Certificarme!
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onSample}
            className="flex items-center justify-center gap-2 px-8 py-5 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all duration-200"
          >
            <Download className="w-5 h-5" />
            Ver Demo Gratis
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-8 text-xs text-gray-500">
          <span>🔒 Compra 100% segura en Amazon</span>
          <span>📥 Entrega instantánea Kindle</span>
          <span>📧 Soporte por email</span>
          <span>🔄 Actualizaciones incluidas</span>
        </div>
      </div>
    </section>
  );
}

// ─── Sticky mobile CTA ────────────────────────────────────────────────────────
function StickyMobileCTA({ onBuy }: { onBuy: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handler = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return (
    <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/95 backdrop-blur border-t border-gray-200 shadow-2xl transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full'}`}>
      <button
        onClick={onBuy}
        className="w-full py-4 rounded-xl bg-linear-to-r from-[#FF6B35] to-[#e85520] text-white font-bold text-base shadow-lg"
      >
        Comprar Ahora — $37 · Descarga Inmediata
      </button>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0a0014] py-10 px-4 text-center">
      <p className="text-gray-500 text-sm">
        © {new Date().getFullYear()} Ing. Max Escobari Quiroga ·{' '}
        <a href="mailto:soporte@mescobari.com" className="text-[#8B5CF6] hover:underline">soporte@mescobari.com</a>
      </p>
      <p className="text-gray-600 text-xs mt-2">
        ITIL® es marca registrada de AXELOS Limited. Sin afiliación oficial.
      </p>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ContentPage() {
  const navigate = useNavigate();

  const handleBuy = () => window.open(AMAZON_KDP_URL, '_blank', 'noopener,noreferrer');

  const handleSample = () => {
    navigate('/itil4');
    setTimeout(() => {
      document.getElementById('lead-capture')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  return (
    <div className="min-h-screen font-sans">
      <ReadingProgress />
      <Navbar onBuy={handleBuy} />
      <HeroSection onBuy={handleBuy} onSample={handleSample} />
      <ChapterCards onBuy={handleBuy} />
      <ContentAccordion />
      <BonusGrid onBuy={handleBuy} />
      <CTASection onBuy={handleBuy} onSample={handleSample} />
      <Footer />
      <StickyMobileCTA onBuy={handleBuy} />
    </div>
  );
}
