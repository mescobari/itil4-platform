import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useCountdown } from '../hooks/useCountdown';
import { useTypewriter } from '../hooks/useTypewriter';
import { AMAZON_KDP_URL } from '../lib/config';
import { ScrollToTopButton } from '../components/ScrollToTopButton';

// ─── Utility: scroll-reveal hook ─────────────────────────────────────────────
function useReveal(threshold = 0.15) {
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

// ─── HERO SECTION ─────────────────────────────────────────────────────────────
function HeroSection({ onOpenModal }: { onOpenModal: () => void }) {
  const timeLeft = useCountdown(23);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section
      id="hero"
      className="relative min-h-screen bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#2d0060] overflow-hidden"
    >
      {/* Geometric background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#6B2D91] opacity-20 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#8B5CF6] opacity-15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-[#FF6B35] opacity-5 blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        {/* Badge */}
        <div
          className={`flex justify-center mb-6 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
        >
          <span className="itil-pulse inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF6B35]/20 border border-[#FF6B35]/40 text-[#FF6B35] text-sm font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#FF6B35] inline-block animate-pulse" />
            Edición 2024–2026 · Precio Especial Limitado
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT: Text */}
          <div>
            <h1
              className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 transition-all duration-900 delay-200 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Aprueba tu{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#FF6B35]">
                Certificación ITIL&nbsp;4 Foundation
              </span>{' '}
              en 4 Semanas
              <span className="text-[#FF6B35]"> — Garantizado</span>
            </h1>

            <p
              className={`text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed transition-all duration-700 delay-400 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
              La guía completa con <strong className="text-white">40 exámenes tipo resueltos</strong>, explicaciones detalladas y un plan de estudio probado para aprobar a la primera.
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-4 mb-10 transition-all duration-700 delay-600 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
              <a
                href={AMAZON_KDP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="itil-btn-primary flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#FF6B35] text-white font-bold text-lg shadow-lg shadow-[#FF6B35]/30 hover:bg-[#e85a25] hover:scale-105 hover:shadow-xl transition-all duration-200 min-h-[52px]"
              >
                🚀 ¡Quiero Certificarme Ahora!
              </a>
              <button
                onClick={onOpenModal}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-[#8B5CF6] text-[#8B5CF6] font-bold text-lg hover:bg-[#8B5CF6]/10 hover:scale-105 transition-all duration-200 min-h-[52px]"
              >
                📥 Descargar Muestras Gratis
              </button>
            </div>

            {/* Secondary CTA: ya compraste el libro → activa el simulador */}
            <div className={`text-sm transition-all duration-700 delay-650 ${heroVisible ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-gray-400">¿Ya compraste el libro? </span>
              <Link to="/get-code" className="text-[#FF6B35] font-semibold hover:underline">
                Obtén tu código de simulador →
              </Link>
            </div>

            {/* Countdown */}
            <div
              className={`transition-all duration-700 delay-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <p className="text-gray-400 text-sm mb-3 font-medium tracking-wide uppercase">⏱ Oferta especial termina en:</p>
              <div className="flex gap-3">
                {[
                  { label: 'Horas', value: timeLeft.hours },
                  { label: 'Min', value: timeLeft.minutes },
                  { label: 'Seg', value: timeLeft.seconds },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black text-white backdrop-blur-sm tabular-nums">
                      {pad(value)}
                    </div>
                    <span className="text-xs text-gray-400 mt-1">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Floating book */}
          <div
            className={`flex justify-center items-center transition-all duration-1000 delay-300 ${heroVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
          >
            <div className="relative">
              {/* Glow rings */}
              <div className="absolute inset-[-20px] rounded-3xl bg-gradient-to-r from-[#6B2D91]/40 to-[#8B5CF6]/40 blur-xl" />
              <div className="absolute inset-[-40px] rounded-3xl bg-gradient-to-r from-[#8B5CF6]/20 to-[#FF6B35]/20 blur-2xl" />
              {/* Book */}
              <div className="itil-float relative z-10">
                <img
                  src="/images/portada2.png"
                  alt="Preparación para la Certificación Profesional en TI - Portada"
                  className="w-64 sm:w-72 lg:w-80 rounded-2xl shadow-2xl shadow-[#6B2D91]/60"
                  loading="eager"
                />
                {/* Stars */}
                <div className="absolute -top-3 -right-3 bg-[#FF6B35] rounded-full w-14 h-14 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-white font-black text-xs leading-none">⭐ 4.9</span>
                  <span className="text-white text-[9px]">+1000 alumnos</span>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -left-6 top-12 bg-white rounded-xl px-3 py-2 shadow-xl border border-gray-100 itil-float-delayed">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-xs font-bold text-gray-800">40 Exámenes</p>
                    <p className="text-xs text-gray-500">tipo resueltos</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 bottom-16 bg-white rounded-xl px-3 py-2 shadow-xl border border-gray-100 itil-float-slow">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Plan 4 Semanas</p>
                    <p className="text-xs text-gray-500">probado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social proof bar */}
        <div
          className={`mt-16 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center transition-all duration-700 delay-900 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {[
            { icon: '👥', value: '+1,000', label: 'Profesionales certificados' },
            { icon: '⭐', value: '4.9/5', label: 'Calificación promedio' },
            { icon: '📖', value: '40', label: 'Exámenes tipo resueltos' },
            { icon: '🏆', value: '94%', label: 'Tasa de aprobación' },
          ].map(({ icon, value, label }) => (
            <div key={label}>
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── LEAD CAPTURE SECTION ─────────────────────────────────────────────────────
interface LeadFormProps {
  onSuccess: () => void;
  compact?: boolean;
  buttonText?: string;
}

function LeadForm({ onSuccess, compact = false, buttonText = '¡Enviar mis PDFs Gratis!' }: LeadFormProps) {
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', timeline: '', consent: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError('Por favor completa nombre y email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Ingresa un email válido.'); return; }
    setError('');
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200)); // simulate API
    setSubmitting(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulario de registro para PDFs gratis">
      {!compact && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lead-name" className="block text-sm font-semibold text-gray-700 mb-1">Nombre completo *</label>
            <input
              id="lead-name"
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all duration-200 text-sm min-h-[44px]"
            />
          </div>
          <div>
            <label htmlFor="lead-email" className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
            <input
              id="lead-email"
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all duration-200 text-sm min-h-[44px]"
            />
          </div>
        </div>
      )}

      {compact && (
        <div>
          <label htmlFor="lead-email-compact" className="block text-sm font-semibold text-gray-700 mb-1">Tu email</label>
          <input
            id="lead-email-compact"
            type="email"
            required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="tu@email.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all duration-200 text-sm min-h-[44px]"
          />
        </div>
      )}

      {!compact && (
        <div>
          <label htmlFor="lead-whatsapp" className="block text-sm font-semibold text-gray-700 mb-1">
            WhatsApp <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
              +
            </span>
            <input
              id="lead-whatsapp"
              type="tel"
              value={form.whatsapp}
              onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
              placeholder="591 70000000"
              className="w-full px-4 py-3 rounded-r-xl border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all duration-200 text-sm min-h-[44px]"
            />
          </div>
        </div>
      )}

      {!compact && (
        <>
          <div>
            <label htmlFor="lead-timeline" className="block text-sm font-semibold text-gray-700 mb-1">¿Cuándo planeas presentar tu examen?</label>
            <select
              id="lead-timeline"
              value={form.timeline}
              onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none bg-white transition-all duration-200 text-sm min-h-[44px]"
            >
              <option value="">Selecciona una opción...</option>
              <option value="1month">En 1 mes</option>
              <option value="2-3months">En 2–3 meses</option>
              <option value="4-6months">En 4–6 meses</option>
              <option value="exploring">Solo explorando</option>
            </select>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="lead-consent"
              type="checkbox"
              checked={form.consent}
              onChange={e => setForm(f => ({ ...f, consent: e.target.checked }))}
              className="mt-1 w-4 h-4 accent-[#8B5CF6] cursor-pointer"
            />
            <label htmlFor="lead-consent" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
              Quiero recibir consejos de estudio y ofertas especiales
            </label>
          </div>
        </>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#6B2D91] to-[#8B5CF6] text-white font-bold text-base hover:from-[#5a2478] hover:to-[#7c3aed] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed min-h-[52px]"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Enviando...
          </span>
        ) : buttonText}
      </button>

      <p className="text-center text-xs text-gray-500">🔒 Tu información está 100% segura. Sin spam.</p>
    </form>
  );
}

function LeadCaptureSection({ onSuccess }: { onSuccess: () => void }) {
  const { ref, visible } = useReveal();
  return (
    <section id="lead-capture" className="py-20 bg-gradient-to-br from-[#F3EEFF] to-[#EDE9FE]">
      <div ref={ref} className={`max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1 rounded-full bg-[#8B5CF6]/20 text-[#6B2D91] text-sm font-semibold mb-4">¿Aún no estás seguro?</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1F2937] mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Descarga <span className="text-[#6B2D91]">GRATIS</span> y Compruébalo Tú Mismo
          </h2>
          <p className="text-gray-600 text-lg">Dos recursos de estudio de alto valor — sin costo ni compromiso</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          {[
            { icon: '📋', title: 'Checklist de los 7 Días Previos al Examen', desc: 'El plan exacto para los últimos 7 días antes de tu certificación', value: '$27', color: 'from-[#6B2D91] to-[#8B5CF6]' },
            { icon: '📖', title: 'Guía de Términos y Definiciones Clave de ITIL 4', desc: 'El glosario completo con los 80+ términos que aparecen en el examen', value: '$17', color: 'from-[#FF6B35] to-[#f59e0b]' },
          ].map(lead => (
            <div key={lead.title} className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${lead.color} flex items-center justify-center text-2xl mb-4`}>{lead.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2 text-base leading-snug">{lead.title}</h3>
              <p className="text-gray-500 text-sm mb-3">{lead.desc}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 line-through">{lead.value} USD</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">GRATIS</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-100">
          <h3 className="text-xl font-bold text-center text-gray-900 mb-6">
            Recibe ambos PDFs — Ingresa tus datos aquí 👇
          </h3>
          <LeadForm onSuccess={onSuccess} />
        </div>
      </div>
    </section>
  );
}

// ─── PROBLEM SECTION ──────────────────────────────────────────────────────────
function ProblemSection() {
  const { ref, visible } = useReveal();
  const typeText = useTypewriter('¿Te sientes identificado con esto?', 65, visible ? 0 : 99999999);

  const pains = [
    { icon: '😓', title: 'Estudias horas pero no sabes si estás preparado', desc: 'Sin una guía estructurada, el estudio se siente sin rumbo y el examen se avecina con incertidumbre.' },
    { icon: '🌀', title: 'Los conceptos de ITIL parecen abstractos', desc: 'Términos como "valor co-creado" o "prácticas de gestión" suenan bien en papel pero son difíciles de aplicar.' },
    { icon: '🔍', title: 'No encuentras material con explicaciones reales', desc: 'La mayoría del material solo tiene preguntas sin explicar el por qué de cada respuesta correcta.' },
    { icon: '😰', title: 'Temes reprobar y perder tiempo y dinero', desc: 'El examen cuesta más de $200 USD y reprobar significa volver a empezar, agotado y sin confianza.' },
  ];

  return (
    <section className="py-20 bg-[#0a0014]">
      <div ref={ref} className={`max-w-6xl mx-auto px-4 sm:px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white min-h-[2.5rem]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {visible ? typeText : ''}{visible && typeText.length < 40 && <span className="animate-pulse">|</span>}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pains.map((pain, i) => (
            <div
              key={pain.title}
              style={{ transitionDelay: `${i * 120}ms` }}
              className={`group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#8B5CF6]/40 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#6B2D91]/20 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <div className="text-4xl mb-4">{pain.icon}</div>
              <h3 className="font-bold text-white mb-2 text-sm leading-snug">{pain.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{pain.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SOLUTION SECTION ─────────────────────────────────────────────────────────
function SolutionSection() {
  const { ref, visible } = useReveal();
  const solutions = [
    'Plan de estudio semana a semana probado y optimizado',
    '40 exámenes tipo con explicaciones DETALLADAS de cada respuesta',
    'Analogías de la vida real para entender conceptos abstractos',
    'Las trampas que hacen reprobar al 68% de los candidatos — reveladas',
    'Técnicas de estudio activo que triplican la retención',
    'Estrategia para gestionar el tiempo durante el examen',
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-[#F9FAFB] to-white">
      <div ref={ref} className={`max-w-5xl mx-auto px-4 sm:px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 rounded-full bg-[#8B5CF6]/10 text-[#6B2D91] text-sm font-semibold mb-4">La solución que necesitas</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1F2937]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Imagina tener <span className="text-[#6B2D91]">todo esto</span> en un solo lugar...
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {solutions.map((item, i) => (
            <div
              key={item}
              style={{ transitionDelay: `${i * 100}ms` }}
              className={`flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#8B5CF6]/30 hover:-translate-y-1 transition-all duration-300 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6B2D91] to-[#8B5CF6] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium text-sm leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── BENEFITS SECTION ─────────────────────────────────────────────────────────
function BenefitsSection() {
  const { ref, visible } = useReveal();
  const benefits = [
    { icon: '🧠', title: 'Domina los Conceptos Clave', desc: 'Comprende la lógica detrás de cada principio ITIL con ejemplos del mundo real que hacen "click" de inmediato.' },
    { icon: '📝', title: 'Practica como en el Examen Real', desc: '40 preguntas tipo Pearson VUE con nivel de dificultad calibrado, en el mismo formato del examen oficial.' },
    { icon: '🚫', title: 'Evita los Errores que Hacen Reprobar', desc: 'Identificamos los 15 "trampas conceptuales" más frecuentes y te enseñamos a reconocerlas y evitarlas.' },
    { icon: '📅', title: 'Estudia con Método', desc: 'Plan semanal de 4 semanas con objetivos diarios claros: nada de estudiar sin dirección o agotarte sin avanzar.' },
    { icon: '💼', title: 'Desarrolla Mentalidad Profesional', desc: 'No solo apruebes el examen: adopta la filosofía ITIL que buscan las empresas y diferénciate en el mercado laboral.' },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-[#1a0033] to-[#0a0014]">
      <div ref={ref} className={`max-w-6xl mx-auto px-4 sm:px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] text-sm font-semibold mb-4">Resultados comprobados</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Lo que <span className="text-[#8B5CF6]">lograrás</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              style={{ transitionDelay: `${i * 100}ms` }}
              className={`group relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-[#8B5CF6]/40 hover:-translate-y-2 transition-all duration-300 ${i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <div className="text-4xl mb-5">{b.icon}</div>
              <h3 className="font-bold text-white mb-3 text-lg">{b.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{b.desc}</p>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-2xl rounded-tr-2xl bg-gradient-to-br from-[#6B2D91]/20 to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CONTENT SECTION ──────────────────────────────────────────────────────────
function ContentSection() {
  const { ref, visible } = useReveal();
  const [open, setOpen] = useState<number | null>(0);

  const chapters = [
    {
      num: '01', title: 'Tu Plan de Estudios — 4 Semanas',
      content: [
        'Semana 1: Fundamentos y marco conceptual de ITIL 4',
        'Semana 2: Las 4 dimensiones y el sistema de valor del servicio',
        'Semana 3: Las 14 prácticas de gestión ITIL — dominio profundo',
        'Semana 4: Repaso intensivo, simulacros y estrategia final',
        'Técnicas de memoria y retención específicas para ITIL',
        'Checklist de verificación semanal de progreso',
      ],
    },
    {
      num: '02', title: 'Fundamentos Técnicos — Los Conceptos que Más Importan',
      content: [
        'El sistema de valor del servicio (SVS) explicado con casos reales',
        'La cadena de valor del servicio: 6 actividades en profundidad',
        'Los 7 principios guía: cómo aplicarlos en situaciones de examen',
        'Diferencias entre práctica, proceso y función — confusión resuelta',
        'Tipos de valor: valor de uso, garantía y cómo reconocerlos en preguntas',
        'Gestión de relaciones, proveedores y escritorio de servicio',
      ],
    },
    {
      num: '03', title: 'Solucionario Definitivo — 40 Preguntas con Explicaciones',
      content: [
        '40 preguntas con el mismo formato y dificultad del examen oficial',
        'Explicación detallada de por qué cada opción es correcta o incorrecta',
        'Análisis de las "palabras trampa" que engañan a la mayoría',
        'Clasificadas por práctica y área del SVS para estudio focalizado',
        'Estadísticas de frecuencia: qué temas aparecen más en el examen real',
        'Técnica de eliminación: cómo elegir la mejor opción en dudas',
      ],
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div ref={ref} className={`max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 rounded-full bg-[#8B5CF6]/10 text-[#6B2D91] text-sm font-semibold mb-4">Contenido completo</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1F2937]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            ¿Qué incluye el libro?
          </h2>
        </div>

        <div className="space-y-4">
          {chapters.map((ch, i) => (
            <div key={ch.num} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors duration-200"
                aria-expanded={open === i}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B2D91] to-[#8B5CF6] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {ch.num}
                  </div>
                  <span className="font-bold text-gray-900 text-base">{ch.title}</span>
                </div>
                <svg
                  className={`w-5 h-5 text-[#6B2D91] transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                className="overflow-hidden transition-all duration-500 ease-in-out"
                style={{ maxHeight: open === i ? '400px' : '0', opacity: open === i ? 1 : 0 }}
              >
                <div className="px-6 pb-6 pt-2">
                  <ul className="space-y-2">
                    {ch.content.map(item => (
                      <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-[#6B2D91] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── AUTHOR SECTION ───────────────────────────────────────────────────────────
function AuthorSection() {
  const { ref, visible } = useReveal();
  return (
    <section className="py-20 bg-gradient-to-br from-[#1a0033] to-[#2d0060]">
      <div ref={ref} className={`max-w-5xl mx-auto px-4 sm:px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Author photo */}
          <div className="flex-shrink-0 text-center">
            <div className="relative inline-block">
              <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-[#6B2D91] to-[#8B5CF6] flex items-center justify-center shadow-2xl overflow-hidden">
                <img
                  src="/images/about-1.jpg"
                  alt="Ing. Max Escobari Quiroga"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-6xl">👨‍💼</div>
              </div>
              <div className="absolute -bottom-3 -right-3 bg-[#FF6B35] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                ITIL® Certified
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2">
              {[
                'ITIL® Foundation',
                'Google Project Mgmt',
                '+30 años experiencia',
              ].map(cert => (
                <div key={cert} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                  {cert}
                </div>
              ))}
            </div>
          </div>

          {/* Author bio */}
          <div>
            <span className="inline-block px-4 py-1 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] text-sm font-semibold mb-4">Sobre el autor</span>
            <h2 className="text-3xl font-extrabold text-white mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Ing. Max Escobari Quiroga
            </h2>
            <p className="text-gray-300 text-base leading-relaxed mb-4">
              Profesional certificado ITIL® Foundation con más de <strong className="text-white">30 años de experiencia</strong> liderando proyectos tecnológicos en banca, energía, salud y desarrollo social en Latinoamérica.
            </p>
            <p className="text-gray-300 text-base leading-relaxed mb-4">
              Ha dirigido proyectos estratégicos en instituciones como el Banco Central de Bolivia y YPFB, y hoy se dedica a <strong className="text-white">compartir su conocimiento</strong> para que otros profesionales puedan acelerar su carrera.
            </p>
            <p className="text-gray-300 text-base leading-relaxed mb-6">
              Esta guía nació de la frustración de ver colegas brillantes reprobar el examen ITIL por falta de material práctico y bien explicado. <em className="text-[#8B5CF6]">"Quería crear el recurso que yo hubiera querido tener al certificarme."</em>
            </p>

            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '+30', label: 'Años experiencia' },
                { value: '+50', label: 'Proyectos TI' },
                { value: '5★', label: 'Calificación' },
              ].map(stat => (
                <div key={stat.label} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-black text-[#8B5CF6]">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS SECTION ─────────────────────────────────────────────────────
function TestimonialsSection() {
  const { ref, visible } = useReveal();
  const [current, setCurrent] = useState(0);

  const testimonials = [
    {
      name: 'Carlos R.', role: 'IT Service Manager · Lima, Perú', img: '/images/testimonial-1.jpg',
      text: 'Estudié con este libro durante 4 semanas y aprobé con 87%. La estructura del plan de estudio es perfecta. Las explicaciones de cada pregunta son lo que realmente marca la diferencia — entiendes por qué está bien o mal, no solo memorizar.',
      stars: 5,
    },
    {
      name: 'Mariela G.', role: 'Analista de Soporte · Bogotá, Colombia', img: '/images/testimonial-2.jpg',
      text: 'Había intentado estudiar con otros materiales y me sentía perdida. Con esta guía, los conceptos abstractos de ITIL por fin hicieron sentido. Las analogías de la vida cotidiana son geniales. ¡Aprobé a la primera!',
      stars: 5,
    },
    {
      name: 'Luis A.', role: 'Project Manager · Buenos Aires, Argentina', img: '/images/testimonial-3.jpg',
      text: 'El solucionario con 40 preguntas es INVALUABLE. Cada explicación me mostró exactamente cómo piensa el examinador. Llegué al examen real sintiéndome preparado y no fue para menos — 91 sobre 100.',
      stars: 5,
    },
  ];

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, [testimonials.length]);

  return (
    <section className="py-20 bg-[#F9FAFB]">
      <div ref={ref} className={`max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 rounded-full bg-[#8B5CF6]/10 text-[#6B2D91] text-sm font-semibold mb-4">Lo que dicen nuestros lectores</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1F2937]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Historias de Éxito Reales
          </h2>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={`transition-all duration-500 ${i === current ? 'block' : 'hidden'}`}
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <svg key={si} className="w-5 h-5 text-[#f59e0b]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed mb-6 italic">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6B2D91] to-[#8B5CF6] overflow-hidden flex-shrink-0">
                      <img src={t.img} alt={t.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{t.name}</p>
                      <p className="text-sm text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${i === current ? 'bg-[#6B2D91] scale-125' : 'bg-gray-300 hover:bg-[#8B5CF6]'}`}
                aria-label={`Testimonio ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => setCurrent(c => (c - 1 + testimonials.length) % testimonials.length)}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#6B2D91] hover:text-[#6B2D91] transition-colors duration-200"
              aria-label="Testimonio anterior"
            >
              ←
            </button>
            <button
              onClick={() => setCurrent(c => (c + 1) % testimonials.length)}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#6B2D91] hover:text-[#6B2D91] transition-colors duration-200"
              aria-label="Siguiente testimonio"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── PRICING SECTION ──────────────────────────────────────────────────────────
function PricingSection({ onOpenModal }: { onOpenModal: () => void }) {
  const { ref, visible } = useReveal();
  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#2d0060]">
      <div ref={ref} className={`max-w-3xl mx-auto px-4 sm:px-6 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <span className="inline-block px-4 py-1 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] text-sm font-semibold mb-6">Oferta por tiempo limitado</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-8" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Inversión que se Paga Sola
        </h2>

        <div className="bg-white/5 border border-white/20 backdrop-blur-sm rounded-3xl p-10 mb-8 relative overflow-hidden">
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 bg-[#FF6B35] px-6 py-2 rounded-bl-2xl text-white text-sm font-bold">
            ¡MEJOR PRECIO!
          </div>
          <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-[#8B5CF6]/20 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-3xl text-gray-500 line-through font-bold">$97 USD</span>
              <svg className="w-6 h-6 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-6xl font-black text-white itil-pulse">$37 <span className="text-2xl font-semibold text-gray-300">USD</span></span>
            </div>

            <p className="text-gray-400 mb-8">Acceso inmediato · Descarga digital · Formato PDF</p>

            <div className="grid sm:grid-cols-2 gap-3 mb-8 text-left">
              {[
                '✅ Plan de 4 semanas completo',
                '✅ 40 exámenes tipo resueltos',
                '✅ Solucionario detallado',
                '✅ Checklist 7 días previos',
                '✅ Glosario ITIL 4 completo',
                '✅ Actualizaciones futuras incluidas',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-gray-300 text-sm">{item}</div>
              ))}
            </div>

            {/* Guarantee badge */}
            <div className="flex items-center justify-center gap-4 mb-8 p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
              <div className="text-4xl">🛡️</div>
              <div className="text-left">
                <p className="text-green-400 font-bold">Garantía de 7 días — 100% devolución</p>
                <p className="text-gray-400 text-sm">Sin preguntas, sin formularios. Si no estás satisfecho, te devolvemos tu dinero.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={AMAZON_KDP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 itil-btn-primary py-4 px-6 rounded-xl bg-[#FF6B35] text-white font-bold text-lg hover:bg-[#e85a25] hover:scale-105 hover:shadow-xl transition-all duration-200 text-center min-h-[52px]"
              >
                🚀 Comprar Ahora — Acceso Inmediato
              </a>
              <button
                onClick={onOpenModal}
                className="flex-1 py-4 px-6 rounded-xl border-2 border-[#8B5CF6] text-[#8B5CF6] font-bold text-base hover:bg-[#8B5CF6]/10 hover:scale-105 transition-all duration-200 min-h-[52px]"
              >
                📥 Descargar Muestras Gratis Primero
              </button>
            </div>
          </div>
        </div>

        <p className="text-gray-500 text-sm">
          🔒 Compra segura en Amazon · Entrega instantánea en tu Kindle o app Kindle ·
          <span className="text-gray-400"> Disponible en todos los países donde opera Amazon</span>
        </p>
      </div>
    </section>
  );
}

// ─── FAQ SECTION ──────────────────────────────────────────────────────────────
function FAQSection() {
  const { ref, visible } = useReveal();
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: '¿Necesito experiencia previa en TI para estudiar con este libro?',
      a: 'No es necesario. El libro está diseñado para platicar con profesionales que se inician en ITIL y también para quienes tienen experiencia pero necesitan estructurar sus conocimientos. Las explicaciones parten desde cero y construyen comprensión progresivamente.',
    },
    {
      q: '¿Este libro está actualizado para ITIL 4?',
      a: 'Sí, completamente. El libro cubre el marco ITIL 4 Foundation (edición 2024-2026), incluido el SVS (Sistema de Valor del Servicio), las 4 dimensiones, los 7 principios guía y las 14 prácticas de gestión. Es el examen que Axelos certifica actualmente.',
    },
    {
      q: '¿Cómo recibo el libro después de comprar?',
      a: 'Inmediatamente. Recibirás un email con el enlace de descarga del PDF en los primeros 5-10 minutos. Puedes leerlo en tu computadora, tableta o celular con cualquier lector de PDF. No necesitas software especial.',
    },
    {
      q: '¿Qué pasa si ya tengo algo de conocimiento de ITIL 3?',
      a: 'Perfecto. En el libro incluimos una sección especial que resalta las diferencias clave entre ITIL v3 e ITIL 4, especialmente los cambios conceptuales que más confunden a quienes ya conocen la versión anterior. Te ayudará a "desaprender" y reaprender correctamente.',
    },
    {
      q: '¿La garantía de 7 días realmente funciona?',
      a: 'Absolutamente. Si por cualquier razón no estás satisfecho con el material en los primeros 7 días de tu compra, envíanos un email a soporte@mescobari.com con tu nombre y email de compra, y procesamos la devolución completa sin preguntas. Sin formularios complicados.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div ref={ref} className={`max-w-3xl mx-auto px-4 sm:px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1F2937]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Preguntas Frecuentes
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden hover:border-[#8B5CF6]/40 transition-colors duration-200">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors duration-200"
                aria-expanded={open === i}
              >
                <span className="font-semibold text-gray-900 text-base pr-4">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-[#6B2D91] flex-shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className="overflow-hidden transition-all duration-500"
                style={{ maxHeight: open === i ? '300px' : '0', opacity: open === i ? 1 : 0 }}
              >
                <p className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FINAL CTA SECTION ────────────────────────────────────────────────────────
function FinalCTASection({ onSuccess }: { onSuccess: () => void }) {
  const { ref, visible } = useReveal();
  const timeLeft = useCountdown(23);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="py-20 bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#2d0060] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-[#6B2D91]/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
      </div>

      <div ref={ref} className={`relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex justify-center gap-3 mb-8">
          {[
            { label: 'Horas', value: timeLeft.hours },
            { label: 'Min', value: timeLeft.minutes },
            { label: 'Seg', value: timeLeft.seconds },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black text-white tabular-nums">
                {pad(value)}
              </div>
              <span className="text-xs text-gray-400 mt-1">{label}</span>
            </div>
          ))}
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Tu Certificación <span className="text-[#8B5CF6]">Te Espera</span>
        </h2>

        <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
          En 4 semanas podrías estar sosteniendo tu certificación ITIL 4... 
          <br className="hidden sm:block" />
          <strong className="text-white">¿Vas a dejar pasar esta oportunidad?</strong>
        </p>

        <a
          href={AMAZON_KDP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl bg-[#FF6B35] text-white font-black text-xl itil-pulse hover:bg-[#e85a25] hover:scale-105 hover:shadow-2xl hover:shadow-[#FF6B35]/40 transition-all duration-200 mb-6 min-h-[60px]"
        >
          🏆 ¡Sí! Quiero Certificarme y Aumentar mi Salario
        </a>

        <div className="mt-12 border-t border-white/10 pt-10">
          <p className="text-gray-400 text-base mb-5">
            ¿Necesitas más tiempo? Recibe consejos gratis mientras decides
          </p>
          <div className="max-w-md mx-auto">
            <LeadForm onSuccess={onSuccess} compact buttonText="📨 Suscribirme — Es Gratis" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── STICKY TRUST BAR ─────────────────────────────────────────────────────────
function StickyTrustBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-[#1a0033]/95 backdrop-blur-md border-t border-[#6B2D91]/40 transition-all duration-500 ${show ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-6 text-sm text-gray-300 flex-wrap justify-center sm:justify-start">
          <span className="flex items-center gap-1">🔒 <span>Pago Seguro</span></span>
          <span className="flex items-center gap-1">⚡ <span>Descarga Inmediata</span></span>
          <span className="flex items-center gap-1">📱 <span>Todos los Dispositivos</span></span>
          <span className="flex items-center gap-1 text-[#FF6B35] font-semibold">👥 <span>+1,000 certificados</span></span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl border border-[#8B5CF6] text-[#8B5CF6] text-sm font-semibold hover:bg-[#8B5CF6]/10 transition-colors duration-200"
          >
            Iniciar Sesión
          </Link>
          <a
            href={AMAZON_KDP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-xl bg-[#FF6B35] text-white font-bold text-sm hover:bg-[#e85a25] hover:scale-105 transition-all duration-200"
          >
            Comprar $37 →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── LEAD MODAL ───────────────────────────────────────────────────────────────
function LeadModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-all duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Formulario de descarga de PDFs gratis"
    >
      <div className={`bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ${open ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        {/* Modal header */}
        <div className="bg-gradient-to-br from-[#6B2D91] to-[#8B5CF6] p-8 rounded-t-3xl text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-lg font-bold"
            aria-label="Cerrar modal"
          >
            ×
          </button>
          <div className="text-4xl mb-3">🎁</div>
          <h3 className="text-2xl font-extrabold mb-2">¡Dos PDFs Gratis para Ti!</h3>
          <p className="text-purple-200 text-sm">Valor total: $44 USD — Completamente gratis hoy</p>

          <div className="mt-4 space-y-2">
            {[
              '📋 Checklist de los 7 Días Previos al Examen',
              '📖 Guía de Términos y Definiciones Clave de ITIL 4',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-purple-100">
                <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-xs">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8">
          <LeadForm onSuccess={() => { onClose(); onSuccess(); }} />
        </div>
      </div>
    </div>
  );
}

// ─── THANK YOU INLINE STATE ────────────────────────────────────────────────────
function ThankYouBanner({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#6B2D91', '#8B5CF6', '#FF6B35', '#f59e0b', '#ffffff'],
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-extrabold text-[#1F2937] mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          ¡Registrado con Éxito!
        </h2>
        <p className="text-gray-600 mb-2">Revisa tu bandeja de entrada — recibirás tus PDFs en los próximos 5 minutos.</p>
        <p className="text-sm text-gray-500 mb-6">(Si no los ves, revisa Spam / Promociones)</p>

        <div className="bg-[#F3EEFF] rounded-2xl p-5 mb-6 text-left">
          <p className="text-[#6B2D91] font-bold text-sm mb-1">📚 ¿Listo para certificarte?</p>
          <p className="text-gray-700 text-sm">Consigue el libro completo en Amazon — entrega instantánea en tu Kindle o app Kindle.</p>
        </div>

        <a
          href={AMAZON_KDP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-4 rounded-xl bg-[#FF6B35] text-white font-bold text-lg hover:bg-[#e85a25] transition-colors duration-200 mb-3"
        >
          🚀 Comprar en Amazon ahora
        </a>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 transition-colors duration-200">
          No, gracias — cerrar
        </button>
      </div>
    </div>
  );
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
function SalesNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Contenido', href: '#content' },
    { label: 'Simulador', href: '#simulador' },
    { label: 'Testimonios', href: '#testimonials' },
    { label: 'Precio', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-[#0a0014]/95 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-transparent'}`}
      aria-label="Navegación principal"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6B2D91] to-[#8B5CF6] flex items-center justify-center text-white font-black text-xs">ME</div>
          <span className="text-white font-bold text-sm hidden sm:block" style={{ fontFamily: "'Montserrat', sans-serif" }}>Max Escobari</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-gray-300 hover:text-white text-sm font-medium transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl border border-[#8B5CF6]/60 text-[#8B5CF6] text-sm font-semibold hover:bg-[#8B5CF6]/10 transition-colors duration-200"
          >
            Iniciar Sesión
          </Link>
          <a
            href={AMAZON_KDP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-xl bg-[#FF6B35] text-white font-bold text-sm hover:bg-[#e85a25] hover:scale-105 transition-all duration-200"
          >
            Comprar $37
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(m => !m)}
          className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 bg-[#0a0014]/98 border-t border-white/10 ${menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 py-4 space-y-3">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="block text-gray-300 hover:text-white font-medium py-2 transition-colors duration-200"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="py-3 rounded-xl border border-[#8B5CF6] text-[#8B5CF6] font-semibold text-sm text-center"
            >
              Iniciar Sesión
            </Link>
            <a
              href={AMAZON_KDP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 rounded-xl bg-[#FF6B35] text-white font-bold text-sm text-center"
              onClick={() => setMenuOpen(false)}
            >
              Comprar $37
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─── FOOTER SIMPLE ────────────────────────────────────────────────────────────
function SalesFooter() {
  return (
    <footer className="bg-[#0a0014] border-t border-white/10 py-10 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B2D91] to-[#8B5CF6] flex items-center justify-center text-white font-black text-sm mx-auto mb-4">ME</div>
        <p className="text-gray-400 text-sm mb-4">
          © {new Date().getFullYear()} Ing. Max Escobari Quiroga — Todos los derechos reservados
        </p>
        <p className="text-gray-600 text-xs mb-4">
          ITIL® es una marca registrada de AXELOS Limited. Este producto no está endosado ni afiliado a AXELOS Limited.
        </p>
        <div className="flex justify-center gap-6 text-xs text-gray-500">
          <a href="#" className="hover:text-gray-300 transition-colors">Términos de Servicio</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Política de Privacidad</a>
          <a href="mailto:soporte@mescobari.com" className="hover:text-gray-300 transition-colors">Soporte</a>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
// ─── ACTIVATE SIMULATOR SECTION ───────────────────────────────────────────────
function SimulatorAccessSection() {
  const steps = [
    {
      n: 1,
      title: 'Compra el libro en Amazon',
      body: 'Adquiere "ITIL 4 Foundation: Guía Completa de Certificación" en Amazon Kindle. Dentro del libro encontrarás las instrucciones para acceder al simulador.',
      icon: '📚',
    },
    {
      n: 2,
      title: 'Solicita tu código',
      body: 'Visita esta página, ingresa tu email y responde 3 preguntas cortas sobre el libro. Si las aciertas, recibirás un código único de acceso por correo.',
      icon: '🔑',
    },
    {
      n: 3,
      title: 'Crea tu cuenta y practica',
      body: 'El email tiene un link directo al registro con tu código pre-llenado. Crea tu contraseña y entra al simulador en modo Práctica o Examen.',
      icon: '🎯',
    },
  ];

  return (
    <section
      id="simulador"
      className="relative py-20 px-4 bg-gradient-to-b from-[#0a0014] via-[#1a0033] to-[#0a0014] overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#6B2D91] opacity-20 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#FF6B35]/15 border border-[#FF6B35]/30 text-[#FF6B35] text-xs font-bold tracking-wider uppercase mb-4">
            Bonus incluido con tu compra
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Accede al Simulador de Examen
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Si ya compraste el libro, tienes acceso GRATIS al simulador online — 38 preguntas tipo
            examen con justificaciones detalladas, en modo Práctica o Examen cronometrado.
          </p>
        </div>

        {/* Pasos */}
        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          {steps.map((s) => (
            <div
              key={s.n}
              className="relative rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-[#FF6B35]/40 hover:bg-white/[0.07] transition-all duration-200"
            >
              <div className="absolute -top-4 -left-2 w-10 h-10 rounded-full bg-[#FF6B35] text-white font-extrabold flex items-center justify-center text-lg shadow-lg shadow-[#FF6B35]/30">
                {s.n}
              </div>
              <div className="text-4xl mb-3">{s.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* CTAs principales */}
        <div className="rounded-2xl bg-gradient-to-r from-[#6B2D91]/30 to-[#FF6B35]/20 border border-[#FF6B35]/30 p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <div>
              <h3 className="text-white font-extrabold text-xl mb-1">¿Ya compraste el libro?</h3>
              <p className="text-gray-300 text-sm">
                Solicita tu código de acceso ahora. Respondes 3 preguntas, recibes el código por email
                y activas tu cuenta en menos de 2 minutos.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/get-code"
                className="flex-1 px-6 py-4 rounded-xl bg-[#FF6B35] text-white font-bold text-center hover:bg-[#e85a25] hover:scale-[1.02] transition-all duration-200 shadow-lg shadow-[#FF6B35]/30"
              >
                🔑 Solicitar mi código
              </Link>
              <Link
                to="/login"
                className="flex-1 px-6 py-4 rounded-xl border-2 border-white/30 text-white font-bold text-center hover:bg-white/10 hover:border-white/50 transition-all duration-200"
              >
                Ya tengo cuenta →
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ enlace */}
        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Aún no compraste el libro?{' '}
          <a href="#pricing" className="text-[#8B5CF6] hover:text-[#FF6B35] font-semibold transition-colors">
            Ver opciones de compra →
          </a>
        </p>
      </div>
    </section>
  );
}

export function ITIL4SalesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [thankYouOpen, setThankYouOpen] = useState(false);

  const handleLeadSuccess = useCallback(() => {
    setThankYouOpen(true);
  }, []);

  const handleCloseThankYou = useCallback(() => {
    setThankYouOpen(false);
  }, []);

  return (
    <div className="itil4-page" style={{ fontFamily: "'Open Sans', sans-serif" }}>
      {/* Navigation */}
      <SalesNav />

      {/* Main sections */}
      <main>
        <HeroSection onOpenModal={() => setModalOpen(true)} />
        <LeadCaptureSection onSuccess={handleLeadSuccess} />
        <ProblemSection />
        <SolutionSection />
        <BenefitsSection />
        <section id="content"><ContentSection /></section>
        <AuthorSection />
        <section id="testimonials"><TestimonialsSection /></section>
        <PricingSection onOpenModal={() => setModalOpen(true)} />
        <SimulatorAccessSection />
        <section id="faq"><FAQSection /></section>
        <FinalCTASection onSuccess={handleLeadSuccess} />
      </main>

      <SalesFooter />

      {/* Sticky bar */}
      <StickyTrustBar />

      {/* Scroll to top */}
      <ScrollToTopButton />

      {/* Lead capture modal */}
      <LeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleLeadSuccess}
      />

      {/* Thank you overlay */}
      {thankYouOpen && <ThankYouBanner onClose={handleCloseThankYou} />}
    </div>
  );
}
