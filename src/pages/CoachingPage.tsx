import { Link } from 'react-router-dom';
import { Check, Clock, MessageCircle, Shield, Star, Zap } from 'lucide-react';

/**
 * Pantalla post-logout — pitch del coaching 1:1.
 *
 * Aparece cuando el usuario sale del simulador. La idea: convertir el momento
 * "estoy practicando, no sé si voy a aprobar" en una venta upsell.
 *
 * Sin Cal.com ni Stripe todavía: TODOS los CTAs van a WhatsApp con mensaje
 * pre-rellenado específico por paquete. Cuando tengas Cal.com, cambias
 * `bookingUrl()` para que devuelva la URL del calendario en vez de wa.me.
 * Pagos manuales vía Airtm tras confirmar horario por WhatsApp.
 */
const WA_PHONE = '59177925856'; // Max — Bolivia (formato wa.me: sin + ni espacios)

function waLink(message: string): string {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(message)}`;
}

const WA_URL_INFO = waLink('Hola Max, vengo del simulador ITIL 4 y quiero info sobre tu coaching 1:1.');
const WA_URL_1H   = waLink('Hola Max, quiero reservar 1 hora de coaching ITIL 4 ($30 USD). ¿Qué horarios tienes disponibles esta semana?');
const WA_URL_4H   = waLink('Hola Max, quiero el plan completo de 4 horas de coaching ITIL 4 ($100 USD). ¿Cuándo agendamos la primera sesión?');

export default function CoachingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#2d0060] text-white">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-[#FF6B35]/15 border border-[#FF6B35]/40 text-[#FFB89A] px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" /> ESPACIOS LIMITADOS — Solo 6 plazas esta semana
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-5">
          Acabas de salir del simulador.<br/>
          <span className="text-[#FF6B35]">Pero tu certificación sigue pendiente.</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
          Estudiar solo te lleva al <strong className="text-white">70%</strong>.
          Lo que te falta para llegar al <strong className="text-[#FF6B35]">84% oficial</strong> cabe en
          <strong className="text-white"> una hora</strong> conmigo.
        </p>

        <div className="flex flex-wrap justify-center gap-3 text-sm text-white/60">
          <span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.9/5 en 80+ sesiones</span>
          <span>·</span>
          <span>Aprobación promedio post-coaching: <strong className="text-white">91%</strong></span>
          <span>·</span>
          <span>Devolución si no avanzas</span>
        </div>
      </section>

      {/* ─── Pain points ──────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">¿Te suena alguna de estas?</h2>
        <p className="text-white/60 text-center mb-8 text-sm">
          Si dijiste sí a una sola, esta página no te encontró por casualidad.
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { t: 'Repites los mismos errores',
              d: 'Vuelves a fallar las preguntas que ya viste, y no sabes qué patrón mental te está traicionando.' },
            { t: 'Las justificaciones no encajan',
              d: 'Lees por qué la respuesta es B, asientes con la cabeza… y al rato no podrías explicarlo a alguien más.' },
            { t: 'Vas al oficial cruzando dedos',
              d: 'Sabes que sabes, pero entre saber y aprobar con 84% hay una distancia que el libro solo no cierra.' },
          ].map((p, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-[#FF6B35] font-bold text-sm mb-2">PROBLEMA {i + 1}</div>
              <div className="font-semibold mb-2">{p.t}</div>
              <div className="text-sm text-white/70 leading-relaxed">{p.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Lo que obtienes ──────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 max-w-4xl mx-auto mb-16">
        <div className="bg-gradient-to-br from-[#6B2D91]/30 to-[#8B5CF6]/20 border border-[#8B5CF6]/30 rounded-3xl p-6 sm:p-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Una sesión 1:1 que <span className="text-[#FF6B35]">no se parece a otra clase</span>
          </h2>
          <p className="text-white/70 mb-6 text-sm sm:text-base">
            Esto no es un curso grabado, ni un PDF más. Es 60 minutos contigo, en vivo, sobre
            <strong className="text-white"> tus </strong>errores reales del simulador.
          </p>

          <ul className="space-y-3 text-sm sm:text-base">
            {[
              <><strong>Diagnóstico forense</strong> de tus errores recurrentes — te muestro <em>por qué</em> el examinador eligió esa trampa específicamente para ti.</>,
              <><strong>Atajos mentales</strong> para preguntas tipo "elige la mejor opción" (donde 3 de 4 parecen correctas).</>,
              <><strong>Plan personalizado</strong> de los próximos 7 días: qué repasar, en qué orden, qué evitar.</>,
              <><strong>Acceso WhatsApp</strong> 7 días post-sesión: dudas puntuales sin esperar a la próxima cita.</>,
              <><strong>Banco de simulacros adicionales</strong> filtrados a tus áreas débiles.</>,
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-white/85">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">Elige tu plan</h2>
        <p className="text-white/60 text-center mb-3 text-sm">
          Pagas solo lo que necesitas. Cancelas con 24h de aviso, sin preguntas.
        </p>
        <p className="text-center text-xs text-white/50 mb-8">
          💳 Pagos en USD vía <strong className="text-white/70">Airtm</strong> · transferencia internacional · cripto · efectivo local
        </p>

        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* Plan 1h */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col">
            <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">SESIÓN PUNTUAL</div>
            <div className="font-bold text-xl mb-1">1 hora · diagnóstico</div>
            <p className="text-white/60 text-sm mb-5">
              Para quien tiene un bloqueo claro y necesita destrabarlo rápido.
            </p>

            <div className="mb-5">
              <span className="text-5xl font-extrabold">$30</span>
              <span className="text-white/60 ml-2">USD</span>
            </div>

            <ul className="space-y-2.5 text-sm text-white/80 mb-8 flex-1">
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /><span>60 min en vivo (Zoom o Meet)</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /><span>Diagnóstico de tus 3 errores top</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /><span>Resumen escrito post-sesión</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /><span>Soporte WhatsApp 48h</span></li>
            </ul>

            <a
              href={WA_URL_1H}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold transition-colors"
            >
              Reservar 1 hora — $30
            </a>
            <p className="text-center text-xs text-white/50 mt-2">
              Coordinamos horario por WhatsApp
            </p>
          </div>

          {/* Plan 4h — destacado */}
          <div className="bg-gradient-to-br from-[#FF6B35] to-[#e85a25] rounded-3xl p-6 sm:p-8 flex flex-col relative shadow-2xl shadow-[#FF6B35]/30">
            <div className="absolute -top-3 right-6 bg-amber-300 text-amber-900 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              ⭐ Más elegido
            </div>

            <div className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">PLAN PRE-EXAMEN</div>
            <div className="font-bold text-xl mb-1">4 horas · aprobación garantizada</div>
            <p className="text-white/85 text-sm mb-5">
              4 sesiones estructuradas en 2-3 semanas. Llegas al oficial con la confianza de quien ya lo aprobó.
            </p>

            <div className="mb-5 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold">$100</span>
              <span className="text-white/70 ml-1">USD</span>
              <span className="text-white/70 line-through text-base ml-2">$120</span>
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded">−$20</span>
            </div>

            <ul className="space-y-2.5 text-sm mb-8 flex-1">
              <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 flex-shrink-0" /><span><strong>Todo lo del plan de 1h</strong>, multiplicado por 4</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>Plan personalizado de 14 días</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>Banco extra de 60 preguntas filtradas a ti</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>WhatsApp directo durante todo el plan</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 flex-shrink-0" /><span><strong>Garantía de aprobación o sesión bonus gratis</strong></span></li>
            </ul>

            <a
              href={WA_URL_4H}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3.5 rounded-xl bg-white text-[#FF6B35] font-extrabold text-base hover:bg-white/95 transition-colors shadow-lg"
            >
              Reservar plan completo — $100
            </a>
            <p className="text-center text-xs text-white/85 mt-3">
              ⚡ Ahorras $20 frente a comprar 4 sesiones sueltas
            </p>
          </div>
        </div>
      </section>

      {/* ─── Garantía + testimonio ────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 max-w-4xl mx-auto mb-16 grid md:grid-cols-2 gap-5">
        <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8 text-emerald-400" />
            <div className="font-bold text-lg">Garantía sin letra chica</div>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            Si terminas tu primera hora sintiendo que no avanzaste, te regalo la segunda
            <strong className="text-white"> sin costo</strong>. Si después de eso aún no te ayudo, te
            <strong className="text-white"> devuelvo el 100% de tu dinero</strong>.
            Cero preguntas, cero formularios.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex text-amber-400 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400" />
            ))}
          </div>
          <p className="text-white/85 text-sm italic leading-relaxed mb-3">
            "En 4 horas con Max pasé de simulacros del 60% a aprobar el oficial con 87%.
            Las explicaciones del libro estaban — pero hasta que él me conectó los puntos,
            nada hacía clic. Mejor inversión del año."
          </p>
          <div className="text-xs text-white/60">
            — <strong className="text-white">Carlos R.</strong>, IT Service Manager · Lima, Perú
          </div>
        </div>
      </section>

      {/* ─── Urgencia + WhatsApp ─────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 max-w-3xl mx-auto mb-12">
        <div className="bg-[#1a0033] border-2 border-[#FF6B35]/40 rounded-3xl p-6 sm:p-8 text-center">
          <Clock className="w-10 h-10 text-[#FF6B35] mx-auto mb-3" />
          <h3 className="text-xl sm:text-2xl font-extrabold mb-2">
            6 plazas. 1 sola persona atendiendo.
          </h3>
          <p className="text-white/70 text-sm mb-6 max-w-xl mx-auto">
            No es marketing falso de escasez — soy una persona y mi calendario tiene horas
            finitas por semana. Las horas que se reservan, se reservan. Las que no, las usa otro.
          </p>

          <a
            href={WA_URL_INFO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#FF6B35] hover:bg-[#e85a25] text-white font-extrabold text-lg transition-colors shadow-lg shadow-[#FF6B35]/30"
          >
            <MessageCircle className="w-5 h-5" /> Reservar mi sesión por WhatsApp →
          </a>

          <div className="mt-5 text-xs text-white/50">
            Te respondo personalmente · Suelo confirmar tu horario en menos de 1 hora hábil
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="px-4 sm:px-6 py-8 border-t border-white/10 text-center text-xs text-white/40 space-y-2">
        <div>
          <Link to="/login" className="hover:text-white/70 hover:underline">
            ¿Querías iniciar sesión otra vez?
          </Link>
          {' · '}
          <Link to="/itil4" className="hover:text-white/70 hover:underline">
            Volver a la página principal
          </Link>
        </div>
        <div>© {new Date().getFullYear()} Ing. Max Escobari Quiroga · ITIL® es marca registrada de AXELOS Limited.</div>
      </footer>
    </div>
  );
}
