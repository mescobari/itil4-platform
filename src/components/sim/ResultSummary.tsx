interface ResultSummaryProps {
  scoreCorrect: number;
  scoreTotal: number;
  scorePct: number;
  threshold: number;
  passed: boolean;
  status: string; // submitted | expired | discarded
}

export function ResultSummary({
  scoreCorrect, scoreTotal, scorePct, threshold, passed, status,
}: ResultSummaryProps) {
  return (
    <div className={`rounded-2xl p-6 sm:p-8 border-2 ${
      passed
        ? 'border-green-500 bg-green-500/10'
        : status === 'expired'
          ? 'border-yellow-500 bg-yellow-500/10'
          : 'border-red-500 bg-red-500/10'
    }`}>
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-4xl">{passed ? '🎉' : status === 'expired' ? '⏱' : '📚'}</span>
        <h2 className="text-2xl font-extrabold text-white">
          {passed ? '¡Aprobado!' : status === 'expired' ? 'Tiempo agotado' : 'No aprobado'}
        </h2>
      </div>
      <p className="text-white/70 text-sm mb-4">
        Tu puntaje: <strong className="text-white">{scoreCorrect} de {scoreTotal}</strong> ({scorePct.toFixed(2)}%) ·
        Umbral para aprobar: {threshold}%
      </p>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden relative">
        <div
          className="absolute inset-y-0 left-0 bg-white/20"
          style={{ width: `${threshold}%` }}
          title={`Umbral ${threshold}%`}
        />
        <div
          className={`absolute inset-y-0 left-0 ${passed ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${scorePct}%` }}
        />
      </div>
    </div>
  );
}
