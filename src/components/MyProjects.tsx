"use client";

import { useEffect, useState } from "react";

interface Props {
  entered: boolean;
  onCreate: () => void;
}

interface LocalProject {
  id: string;
  title: string;
  thumbnail?: string;
  updatedAt?: string;
}

const STORAGE_KEY = "paper-stish-projects";

export function MyProjects({ entered, onCreate }: Props) {
  const [projects, setProjects] = useState<LocalProject[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) setProjects(parsed);
    } catch {
      // Local project data is optional; keep the empty state usable.
    }
  }, []);

  return (
    <main className="fixed inset-0 z-20 overflow-hidden" data-gl-shield="">
      <div
        className="absolute inset-0 overflow-y-auto px-20 py-28 s:px-0 s:py-32"
        style={{ opacity: entered ? 1 : 0, transition: "opacity 0.3s" }}
      >
        <div className="mx-auto flex min-h-full max-w-[1800px] flex-wrap items-center justify-center gap-20 s:gap-24">
          <button
            type="button"
            onClick={onCreate}
            aria-label="Create a new project"
            className="group relative w-full s:h-[43.5svh] s:max-h-[55rem] s:w-auto flex-none cursor-pointer rounded-15 s:rounded-20 bg-transparent text-left"
            style={{
              aspectRatio: "2048 / 1172",
              animation: entered
                ? "my-create-pop 1.25s cubic-bezier(0.16,1,0.3,1) 0.1s both"
                : undefined,
            }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-15 s:rounded-20 bg-black/20 transition-transform duration-700 ease-out group-hover:scale-[0.985]" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-24 s:text-32 tracking-[-0.06em]">Create</p>
                <p className="mt-2 text-14 s:text-16 opacity-55 tracking-[-0.04em]">Start a new project</p>
              </div>
            </div>
            <p className="pointer-events-none absolute bottom-10 inset-x-10 s:bottom-10 s:inset-x-20 flex items-end justify-between text-white">
              <span className="whitespace-nowrap text-16 s:text-18 tracking-[-0.05em]">Create</span>
              <span
                className="relative inline-flex size-25 s:size-25 items-center justify-center rounded-full bg-black text-white transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="size-15" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </p>
          </button>

          {projects.map((project, index) => (
            <button
              key={project.id}
              type="button"
              className="group relative w-full s:h-[43.5svh] s:max-h-[55rem] s:w-auto flex-none cursor-pointer overflow-hidden rounded-15 s:rounded-20 text-left"
              style={{
                aspectRatio: "2048 / 1172",
                animation: entered
                  ? `my-project-pop 1.25s cubic-bezier(0.16,1,0.3,1) ${0.12 + index * 0.04}s both`
                  : undefined,
              }}
            >
              {project.thumbnail ? (
                <img
                  src={project.thumbnail}
                  alt=""
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[0.985]"
                />
              ) : (
                <div className="absolute inset-0 bg-black/20 transition-transform duration-700 ease-out group-hover:scale-[0.985]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              <p className="pointer-events-none absolute bottom-10 inset-x-10 s:bottom-10 s:inset-x-20 flex items-end justify-between text-white">
                <span className="min-w-0 truncate text-16 s:text-18 tracking-[-0.05em]">{project.title}</span>
                <span className="relative ml-6 inline-flex size-25 s:size-25 flex-none items-center justify-center rounded-full bg-black text-white transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="size-15" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </p>
            </button>
          ))}
        </div>
      </div>
      <style>{`@keyframes my-create-pop { from { opacity: 0; transform: scale(0.94) translateY(24px); } to { opacity: 1; transform: scale(1) translateY(0); } } @keyframes my-project-pop { from { opacity: 0; transform: scale(0.96) translateY(24px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </main>
  );
}
