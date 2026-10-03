"use client";

import { useMemo, useState } from "react";

export type EditorRatio = "9:16" | "16:9" | "4:5" | "1:1";

interface EditorProps {
  entered: boolean;
  ratio: EditorRatio;
  importedFileName?: string;
  onClose: () => void;
}

type Tool = "move" | "text" | "photo" | "sticker" | "eraser" | "stroke" | "layers";

const TOOLS: Array<{ id: Tool; label: string; icon: string }> = [
  { id: "move", label: "Move", icon: "✦" },
  { id: "text", label: "Text", icon: "T" },
  { id: "photo", label: "Photo", icon: "▧" },
  { id: "sticker", label: "Sticker", icon: "◇" },
  { id: "eraser", label: "Eraser", icon: "⌁" },
  { id: "stroke", label: "Stroke", icon: "◌" },
  { id: "layers", label: "Layers", icon: "≡" },
];

export function Editor({ entered, ratio, importedFileName, onClose }: EditorProps) {
  const [activeTool, setActiveTool] = useState<Tool>("move");
  const [panelOpen, setPanelOpen] = useState(false);

  const canvasStyle = useMemo(() => {
    const sizes: Record<EditorRatio, string> = {
      "9:16": "9 / 16",
      "16:9": "16 / 9",
      "4:5": "4 / 5",
      "1:1": "1 / 1",
    };
    return { aspectRatio: sizes[ratio] };
  }, [ratio]);

  const chooseTool = (tool: Tool) => {
    setActiveTool(tool);
    setPanelOpen(tool !== "move");
  };

  return (
    <main
      className={`fixed inset-0 z-50 overflow-hidden bg-[#050505] text-white transition-opacity duration-500 ease-out ${entered ? "opacity-100" : "opacity-0"}`}
      data-gl-shield=""
      aria-label="Paper Stish editor"
    >
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-20 py-20 s:px-30 s:py-25">
        <button
          type="button"
          onClick={onClose}
          className="group inline-flex items-center gap-10 text-14 tracking-[-0.04em] text-white/75 transition-opacity hover:text-white"
          aria-label="Close editor"
        >
          <span className="inline-flex size-32 items-center justify-center rounded-full bg-white/8 transition-transform duration-300 group-hover:scale-95">
            <svg viewBox="0 0 24 24" className="size-15" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </span>
          <span className="hidden s:inline">MY</span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <p className="text-16 tracking-[-0.05em]">Paper Stish</p>
          <p className="mt-2 text-11 tracking-[-0.02em] text-white/40">
            {importedFileName || ratio}
          </p>
        </div>

        <button
          type="button"
          className="rounded-full bg-white px-18 py-9 text-13 tracking-[-0.03em] text-black transition-transform duration-300 hover:scale-[0.98]"
          onClick={() => window.dispatchEvent(new CustomEvent("paper-stish-export"))}
        >
          Export
        </button>
      </header>

      <div className="absolute inset-0 flex items-center justify-center px-18 pb-100 pt-85 s:px-40 s:pb-120 s:pt-90">
        <div className="relative flex h-full w-full items-center justify-center">
          <div
            className="relative max-h-full max-w-full overflow-hidden rounded-[18px] bg-[#f2f0ea] shadow-[0_30px_90px_rgba(0,0,0,.42)] transition-transform duration-700 ease-out s:rounded-[22px]"
            style={{ ...canvasStyle, width: "min(76vw, 62rem)" }}
            aria-label={`Editing ${ratio} project`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-black/18">
                <p className="text-16 tracking-[-0.04em]">Your design</p>
                <p className="mt-5 text-11">{ratio}</p>
              </div>
            </div>

            {importedFileName && (
              <div className="absolute left-12 top-12 rounded-full bg-black/75 px-10 py-6 text-10 text-white/85">
                {importedFileName}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 px-12 pb-18 s:px-30 s:pb-25">
        <div className="mx-auto flex max-w-[980px] items-end justify-center gap-6 rounded-[22px] border border-white/10 bg-black/55 p-7 backdrop-blur-xl s:gap-8 s:p-9">
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto">
            {TOOLS.map((tool) => {
              const active = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => chooseTool(tool.id)}
                  className={`group flex min-w-[54px] shrink-0 flex-col items-center justify-center gap-4 rounded-[15px] px-8 py-8 transition-all duration-300 ${
                    active ? "bg-white text-black" : "text-white/65 hover:bg-white/8 hover:text-white"
                  }`}
                  aria-label={tool.label}
                  aria-pressed={active}
                >
                  <span className="flex size-21 items-center justify-center text-15 leading-none">{tool.icon}</span>
                  <span className="text-10 tracking-[-0.03em]">{tool.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-5 border-l border-white/10 pl-7 s:pl-9">
            <button type="button" className="inline-flex size-38 items-center justify-center rounded-full text-18 text-white/70 transition-colors hover:bg-white/8 hover:text-white" aria-label="Undo">
              ↶
            </button>
            <button type="button" className="inline-flex size-38 items-center justify-center rounded-full text-18 text-white/70 transition-colors hover:bg-white/8 hover:text-white" aria-label="Redo">
              ↷
            </button>
          </div>
        </div>
      </div>

      {panelOpen && activeTool !== "move" && activeTool !== "layers" && (
        <div className="absolute bottom-105 left-12 right-12 z-30 mx-auto max-w-[620px] s:bottom-125">
          <div className="rounded-[20px] border border-white/10 bg-[#151515]/95 px-18 py-16 shadow-2xl backdrop-blur-xl s:px-22">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-14 tracking-[-0.04em]">{TOOLS.find((tool) => tool.id === activeTool)?.label}</p>
                <p className="mt-2 text-11 text-white/40">Choose an option to continue</p>
              </div>
              <button type="button" onClick={() => setPanelOpen(false)} className="inline-flex size-32 items-center justify-center rounded-full bg-white/7 text-white/65 hover:text-white" aria-label="Close tool panel">
                ×
              </button>
            </div>
            <div className="mt-14 flex flex-wrap gap-7">
              <button type="button" className="rounded-full bg-white/8 px-13 py-8 text-11 text-white/75 hover:bg-white/12 hover:text-white">Add</button>
              <button type="button" className="rounded-full bg-white/8 px-13 py-8 text-11 text-white/75 hover:bg-white/12 hover:text-white">Adjust</button>
              <button type="button" className="rounded-full bg-white/8 px-13 py-8 text-11 text-white/75 hover:bg-white/12 hover:text-white">Browse library</button>
            </div>
          </div>
        </div>
      )}

      {panelOpen && activeTool === "layers" && (
        <div className="absolute bottom-105 right-12 z-30 w-[min(22rem,calc(100vw-24px))] s:bottom-125 s:right-30">
          <div className="rounded-[20px] border border-white/10 bg-[#151515]/95 p-16 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-14 tracking-[-0.04em]">Layers</p>
              <button type="button" onClick={() => setPanelOpen(false)} className="text-20 text-white/55 hover:text-white" aria-label="Close layers">×</button>
            </div>
            <div className="mt-12 space-y-2">
              {[
                "Background",
                "Photo",
                "Sticker",
                "Text",
              ].map((layer) => (
                <button key={layer} type="button" className="flex w-full items-center justify-between rounded-[12px] bg-white/5 px-12 py-10 text-left text-12 text-white/70 hover:bg-white/8 hover:text-white">
                  <span>{layer}</span>
                  <span className="text-white/25">☰</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
