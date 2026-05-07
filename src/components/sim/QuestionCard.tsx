import type { ReactNode } from 'react';

interface QuestionCardProps {
  index: number;
  total: number;
  statement: string;
  children: ReactNode;        // las 4 opciones
  footer?: ReactNode;         // botones acción / próximo / submit
  feedback?: ReactNode;       // bloque post-respuesta en práctica (justificación)
}

export function QuestionCard({ index, total, statement, children, footer, feedback }: QuestionCardProps) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 sm:p-8 space-y-6">
      <div className="flex items-baseline gap-3">
        <span className="text-xs uppercase tracking-wider text-white/50">
          Pregunta {index} de {total}
        </span>
      </div>
      <h2 className="text-lg sm:text-xl font-semibold text-white leading-relaxed">
        {statement}
      </h2>
      <div className="space-y-3">{children}</div>
      {feedback && <div>{feedback}</div>}
      {footer && <div className="pt-2">{footer}</div>}
    </div>
  );
}
