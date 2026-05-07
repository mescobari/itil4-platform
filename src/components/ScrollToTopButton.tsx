import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  /** Pixeles de scroll a partir de los cuales aparece el botón. Default 400. */
  threshold?: number;
}

/**
 * Botón flotante esquina inferior derecha que sube suavemente al inicio.
 * Aparece cuando el scroll vertical supera `threshold`. Se posiciona con
 * `bottom-24` para no chocar con la StickyTrustBar de la landing principal.
 */
export function ScrollToTopButton({ threshold = 400 }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const goTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Volver al inicio"
      className={`fixed bottom-24 right-4 sm:right-6 z-[60] w-12 h-12 rounded-full
        bg-gradient-to-br from-[#6B2D91] to-[#8B5CF6]
        text-white flex items-center justify-center
        shadow-lg shadow-[#6B2D91]/40 hover:shadow-xl hover:shadow-[#8B5CF6]/50
        hover:scale-110 transition-all duration-200
        ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
