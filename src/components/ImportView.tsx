"use client";

import { useRef, useState } from "react";

interface ImportViewProps {
  entered: boolean;
  onClose: () => void;
}

export function ImportView({ entered, onClose }: ImportViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);

  const selectFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
  };

  return (
    <main
      className={`fixed inset-0 z-30 flex items-center justify-center px-20 text-white transition-opacity duration-500 ease-out s:px-30 ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      aria-label="Import template"
    >
      <section className="w-full max-w-[38rem] text-center">
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            selectFile(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-[2rem] border p-25 transition-all duration-300 s:p-35 ${
            dragging
              ? "border-white/35 bg-white/[0.08]"
              : "border-white/12 bg-white/[0.035]"
          }`}
        >
          <p className="label opacity-50">PAPER STISH</p>
          <h1 className="mt-10 text-24 leading-24 tracking-[-0.045em] s:text-28 s:leading-28">
            Import a template
          </h1>
          <p className="mx-auto mt-12 max-w-[28rem] text-14 leading-18 tracking-[-0.02em] text-white/55">
            Upload a Paper Stish template from your device and continue editing it.
          </p>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-25 h-52 rounded-full bg-white px-25 text-14 tracking-[-0.02em] text-black transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99]"
          >
            Choose template file
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".stish"
            className="hidden"
            onChange={(e) => selectFile(e.target.files?.[0])}
          />

          <p className="mt-15 min-h-[1.2em] label opacity-45">
            {fileName || "or drag and drop your .stish file here"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-20 label opacity-50 transition-opacity duration-300 hover:opacity-100"
        >
          Back
        </button>
      </section>
    </main>
  );
}
