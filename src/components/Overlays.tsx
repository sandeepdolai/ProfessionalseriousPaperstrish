"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/projects";
import { ease, tween } from "@/gl/react";

interface OverlayProps {
  open: boolean;
  onEntered?: () => void;
  onExited?: () => void;
}

function useReveal(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parts = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (open && !shown) {
      setShown(true);
      parts.forEach((p, i) => {
        const base = parseFloat(p.dataset.delay || "0");
        p.style.opacity = "0";
        p.style.transform = "translateY(0.8rem)";
        tween(0, 1, 0.7, ease.expoOut, (v) => {
          p.style.opacity = String(v);
          p.style.transform = `translateY(${(1 - v) * 0.8}rem)`;
        }, undefined);
        void base;
        void i;
      });
    } else if (!open && shown) {
      setShown(false);
    }
     
  }, [open]);
  return ref;
}

export function ProfileOverlay({ open }: OverlayProps) {
  const ref = useReveal(open);
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-1/2 top-1/2 z-40 w-420 -translate-x-1/2 -translate-y-1/2 s:w-600"
      style={{ visibility: open ? "visible" : "hidden" }}
    >
      <div className="absolute inset-x-20 top-1/2 flex -translate-y-1/2 flex-col items-center text-center text-white">
        <p
          data-reveal
          className="text-14 leading-14 tracking-[-0.02em] max-w-[35rem] s:max-w-[45rem]"
        >
          {" "}
          {SITE.summary} {SITE.about}{" "}
        </p>
        <p data-reveal className="label opacity-60 mt-25 s:mt-30">
          {" "}
          {SITE.awards}{" "}
        </p>
        <ul className="flex list-none flex-wrap items-center justify-center gap-x-20 gap-y-8 mt-25 s:mt-30">
          {SITE.profiles.map((p) => (
            <li key={p.title} data-reveal>
              <a
                href={p.url}
                target="_blank"
                rel="noopener"
                className="label pointer-events-auto block transition-opacity duration-300 hover:opacity-60"
              >
                {p.title}
              </a>
            </li>
          ))}
          <li data-reveal>
            <a
              href={`mailto:${SITE.email}`}
              className="label pointer-events-auto block transition-opacity duration-300 hover:opacity-60"
            >
              Email
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function NewsletterOverlay({ open }: OverlayProps) {
  const ref = useReveal(open);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("Enter a valid email address");
      return;
    }
    setBusy(true);
    setStatus("Subscribing…");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data.message || "Subscribed");
        setEmail("");
      } else {
        setStatus(data.error || "Something went wrong");
      }
    } catch {
      setStatus("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-1/2 top-1/2 z-40 w-420 -translate-x-1/2 -translate-y-1/2 s:w-600"
      style={{ visibility: open ? "visible" : "hidden" }}
    >
      <div className="absolute inset-x-20 top-1/2 flex -translate-y-1/2 flex-col items-center text-center text-white">
        <p
          data-reveal
          className="text-14 leading-14 tracking-[-0.02em] max-w-[30rem] s:max-w-[32.5rem]"
        >
          {" "}
          An occasional newsletter with insights and thoughts from a design engineer, drawn from
          over a decade of freelancing.{" "}
        </p>
        <form
          data-reveal
          onSubmit={submit}
          className="mt-25 s:mt-30 flex w-full max-w-[26rem] s:max-w-[32rem] items-center gap-x-8"
          noValidate
        >
          <div className="relative flex h-40 s:h-45 w-full items-center rounded-full bg-black px-20 text-14 tracking-[-0.02em] min-w-0 flex-1">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              name="email"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              aria-label="Email address"
              placeholder="Email address"
              className="pointer-events-auto h-full w-full border-0 bg-transparent text-white outline-none [font:inherit] [letter-spacing:inherit] placeholder:text-white/40"
            />
          </div>
          <button
            type="submit"
            aria-label="Subscribe"
            disabled={busy}
            className="pointer-events-auto size-40 s:size-45 flex-none rounded-full bg-white text-black flex items-center justify-center transition-transform duration-300 hover:scale-105 disabled:opacity-70"
          >
            <svg viewBox="0 0 24 24" className="size-15" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        </form>
        <p data-reveal role="status" aria-live="polite" className="label mt-15 min-h-[1.2em] w-full text-center">
          <span className="inline-block opacity-60">{status}</span>
        </p>
      </div>
    </div>
  );
}
