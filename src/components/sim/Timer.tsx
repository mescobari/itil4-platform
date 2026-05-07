import { useEffect, useState } from 'react';

interface TimerProps {
  startedAt: string;       // ISO
  timeLimitSeconds: number;
  onExpire?: () => void;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function Timer({ startedAt, timeLimitSeconds, onExpire }: TimerProps) {
  const startMs    = new Date(startedAt).getTime();
  const deadlineMs = startMs + timeLimitSeconds * 1000;

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, Math.floor((deadlineMs - now) / 1000));
  const minutes   = Math.floor(remaining / 60);
  const seconds   = remaining % 60;
  const lowTime   = remaining < 5 * 60;
  const expired   = remaining === 0;

  useEffect(() => {
    if (expired && onExpire) onExpire();
  }, [expired, onExpire]);

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-sm font-bold ${
        expired
          ? 'border-red-500 bg-red-500/20 text-red-200'
          : lowTime
            ? 'border-yellow-500 bg-yellow-500/15 text-yellow-200'
            : 'border-white/20 bg-white/5 text-white/90'
      }`}
    >
      ⏱ {pad(minutes)}:{pad(seconds)}
    </div>
  );
}
