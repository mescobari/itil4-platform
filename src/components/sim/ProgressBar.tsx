interface ProgressBarProps {
  current: number;
  total: number;
  answered: number;
}

export function ProgressBar({ current, total, answered }: ProgressBarProps) {
  const pctCurrent  = (current / total) * 100;
  const pctAnswered = (answered / total) * 100;

  return (
    <div>
      <div className="flex justify-between text-xs text-white/60 mb-1">
        <span>Pregunta {current} de {total}</span>
        <span>{answered} respondidas</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
        <div
          className="absolute inset-y-0 left-0 bg-white/15 transition-all duration-300"
          style={{ width: `${pctAnswered}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-[#FF6B35] transition-all duration-300"
          style={{ width: `${pctCurrent}%` }}
        />
      </div>
    </div>
  );
}
