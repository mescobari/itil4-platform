import { useState, useEffect } from 'react';

export function useTypewriter(text: string, speed: number = 60, startDelay: number = 0): string {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(delay);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, started]);

  return displayed;
}
