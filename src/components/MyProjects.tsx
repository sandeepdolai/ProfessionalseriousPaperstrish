"use client";

interface Props {
  entered: boolean;
  onCreate: () => void;
}

export function MyProjects({ entered, onCreate }: Props) {
  return (
    <main className="fixed inset-0 z-20 overflow-hidden" data-gl-shield="">
      <div
        className="absolute inset-0 flex items-center justify-center px-20 s:px-0"
        style={{ opacity: entered ? 1 : 0, transition: "opacity 0.3s" }}
      >
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
      </div>
      <style>{`@keyframes my-create-pop { from { opacity: 0; transform: scale(0.94) translateY(24px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </main>
  );
}
