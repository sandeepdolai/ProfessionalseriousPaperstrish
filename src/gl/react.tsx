"use client";

 
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Folio } from "./scene";

const FolioCtx = createContext<Folio | null>(null);

export function FolioProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [folio] = useState(() => new Folio());

  useEffect(() => {
    if (ref.current) folio.mount(ref.current);
    return () => folio.destroy();
     
  }, [folio]);

  return (
    <FolioCtx.Provider value={folio}>
      {children}
      <div className="gl" ref={ref} aria-hidden="true" />
    </FolioCtx.Provider>
  );
}

export function useFolio() {
  return useContext(FolioCtx);
}

/** tiny tween helper backed by rAF */
export function tween(
  from: number,
  to: number,
  duration: number,
  ease: (t: number) => number,
  onUpdate: (v: number) => void,
  onComplete?: () => void
) {
  let raf = 0;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / (duration * 1000));
    onUpdate(from + (to - from) * ease(t));
    if (t < 1) raf = requestAnimationFrame(step);
    else onComplete?.();
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

export const ease = {
  expoOut: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  power1Out: (t: number) => 1 - Math.pow(1 - t, 1),
  power2Out: (t: number) => 1 - Math.pow(1 - t, 2),
  power2In: (t: number) => t * t,
  backOut: (t: number) => {
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
  linear: (t: number) => t,
};
