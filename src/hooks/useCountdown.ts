import { useState, useEffect } from 'react';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export function useCountdown(initialHours: number = 23): TimeLeft {
  const getStoredDeadline = (): number => {
    const stored = localStorage.getItem('itil4-countdown-deadline');
    if (stored) return parseInt(stored, 10);
    const deadline = Date.now() + initialHours * 60 * 60 * 1000;
    localStorage.setItem('itil4-countdown-deadline', String(deadline));
    return deadline;
  };

  const calcTimeLeft = (): TimeLeft => {
    const deadline = getStoredDeadline();
    const diff = Math.max(0, deadline - Date.now());
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}
