type Letter = 'A' | 'B' | 'C' | 'D';

interface AnswerOptionProps {
  letter: Letter;
  text: string;
  selected: boolean;
  // En modo práctica con respuesta revelada:
  reveal?: boolean;
  isCorrect?: boolean | null;
  correctLetter?: Letter | null;
  disabled?: boolean;
  onClick: () => void;
}

export function AnswerOption({
  letter, text, selected, reveal, isCorrect, correctLetter, disabled, onClick,
}: AnswerOptionProps) {
  // Estados visuales:
  //   - normal:   borde sutil, gris
  //   - selected: borde naranja
  //   - reveal+correct (es la opción correcta): borde verde
  //   - reveal+wrong  (selected pero no correcta): borde rojo
  let cls = 'border-white/15 bg-white/5 hover:bg-white/10';
  if (selected && !reveal) cls = 'border-[#FF6B35] bg-[#FF6B35]/10';
  if (reveal) {
    if (correctLetter === letter) cls = 'border-green-500 bg-green-500/15';
    else if (selected)            cls = 'border-red-500 bg-red-500/15';
    else                          cls = 'border-white/15 bg-white/5 opacity-70';
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full text-left flex gap-3 p-4 rounded-xl border-2 transition-all duration-150 ${cls} ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <span className={`shrink-0 w-8 h-8 rounded-full font-bold flex items-center justify-center ${
        reveal && correctLetter === letter
          ? 'bg-green-500 text-white'
          : reveal && selected && correctLetter !== letter
            ? 'bg-red-500 text-white'
            : selected
              ? 'bg-[#FF6B35] text-white'
              : 'bg-white/10 text-white/70'
      }`}>
        {letter}
      </span>
      <span className="text-white/90 leading-relaxed">{text}</span>
      {reveal && correctLetter === letter && (
        <span className="ml-auto text-green-300 text-xs font-semibold self-center">✓ correcta</span>
      )}
      {reveal && selected && correctLetter !== letter && (
        <span className="ml-auto text-red-300 text-xs font-semibold self-center">✗ tu opción</span>
      )}
      {/* hint para isCorrect — para silenciar warning de unused */}
      {isCorrect != null ? null : null}
    </button>
  );
}
