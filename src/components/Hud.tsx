"use client";

import { SITE } from "@/lib/projects";

interface HudProps {
  view: "home" | "full" | "project";
  overlay: "profile" | "newsletter" | null;
  onProfile: () => void;
  onNewsletter: () => void;
  onHome: () => void;
  onFull: () => void;
}

export function Hud({ view, overlay, onProfile, onNewsletter, onHome, onFull }: HudProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between px-40 py-25 s:px-80 s:py-40 text-white">
      <div className="flex items-start justify-between">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onHome();
          }}
          className="label pointer-events-auto cursor-pointer relative"
        >
          {SITE.name}
        </a>
        <button
          type="button"
          aria-expanded={overlay === "profile"}
          onClick={onProfile}
          className="label pointer-events-auto transition-opacity duration-300 ease-out hover:opacity-60"
        >
          {overlay === "profile" ? "Close" : "Profile"}
        </button>
      </div>
      <div className="relative flex justify-start">
        <nav className="label relative pointer-events-auto flex gap-x-5" aria-label="Project views">
          <a
            href="#"
            aria-current={view === "home" || view === "project" ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              onHome();
            }}
            className={`relative transition-opacity duration-500 ease-out ${
              view === "full" ? "opacity-50 hover:opacity-100" : ""
            }`}
          >
            Featured
          </a>
          <span aria-hidden="true">/</span>
          <a
            href="#"
            aria-current={view === "full" ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              onFull();
            }}
            className={`relative transition-opacity duration-500 ease-out ${
              view === "full" ? "" : "opacity-50 hover:opacity-100"
            }`}
          >
            Full
          </a>
        </nav>
        <button
          type="button"
          aria-expanded={overlay === "newsletter"}
          onClick={onNewsletter}
          className="label pointer-events-auto absolute bottom-0 right-0 transition-opacity duration-300 ease-out hover:opacity-60"
        >
          {overlay === "newsletter" ? "Close" : "Newsletter"}
        </button>
      </div>
    </div>
  );
}
