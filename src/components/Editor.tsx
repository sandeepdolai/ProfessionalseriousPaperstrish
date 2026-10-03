"use client";

import { useMemo, useRef, useState } from "react";

export type EditorRatio = "9:16" | "16:9" | "4:5" | "1:1";

interface EditorProps {
  entered: boolean;
  ratio: EditorRatio;
  importedFileName?: string;
  onClose: () => void;
}

type Tool = "move" | "text" | "photo" | "sticker" | "eraser" | "stroke" | "layers";

type TextLayer = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
};

const TOOLS: Array<{ id: Tool; label: string; icon: string }> = [
  { id: "move", label: "Move", icon: "✦" },
  { id: "text", label: "Text", icon: "T" },
  { id: "photo", label: "Photo", icon: "▧" },
  { id: "sticker", label: "Sticker", icon: "◇" },
  { id: "eraser", label: "Eraser", icon: "⌁" },
  { id: "stroke", label: "Stroke", icon: "◌" },
  { id: "layers", label: "Layers", icon: "≡" },
];

const STARTING_FONTS = ["Inter", "Arial", "Georgia", "Times New Roman", "Courier New"];

export function Editor({ entered, ratio, importedFileName, onClose }: EditorProps) {
  const [activeTool, setActiveTool] = useState<Tool>("move");
  const [panelOpen, setPanelOpen] = useState(false);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [fonts, setFonts] = useState(STARTING_FONTS);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const canvasStyle = useMemo(() => {
    const sizes: Record<EditorRatio, string> = {
      "9:16": "9 / 16",
      "16:9": "16 / 9",
      "4:5": "4 / 5",
      "1:1": "1 / 1",
    };
    return { aspectRatio: sizes[ratio] };
  }, [ratio]);

  const selectedText = textLayers.find((layer) => layer.id === selectedTextId) ?? null;

  const chooseTool = (tool: Tool) => {
    setActiveTool(tool);
    setPanelOpen(tool !== "move");
    if (tool === "text" && !selectedTextId) addText();
  };

  const addText = () => {
    const id = `text-${Date.now()}`;
    setTextLayers((current) => [
      ...current,
      {
        id,
        text: "Double click to edit",
        x: 50,
        y: 50,
        fontFamily: fonts[0],
        fontSize: 36,
        color: "#111111",
        align: "center",
      },
    ]);
    setSelectedTextId(id);
    setActiveTool("text");
    setPanelOpen(true);
  };

  const updateSelectedText = (patch: Partial<TextLayer>) => {
    if (!selectedTextId) return;
    setTextLayers((current) => current.map((layer) => layer.id === selectedTextId ? { ...layer, ...patch } : layer));
  };

  const deleteSelectedText = () => {
    if (!selectedTextId) return;
    setTextLayers((current) => current.filter((layer) => layer.id !== selectedTextId));
    setSelectedTextId(null);
  };

  const startDrag = (event: React.PointerEvent<HTMLDivElement>, layer: TextLayer) => {
    event.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * 100;
    const pointerY = ((event.clientY - rect.top) / rect.height) * 100;
    dragRef.current = { id: layer.id, dx: pointerX - layer.x, dy: pointerY - layer.y };
    setSelectedTextId(layer.id);
    setActiveTool("text");
    setPanelOpen(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveText = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((event.clientX - rect.left) / rect.width) * 100 - drag.dx));
    const y = Math.max(5, Math.min(95, ((event.clientY - rect.top) / rect.height) * 100 - drag.dy));
    setTextLayers((current) => current.map((layer) => layer.id === drag.id ? { ...layer, x, y } : layer));
  };

  const stopDrag = () => {
    dragRef.current = null;
  };

  const importFont = async (file: File | undefined) => {
    if (!file) return;
    const family = file.name.replace(/\.[^/.]+$/, "") || `Imported Font ${fonts.length + 1}`;
    try {
      const font = new FontFace(family, `url(${URL.createObjectURL(file)})`);
      await font.load();
      document.fonts.add(font);
      setFonts((current) => current.includes(family) ? current : [...current, family]);
      updateSelectedText({ fontFamily: family });
    } catch {
      // Keep the editor usable if a browser cannot load the supplied font.
    }
  };

  return (
    <main
      className={`fixed inset-0 z-50 overflow-hidden bg-[#050505] text-white transition-opacity duration-500 ease-out ${entered ? "opacity-100" : "opacity-0"}`}
      data-gl-shield=""
      aria-label="Paper Stish editor"
    >
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-20 py-20 s:px-30 s:py-25">
        <button type="button" onClick={onClose} className="group inline-flex items-center gap-10 text-14 tracking-[-0.04em] text-white/75 transition-opacity hover:text-white" aria-label="Close editor">
          <span className="inline-flex size-32 items-center justify-center rounded-full bg-white/8 transition-transform duration-300 group-hover:scale-95">
            <svg viewBox="0 0 24 24" className="size-15" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
          </span>
          <span className="hidden s:inline">MY</span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <p className="text-16 tracking-[-0.05em]">Paper Stish</p>
          <p className="mt-2 text-11 tracking-[-0.02em] text-white/40">{importedFileName || ratio}</p>
        </div>

        <button type="button" className="rounded-full bg-white px-18 py-9 text-13 tracking-[-0.03em] text-black transition-transform duration-300 hover:scale-[0.98]" onClick={() => window.dispatchEvent(new CustomEvent("paper-stish-export"))}>Export</button>
      </header>

      <div className="absolute inset-0 flex items-center justify-center px-18 pb-100 pt-85 s:px-40 s:pb-120 s:pt-90">
        <div className="relative flex h-full w-full items-center justify-center">
          <div ref={canvasRef} className="relative max-h-full max-w-full overflow-hidden rounded-[18px] bg-[#f2f0ea] shadow-[0_30px_90px_rgba(0,0,0,.42)] transition-transform duration-700 ease-out s:rounded-[22px]" style={{ ...canvasStyle, width: "min(76vw, 62rem)" }} aria-label={`Editing ${ratio} project`}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {textLayers.length === 0 && <div className="text-center text-black/18"><p className="text-16 tracking-[-0.04em]">Your design</p><p className="mt-5 text-11">{ratio}</p></div>}
            </div>

            {textLayers.map((layer) => {
              const selected = layer.id === selectedTextId;
              return (
                <div
                  key={layer.id}
                  role="button"
                  tabIndex={0}
                  onPointerDown={(event) => startDrag(event, layer)}
                  onPointerMove={moveText}
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                  onDoubleClick={() => setPanelOpen(true)}
                  onClick={() => setSelectedTextId(layer.id)}
                  className={`absolute max-w-[88%] cursor-move select-none px-4 py-2 outline-none ${selected ? "ring-1 ring-black/20 ring-offset-2 ring-offset-[#f2f0ea]" : ""}`}
                  style={{ left: `${layer.x}%`, top: `${layer.y}%`, transform: "translate(-50%, -50%)", fontFamily: layer.fontFamily, fontSize: `${layer.fontSize}px`, color: layer.color, textAlign: layer.align, lineHeight: 1.08, whiteSpace: "pre-wrap" }}
                >
                  {layer.text}
                </div>
              );
            })}

            {importedFileName && <div className="absolute left-12 top-12 rounded-full bg-black/75 px-10 py-6 text-10 text-white/85">{importedFileName}</div>}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 px-12 pb-18 s:px-30 s:pb-25">
        <div className="mx-auto flex max-w-[980px] items-end justify-center gap-6 rounded-[22px] border border-white/10 bg-black/55 p-7 backdrop-blur-xl s:gap-8 s:p-9">
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto">
            {TOOLS.map((tool) => {
              const active = activeTool === tool.id;
              return <button key={tool.id} type="button" onClick={() => chooseTool(tool.id)} className={`group flex min-w-[54px] shrink-0 flex-col items-center justify-center gap-4 rounded-[15px] px-8 py-8 transition-all duration-300 ${active ? "bg-white text-black" : "text-white/65 hover:bg-white/8 hover:text-white"}`} aria-label={tool.label} aria-pressed={active}><span className="flex size-21 items-center justify-center text-15 leading-none">{tool.icon}</span><span className="text-10 tracking-[-0.03em]">{tool.label}</span></button>;
            })}
          </div>
          <div className="flex shrink-0 items-center gap-5 border-l border-white/10 pl-7 s:pl-9">
            <button type="button" className="inline-flex size-38 items-center justify-center rounded-full text-18 text-white/70 transition-colors hover:bg-white/8 hover:text-white" aria-label="Undo">↶</button>
            <button type="button" className="inline-flex size-38 items-center justify-center rounded-full text-18 text-white/70 transition-colors hover:bg-white/8 hover:text-white" aria-label="Redo">↷</button>
          </div>
        </div>
      </div>

      {panelOpen && activeTool === "text" && (
        <div className="absolute bottom-105 left-12 right-12 z-30 mx-auto max-w-[720px] s:bottom-125">
          <div className="rounded-[20px] border border-white/10 bg-[#151515]/95 px-18 py-16 shadow-2xl backdrop-blur-xl s:px-22">
            <div className="flex items-center justify-between gap-12">
              <div><p className="text-14 tracking-[-0.04em]">Text</p><p className="mt-2 text-11 text-white/40">Add and style text without leaving your canvas.</p></div>
              <button type="button" onClick={() => setPanelOpen(false)} className="inline-flex size-32 shrink-0 items-center justify-center rounded-full bg-white/7 text-white/65 hover:text-white" aria-label="Close text panel">×</button>
            </div>

            <div className="mt-14 grid gap-9">
              <textarea value={selectedText?.text ?? ""} onChange={(event) => updateSelectedText({ text: event.target.value })} placeholder="Type something..." rows={2} className="w-full resize-none rounded-[13px] border border-white/10 bg-white/6 px-12 py-10 text-13 text-white outline-none placeholder:text-white/25 focus:border-white/25" aria-label="Text content" />
              <div className="flex flex-wrap items-center gap-7">
                <button type="button" onClick={addText} className="rounded-full bg-white px-13 py-8 text-11 text-black transition-transform hover:scale-[0.98]">+ Add text</button>
                {selectedText && <button type="button" onClick={deleteSelectedText} className="rounded-full bg-white/8 px-13 py-8 text-11 text-white/70 hover:bg-white/12 hover:text-white">Delete</button>}
              </div>

              <div className="grid gap-9 s:grid-cols-2">
                <label className="grid gap-5 text-10 text-white/45">Font
                  <select value={selectedText?.fontFamily ?? fonts[0]} onChange={(event) => updateSelectedText({ fontFamily: event.target.value })} className="rounded-[11px] border border-white/10 bg-white/6 px-10 py-9 text-12 text-white outline-none" aria-label="Font">
                    {fonts.map((font) => <option key={font} value={font} className="bg-[#151515]">{font}</option>)}
                  </select>
                </label>
                <label className="grid gap-5 text-10 text-white/45">Size <span className="text-white/70">{selectedText?.fontSize ?? 36}px</span>
                  <input type="range" min="10" max="180" value={selectedText?.fontSize ?? 36} onChange={(event) => updateSelectedText({ fontSize: Number(event.target.value) })} aria-label="Text size" />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-10">
                <label className="flex items-center gap-7 text-10 text-white/45">Color <input type="color" value={selectedText?.color ?? "#111111"} onChange={(event) => updateSelectedText({ color: event.target.value })} className="size-28 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label="Text color" /></label>
                <div className="flex items-center gap-4" aria-label="Text alignment">
                  {["left", "center", "right"].map((align) => <button key={align} type="button" onClick={() => updateSelectedText({ align: align as TextLayer["align"] })} className={`rounded-full px-10 py-7 text-10 capitalize ${selectedText?.align === align ? "bg-white text-black" : "bg-white/7 text-white/60 hover:text-white"}`}>{align}</button>)}
                </div>
                <label className="cursor-pointer rounded-full bg-white/7 px-12 py-8 text-10 text-white/65 hover:bg-white/12 hover:text-white">Import font<input type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" className="hidden" onChange={(event) => importFont(event.target.files?.[0])} /></label>
              </div>
            </div>
          </div>
        </div>
      )}

      {panelOpen && activeTool !== "move" && activeTool !== "layers" && activeTool !== "text" && (
        <div className="absolute bottom-105 left-12 right-12 z-30 mx-auto max-w-[620px] s:bottom-125">
          <div className="rounded-[20px] border border-white/10 bg-[#151515]/95 px-18 py-16 shadow-2xl backdrop-blur-xl s:px-22">
            <div className="flex items-center justify-between"><div><p className="text-14 tracking-[-0.04em]">{TOOLS.find((tool) => tool.id === activeTool)?.label}</p><p className="mt-2 text-11 text-white/40">Choose an option to continue</p></div><button type="button" onClick={() => setPanelOpen(false)} className="inline-flex size-32 items-center justify-center rounded-full bg-white/7 text-white/65 hover:text-white" aria-label="Close tool panel">×</button></div>
            <div className="mt-14 flex flex-wrap gap-7"><button type="button" className="rounded-full bg-white/8 px-13 py-8 text-11 text-white/75 hover:bg-white/12 hover:text-white">Add</button><button type="button" className="rounded-full bg-white/8 px-13 py-8 text-11 text-white/75 hover:bg-white/12 hover:text-white">Adjust</button><button type="button" className="rounded-full bg-white/8 px-13 py-8 text-11 text-white/75 hover:bg-white/12 hover:text-white">Browse library</button></div>
          </div>
        </div>
      )}

      {panelOpen && activeTool === "layers" && (
        <div className="absolute bottom-105 right-12 z-30 w-[min(22rem,calc(100vw-24px))] s:bottom-125 s:right-30"><div className="rounded-[20px] border border-white/10 bg-[#151515]/95 p-16 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between"><p className="text-14 tracking-[-0.04em]">Layers</p><button type="button" onClick={() => setPanelOpen(false)} className="text-20 text-white/55 hover:text-white" aria-label="Close layers">×</button></div><div className="mt-12 space-y-2">{["Background", "Photo", "Sticker", ...textLayers.map((layer) => `Text: ${layer.text.slice(0, 22)}`)].map((layer, index) => <button key={`${layer}-${index}`} type="button" className="flex w-full items-center justify-between rounded-[12px] bg-white/5 px-12 py-10 text-left text-12 text-white/70 hover:bg-white/8 hover:text-white"><span>{layer}</span><span className="text-white/25">☰</span></button>)}</div></div></div>
      )}
    </main>
  );
}
