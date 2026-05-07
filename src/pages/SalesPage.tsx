import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Shield, Star, CheckCircle2, Clock, BookOpen, Award, Users, Zap } from 'lucide-react';
import { getLeadCount } from '../lib/api';
import { AMAZON_KDP_URL } from '../lib/config';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface FAQ { q: string; a: string; }

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function SalesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [leadsCount, setLeadsCount] = useState(1843);

  useEffect(() => {
    getLeadCount().then(d => setLeadsCount(d.total)).catch(() => {});
    window.scrollTo(0, 0);
  }, []);

  const goCheckout = () =>
    window.open(AMAZON_KDP_URL, '_blank', 'noopener,noreferrer');

  const FAQS: FAQ[] = [
    {
      q: '¿Necesito experiencia previa en TI para aprovechar este libro?',
      a: 'No. El libro está diseñado para profesionales con cualquier nivel de experiencia. Comenzamos desde los conceptos fundamentales de ITIL 4 y avanzamos de manera progresiva, con ejemplos del mundo real que cualquier profesional puede entender y aplicar.',
    },
    {
      q: '¿Cuánto tiempo necesito estudiar para aprobar el examen?',
      a: 'La mayoría de nuestros lectores aprueba en 4–6 semanas estudiando entre 1 y 2 horas diarias. Incluimos un plan de estudio de 7 semanas detallado dentro del libro que optimiza tu tiempo de preparación.',
    },
    {
      q: '¿El libro está actualizado con el syllabus oficial más reciente?',
      a: 'Sí. Está completamente alineado con el marco ITIL 4 Foundation publicado por Axelos y actualizado con los cambios del syllabus vigente. Cada capítulo refleja los objetivos de aprendizaje oficiales del examen.',
    },
    {
      q: '¿Qué pasa si el libro no me ayuda a aprobar?',
      a: 'Tienes 7 días de garantía total sin preguntas. Si no estás satisfecho por cualquier razón, te devolvemos el 100% de tu inversión. Nuestro riesgo, no el tuyo.',
    },
    {
      q: '¿Puedo leerlo en mi tablet o smartphone?',
      a: 'El libro se entrega en formato PDF de alta calidad, compatible con cualquier dispositivo: computadora, tablet, smartphone o e-reader. Una vez descargado, puedes leerlo sin conexión a internet.',
    },
    {
      q: '¿El precio incluye las actualizaciones futuras?',
      a: 'Sí. Recibirás notificación por correo para descargar cualquier actualización que publiquemos, sin costo adicional, por los próximos 12 meses.',
    },
  ];

  return (
    <div style={{ background: '#0a0014', fontFamily: "'Open Sans', sans-serif", color: '#f0e6ff' }}>

      {/* ── Barra de urgencia ───────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(90deg, #6B2D91, #8B5CF6)', padding: '10px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#fff', letterSpacing: '0.5px' }}>
          🔥 OFERTA ESPECIAL — Precio de lanzamiento $37 USD · Solo por tiempo limitado
        </p>
      </div>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px 60px', maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{ display: 'inline-block', background: 'rgba(107,45,145,0.25)', border: '1px solid #8B5CF6', borderRadius: '100px', padding: '6px 20px', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            ✦ Guía Oficial de Preparación ITIL 4 Foundation ✦
          </span>
        </div>

        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '24px', color: '#fff' }}>
          Consigue tu Certificación ITIL 4 Foundation<br />
          <span style={{ color: '#c084fc' }}>en 6 Semanas o Menos</span> —<br />
          Aunque Nunca Hayas Oído Hablar de ITIL
        </h1>

        <p style={{ fontSize: '1.25rem', lineHeight: 1.7, color: '#d4b8f0', marginBottom: '36px', maxWidth: '680px', margin: '0 auto 36px' }}>
          El método paso a paso que usaron <strong style={{ color: '#fff' }}>{leadsCount.toLocaleString()}+ profesionales de TI</strong> para dominar ITIL 4, aprobar el examen a la primera y conseguir un aumento de sueldo.
        </p>

        {/* Imagen principal – portada del libro */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <img
            src="/images/portada2.png"
            alt="Libro ITIL 4 Foundation – Guía de Certificación"
            style={{ width: '280px', borderRadius: '12px', boxShadow: '0 30px 80px rgba(139,92,246,0.45)', animation: 'itil-float 3s ease-in-out infinite' }}
          />
        </div>

        {/* CTA principal */}
        <button onClick={goCheckout} className="itil-btn-primary" style={{ fontSize: '1.2rem', padding: '20px 48px', borderRadius: '12px', marginBottom: '16px' }}>
          SÍ, QUIERO CERTIFICARME AHORA →
        </button>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>
          💳 Pago 100% seguro · 🔒 SSL · ✅ Garantía 7 días · 📥 Descarga inmediata
        </p>
      </section>

      {/* ── PRUEBA SOCIAL ────────────────────────────────────────────────────── */}
      <section style={{ padding: '40px 20px', background: 'rgba(107,45,145,0.08)', borderTop: '1px solid rgba(139,92,246,0.15)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px' }}>
          {[
            { icon: <Users size={28} color="#c084fc"/>, label: `${leadsCount.toLocaleString()}+`, sub: 'Profesionales preparados' },
            { icon: <Star size={28} color="#fbbf24"/>, label: '4.9 / 5.0', sub: 'Valoración media' },
            { icon: <Award size={28} color="#34d399"/>, label: '94%', sub: 'Tasa de aprobación' },
            { icon: <Clock size={28} color="#60a5fa"/>, label: '6 semanas', sub: 'Tiempo promedio de estudio' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: '140px' }}>
              {s.icon}
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '8px 0 4px' }}>{s.label}</p>
              <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: 0 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEMA ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px', maxWidth: '760px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, textAlign: 'center', marginBottom: '48px', color: '#fff' }}>
          ¿Te Suena Familiar Alguna de Estas Situaciones?
        </h2>
        {[
          { emoji: '😤', text: 'Llevas meses postergando la certificación porque "el material es demasiado técnico y aburrido".' },
          { emoji: '💸', text: 'Has gastado en cursos caros que solo te dan slides en inglés sin explicar el "para qué sirve esto".' },
          { emoji: '😰', text: 'El día del examen llegó y fallaste — ahora tienes miedo de volver a intentarlo y "perder tiempo".' },
          { emoji: '📉', text: 'Ves colegas con ITIL Foundation cobrar 30–40% más y sentirte estancado sin entender por qué.' },
          { emoji: '🌀', text: 'Lees definiciones de ITIL y, al cerrar el libro, no recuerdas nada porque no se conectan con la realidad.' },
        ].map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '24px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{p.emoji}</span>
            <p style={{ margin: 0, lineHeight: 1.65, color: '#d4b8f0' }}>{p.text}</p>
          </div>
        ))}

        <div style={{ marginTop: '48px', padding: '28px', background: 'rgba(107,45,145,0.18)', borderRadius: '16px', borderLeft: '4px solid #8B5CF6' }}>
          <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: 1.7, color: '#e9d5ff' }}>
            <strong style={{ color: '#c084fc' }}>La verdad que nadie te dice:</strong> La mayoría de los profesionales de TI NO fallan ITIL por falta de inteligencia. Fallan por falta de un sistema de estudio probado que traduzca el marco teórico en acciones concretas y examinables. Exactamente eso es lo que este libro te da.
          </p>
        </div>
      </section>

      {/* ── SOLUCIÓN ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px', background: 'rgba(107,45,145,0.06)', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ color: '#c084fc', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>La Solución</p>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: '#fff', margin: '0 0 20px' }}>
              Presentamos: <em style={{ fontStyle: 'normal', color: '#c084fc' }}>ITIL 4 Foundation: Guía Completa de Certificación</em>
            </h2>
            <p style={{ fontSize: '1.15rem', color: '#d4b8f0', maxWidth: '620px', margin: '0 auto', lineHeight: 1.7 }}>
              El único libro en español que combina el rigor del marco oficial de Axelos con un lenguaje claro, ejemplos bolivianos y latinoamericanos, y un sistema de estudio que te lleva de cero a certificado.
            </p>
          </div>

          {/* Imagen ilustrativa – libro abierto / interior */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '56px' }}>
            <div style={{ width: '100%', maxWidth: '720px', height: '360px', background: 'rgba(107,45,145,0.15)', border: '2px dashed rgba(139,92,246,0.4)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <BookOpen size={48} color="#8B5CF6" />
              <p style={{ color: '#8B5CF6', fontWeight: 700, margin: 0 }}>Imagen 1 — 720 × 360 px</p>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>Interior del libro: doble página con diagrama ITIL 4 SVS</p>
            </div>
          </div>

          {/* Beneficios clave */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { icon: <CheckCircle2 size={22} color="#34d399"/>, title: 'Lenguaje 100% en Español', desc: 'Sin anglicismos innecesarios. Cada concepto explicado como si un experto te hablara de persona a persona.' },
              { icon: <CheckCircle2 size={22} color="#34d399"/>, title: 'Mapeo directo al Examen', desc: 'Cada capítulo señala exactamente qué preguntas del syllabus cubre, para que no pierdas tiempo.' },
              { icon: <CheckCircle2 size={22} color="#34d399"/>, title: '250+ Preguntas de Práctica', desc: 'Con respuestas explicadas. Misma dificultad y formato que el examen oficial de PeopleCert.' },
              { icon: <CheckCircle2 size={22} color="#34d399"/>, title: 'Plan de Estudio de 7 Semanas', desc: 'Calendario día a día con horas estimadas. Estudia con propósito, no al azar.' },
              { icon: <CheckCircle2 size={22} color="#34d399"/>, title: 'Casos Reales de América Latina', desc: 'Ejemplos de empresas en Bolivia, Perú, Colombia y México para conectar la teoría con tu realidad.' },
              { icon: <CheckCircle2 size={22} color="#34d399"/>, title: 'Glosario ITIL 4 Completo', desc: '150+ términos con definición oficial y explicación simplificada. El glosario que ojalá todos tuvieran.' },
            ].map((b, i) => (
              <div key={i} style={{ padding: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  {b.icon}
                  <strong style={{ fontFamily: "'Montserrat', sans-serif", color: '#fff', fontSize: '1rem' }}>{b.title}</strong>
                </div>
                <p style={{ margin: 0, color: '#b8a4cc', lineHeight: 1.6, fontSize: '0.9rem' }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTENIDO DEL LIBRO ──────────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px', maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
            Todo lo que Encuentras Dentro
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '1rem' }}>12 módulos · +380 páginas · descarga inmediata en PDF</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {[
            { num: '01', title: 'Fundamentos de Gestión de Servicios', content: 'Valor, resultados, costos y riesgos en el contexto ITIL 4.' },
            { num: '02', title: 'El Sistema de Valor del Servicio (SVS)', content: 'Cadena de valor, principios guía, gobierno y mejora continua.' },
            { num: '03', title: 'Las 4 Dimensiones de la Gestión de Servicios', content: 'Organizaciones, información, socios y flujos de valor.' },
            { num: '04', title: 'Prácticas de Gestión General (x14)', content: 'Gestión del conocimiento, proyectos, relaciones y más.' },
            { num: '05', title: 'Prácticas de Gestión de Servicios (x17)', content: 'Change, Incident, Problem, Service Desk, ITIL completo.' },
            { num: '06', title: 'Prácticas de Gestión Técnica (x3)', content: 'Gestión de la nube, infraestructura y software.' },
            { num: '07', title: 'La Cadena de Valor del Servicio', content: 'Las 6 actividades y cómo se interconectan en cada flujo.' },
            { num: '08', title: 'Mejora Continua y el Modelo ITIL', content: 'El ciclo de 7 pasos aplicado a situaciones reales.' },
            { num: '09', title: 'Principios Guía de ITIL 4', content: 'Los 7 principios con ejemplos prácticos y preguntas tipo examen.' },
            { num: '10', title: 'Simulacros de Examen Comentados', content: '5 exámenes completos de 40 preguntas con análisis detallado.' },
            { num: '11', title: 'Plan de Estudio Semana a Semana', content: 'Tu hoja de ruta de 7 semanas para llegar al examen preparado.' },
            { num: '12', title: 'Glosario Completo ITIL 4', content: '150+ definiciones oficiales con nota explicativa en español.' },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.5rem', fontWeight: 900, color: 'rgba(139,92,246,0.4)', flexShrink: 0, lineHeight: 1 }}>{m.num}</span>
              <div>
                <p style={{ fontWeight: 700, color: '#e9d5ff', margin: '0 0 4px', fontSize: '0.95rem' }}>{m.title}</p>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>{m.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AUTOR ─────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px', background: 'rgba(107,45,145,0.06)', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center' }}>
          {/* Foto autor */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: '220px', height: '220px', background: 'rgba(107,45,145,0.2)', border: '2px dashed rgba(139,92,246,0.4)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{ fontSize: '2rem' }}>👤</span>
              <p style={{ color: '#8B5CF6', fontWeight: 700, margin: 0, fontSize: '0.8rem' }}>Imagen 2 — 220 × 220 px</p>
              <p style={{ color: '#6b7280', fontSize: '0.72rem', margin: 0, textAlign: 'center' }}>Foto profesional del autor</p>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <p style={{ color: '#c084fc', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', fontSize: '0.82rem' }}>El Autor</p>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Max Escobari Q.</h2>
            <p style={{ color: '#8B5CF6', fontWeight: 600, marginBottom: '20px' }}>ITIL 4 Foundation · PRINCE2 · PMP Certified</p>
            <p style={{ lineHeight: 1.75, color: '#d4b8f0', marginBottom: '16px' }}>
              Con más de 15 años implementando marcos de trabajo de TI en empresas privadas y organismos de gobierno en Bolivia y América Latina, Max sabe exactamente dónde tropiezan los candidatos al examen ITIL.
            </p>
            <p style={{ lineHeight: 1.75, color: '#d4b8f0', marginBottom: '24px' }}>
              Ha formado a más de 2,000 profesionales de TI a través de sus cursos en línea y talleres presenciales. Este libro es la destilación de su método de preparación más efectivo.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {['ITIL 4 Certified', 'PRINCE2 Practitioner', '+2,000 alumnos', '15+ años de práctica'].map((b, i) => (
                <span key={i} style={{ padding: '6px 14px', background: 'rgba(107,45,145,0.25)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '100px', fontSize: '0.82rem', color: '#c084fc', fontWeight: 600 }}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ color: '#c084fc', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Lo que Dicen Nuestros Lectores</p>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, color: '#fff', margin: 0 }}>
            Resultados Reales de Profesionales Reales
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
          {[
            {
              img: '/images/testimonial-1.jpg',
              imgAlt: 'Carlos R.',
              name: 'Carlos R.',
              role: 'IT Manager · La Paz, Bolivia',
              text: '"Llevaba 2 años postergando la certificación. Con este libro la aprobé en 5 semanas y conseguí un ascenso dos meses después. La inversión se pagó sola diez veces."',
              stars: 5,
              placeholder: 'Imagen 3 — 80 × 80 px · Foto testimonial Carlos R.',
            },
            {
              img: '/images/testimonial-2.jpg',
              imgAlt: 'Mariela G.',
              name: 'Mariela G.',
              role: 'Service Manager · Cochabamba, Bolivia',
              text: '"El plan de 7 semanas fue lo que necesitaba. Cada día sabía exactamente qué estudiar. Aprobé con 87% en mi primer intento. Completamente recomendado."',
              stars: 5,
              placeholder: 'Imagen 4 — 80 × 80 px · Foto testimonial Mariela G.',
            },
            {
              img: '/images/testimonial-3.jpg',
              imgAlt: 'Luis A.',
              name: 'Luis A.',
              role: 'Systems Analyst · Santa Cruz, Bolivia',
              text: '"500 páginas de documentación oficial me asustaban. Max lo simplifica sin perder rigor. Los 250 simulacros de examen son oro puro. Primera clase."',
              stars: 5,
              placeholder: 'Imagen 5 — 80 × 80 px · Foto testimonial Luis A.',
            },
          ].map((t, i) => (
            <div key={i} style={{ padding: '28px', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid rgba(139,92,246,0.18)' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                {Array.from({ length: t.stars }).map((_, j) => <Star key={j} size={16} fill="#fbbf24" color="#fbbf24" />)}
              </div>
              <p style={{ color: '#e9d5ff', lineHeight: 1.7, marginBottom: '20px', fontStyle: 'italic' }}>{t.text}</p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(107,45,145,0.3)', border: '1px dashed rgba(139,92,246,0.5)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={t.img} alt={t.imgAlt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <span style={{ color: '#8B5CF6', fontSize: '10px', fontWeight: 700, display: 'none' }}>IMG</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 2px', fontSize: '0.95rem' }}>{t.name}</p>
                  <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRECIO ────────────────────────────────────────────────────────────── */}
      <section id="precio" style={{ padding: '80px 20px', background: 'rgba(107,45,145,0.08)', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#c084fc', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Tu Inversión Hoy</p>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#fff', marginBottom: '40px' }}>
            El Precio de un Café al Mes —<br />
            <span style={{ color: '#c084fc' }}>El Valor de una Carrera Transformada</span>
          </h2>

          <div style={{ background: 'linear-gradient(145deg, rgba(107,45,145,0.2), rgba(139,92,246,0.1))', border: '2px solid #8B5CF6', borderRadius: '24px', padding: '48px 36px', marginBottom: '32px' }}>
            <p style={{ color: '#9ca3af', fontSize: '1rem', marginBottom: '8px' }}>Precio regular</p>
            <p style={{ color: '#6b7280', fontSize: '1.5rem', textDecoration: 'line-through', marginBottom: '4px' }}>$97 USD</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '4.5rem', fontWeight: 900, color: '#fff', lineHeight: 1, margin: '8px 0 4px' }}>$37</p>
            <p style={{ color: '#c084fc', fontWeight: 700, marginBottom: '36px' }}>USD · Pago único · Tuyo para siempre</p>

            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '36px', textAlign: 'left' }}>
              {[
                '✅ Libro ITIL 4 Foundation completo en PDF (+380 págs)',
                '✅ Plan de estudio de 7 semanas',
                '✅ 250+ preguntas de práctica comentadas',
                '✅ Glosario ITIL 4 con 150+ términos',
                '✅ Checklist de preparación pre-examen',
                '✅ Actualizaciones gratuitas por 12 meses',
              ].map((item, i) => (
                <li key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#d4b8f0', lineHeight: 1.5, fontSize: '0.95rem' }}>{item}</li>
              ))}
            </ul>

            <button onClick={goCheckout} className="itil-btn-primary" style={{ width: '100%', fontSize: '1.2rem', padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
              QUIERO MI LIBRO AHORA — $37 USD →
            </button>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
              Compra segura en Amazon · Entrega instantánea en tu Kindle
            </p>
          </div>

          {/* Garantía */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '24px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '16px', textAlign: 'left' }}>
            <Shield size={36} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontWeight: 700, color: '#34d399', margin: '0 0 6px', fontFamily: "'Montserrat', sans-serif" }}>Garantía sin riesgo — 7 días</p>
              <p style={{ color: '#a7f3d0', margin: 0, lineHeight: 1.65, fontSize: '0.9rem' }}>
                Si en los próximos 7 días desde tu compra no estás 100% satisfecho con el libro, te devolvemos cada centavo sin preguntas. Tú no corres ningún riesgo. Nosotros sí.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARACIÓN DE VALOR ──────────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px', maxWidth: '760px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 800, textAlign: 'center', color: '#fff', marginBottom: '40px' }}>
          Compara lo que Otros Cobran
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 20px', color: '#9ca3af', fontWeight: 600 }}>Alternativa</th>
                <th style={{ textAlign: 'right', padding: '12px 20px', color: '#9ca3af', fontWeight: 600 }}>Precio</th>
                <th style={{ textAlign: 'center', padding: '12px 20px', color: '#9ca3af', fontWeight: 600 }}>Español</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Curso ITIL 4 en plataformas internacionales', price: '$299–$599', es: '❌' },
                { name: 'Curso presencial en academia local', price: '$400–$800', es: '✅' },
                { name: 'Libro oficial de Axelos (en inglés)', price: '$85', es: '❌' },
                { name: 'Examen oficial PeopleCert', price: '$320', es: '—' },
                { name: '👉 ITIL 4 Foundation: Guía Completa (este libro)', price: '$37', es: '✅', highlight: true },
              ].map((r, i) => (
                <tr key={i} style={{ background: r.highlight ? 'rgba(107,45,145,0.2)' : 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <td style={{ padding: '14px 20px', color: r.highlight ? '#e9d5ff' : '#d4b8f0', fontWeight: r.highlight ? 700 : 400, borderRadius: '8px 0 0 8px', border: r.highlight ? '1px solid #8B5CF6' : '1px solid transparent', borderRight: 'none' }}>{r.name}</td>
                  <td style={{ padding: '14px 20px', color: r.highlight ? '#c084fc' : '#9ca3af', fontWeight: r.highlight ? 900 : 400, textAlign: 'right', fontFamily: "'Montserrat', sans-serif", border: r.highlight ? '1px solid #8B5CF6' : '1px solid transparent', borderLeft: 'none', borderRight: 'none' }}>{r.price}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center', border: r.highlight ? '1px solid #8B5CF6' : '1px solid transparent', borderLeft: 'none', borderRadius: '0 8px 8px 0' }}>{r.es}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px', background: 'rgba(107,45,145,0.06)', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, textAlign: 'center', color: '#fff', marginBottom: '48px' }}>
            Preguntas Frecuentes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.18)', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: '#e9d5ff', textAlign: 'left', gap: '16px' }}
                >
                  <span style={{ fontWeight: 600, lineHeight: 1.5 }}>{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={20} style={{ flexShrink: 0, color: '#8B5CF6' }} /> : <ChevronDown size={20} style={{ flexShrink: 0, color: '#8B5CF6' }} />}
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 24px 20px', color: '#b8a4cc', lineHeight: 1.7, borderTop: '1px solid rgba(139,92,246,0.1)' }}>
                    <p style={{ margin: '16px 0 0' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 20px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(107,45,145,0.15) 0%, #0a0014 100%)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <Zap size={40} color="#fbbf24" style={{ marginBottom: '20px' }} />
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', marginBottom: '20px', lineHeight: 1.2 }}>
            Tu Certificación ITIL 4 Empieza Hoy.<br />
            <span style={{ color: '#c084fc' }}>¿Arrancamos?</span>
          </h2>
          <p style={{ fontSize: '1.15rem', color: '#d4b8f0', marginBottom: '40px', lineHeight: 1.7 }}>
            Cada día que esperas es otro día sin el certificado que te diferencia, sin el aumento que mereces, y sin la seguridad profesional que estás buscando.
          </p>
          <button onClick={goCheckout} className="itil-btn-primary" style={{ fontSize: '1.25rem', padding: '22px 56px', borderRadius: '14px', marginBottom: '20px' }}>
            QUIERO CERTIFICARME — $37 USD →
          </button>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px', color: '#6b7280', fontSize: '0.85rem' }}>
            <span>🔒 Compra segura en Amazon</span>
            <span>📥 Entrega instantánea en Kindle</span>
            <span>🛡️ Garantía Amazon</span>
            <span>✉️ Soporte por email</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer style={{ padding: '32px 20px', borderTop: '1px solid rgba(139,92,246,0.15)', textAlign: 'center' }}>
        <p style={{ color: '#4b5563', fontSize: '0.8rem', margin: 0 }}>
          © {new Date().getFullYear()} Max Escobari Q. · Todos los derechos reservados ·&nbsp;
          <a href="mailto:soporte@mescobari.com" style={{ color: '#8B5CF6', textDecoration: 'none' }}>soporte@mescobari.com</a>
        </p>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════════
          TABLA DE IMÁGENES REQUERIDAS (solo visible en modo desarrollo)
          Elimina este bloque antes de producción
      ══════════════════════════════════════════════════════════════════════════ */}
      {import.meta.env.DEV && (
        <section style={{ padding: '48px 20px', background: '#111', borderTop: '2px solid #6B2D91' }}>
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", color: '#c084fc', marginBottom: '20px' }}>📋 Tabla de Imágenes — SalesPage</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#d4b8f0' }}>
                <thead>
                  <tr style={{ background: 'rgba(107,45,145,0.3)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', border: '1px solid rgba(139,92,246,0.3)' }}>ID</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', border: '1px solid rgba(139,92,246,0.3)' }}>Dimensiones</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', border: '1px solid rgba(139,92,246,0.3)' }}>Descripción</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', border: '1px solid rgba(139,92,246,0.3)' }}>Ubicación en página</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'portada2.png', dim: '280 × 380 px', desc: 'Portada del libro (ya existe en /images/portada2.png)', sec: 'Hero — centro' },
                    { id: 'libro-interior.jpg', dim: '720 × 360 px', desc: 'Doble página del libro mostrando un diagrama SVS ITIL 4', sec: 'Sección Solución' },
                    { id: 'autor-max.jpg', dim: '220 × 220 px', desc: 'Foto profesional de Max Escobari Q., traje o business casual', sec: 'Sección Autor' },
                    { id: 'testimonial-1.jpg', dim: '80 × 80 px', desc: 'Foto de Carlos R., IT Manager (ya existe o crear avatar)', sec: 'Testimonios' },
                    { id: 'testimonial-2.jpg', dim: '80 × 80 px', desc: 'Foto de Mariela G., Service Manager (ya existe o crear avatar)', sec: 'Testimonios' },
                    { id: 'testimonial-3.jpg', dim: '80 × 80 px', desc: 'Foto de Luis A., Systems Analyst (ya existe o crear avatar)', sec: 'Testimonios' },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '10px 14px', border: '1px solid rgba(139,92,246,0.15)', fontFamily: 'monospace', color: '#c084fc' }}>{r.id}</td>
                      <td style={{ padding: '10px 14px', border: '1px solid rgba(139,92,246,0.15)' }}>{r.dim}</td>
                      <td style={{ padding: '10px 14px', border: '1px solid rgba(139,92,246,0.15)' }}>{r.desc}</td>
                      <td style={{ padding: '10px 14px', border: '1px solid rgba(139,92,246,0.15)', color: '#9ca3af' }}>{r.sec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
