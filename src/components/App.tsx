"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFolio } from "@/gl/react";
import { FEATURED } from "@/lib/projects";
import { HomeCarousel } from "./HomeCarousel";
import { Hud } from "./Hud";
import { FullIndex } from "./FullIndex";
import { ProjectSheet } from "./ProjectSheet";
import { NewsletterOverlay, ProfileOverlay } from "./Overlays";

type View = "home" | "full" | "project";
type Overlay = "profile" | "newsletter" | null;

export function App() {
  const folio = useFolio();
  const [view, setView] = useState<View>("home");
  const [projectSlug, setProjectSlug] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [sheetEntered, setSheetEntered] = useState(false);
  const [fullEntered, setFullEntered] = useState(false);
  const [carouselHidden, setCarouselHidden] = useState(false);
  const [returning, setReturning] = useState<string | null>(null);

  const busy = useRef(false);
  const carouselApi = useRef<{ center: (slug: string) => void }>({ center: () => {} });

  const project = FEATURED.find((p) => p.slug === projectSlug) ?? null;

  /* ── cursor ball + grabbable ─────────────────────────────────────────── */
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const desktopish =
      navigator.maxTouchPoints === 0 && !/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (!mq && !desktopish) return;
    const onMove = (e: PointerEvent) => {
      folio.moveBall(e.clientX, e.clientY);
      folio.showBall(true);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      folio.showBall(false);
    };
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [folio]);

  useEffect(() => {
    const scrollable = view === "home" && !overlay;
    document.documentElement.classList.toggle("grabbable", scrollable);
    return () => document.documentElement.classList.remove("grabbable");
  }, [view, overlay]);

  /* ── overlay (profile / newsletter) ──────────────────────────────────── */
  const toggleOverlay = useCallback(
    (which: "profile" | "newsletter") => {
      setOverlay((prev) => {
        const next = prev === which ? null : which;
        if (next) {
          folio.openHole(window.innerWidth / 2, window.innerHeight / 2);
        } else {
          folio.closeHole();
        }
        return next;
      });
    },
    [folio]
  );

  const closeOverlay = useCallback(() => {
    setOverlay((prev) => {
      if (prev) folio.closeHole();
      return null;
    });
  }, [folio]);

  /* ── view transitions ────────────────────────────────────────────────── */
  const wipeTo = useCallback(
    async (next: View) => {
      if (busy.current) return;
      busy.current = true;
      folio.openHole(window.innerWidth / 2, window.innerHeight / 2);
      await wait(500);
      if (next === "full") {
        setView("full");
        setFullEntered(false);
      } else if (next === "home") {
        setView("home");
        setFullEntered(false);
      }
      await wait(120);
      folio.closeHole();
      await wait(220);
      setFullEntered(true);
      busy.current = false;
    },
    [folio]
  );

  const openProject = useCallback(
    async (slug: string, fromCard: boolean) => {
      if (busy.current || overlay) return;
      busy.current = true;
      const entry = folio.cards.find((c) => c.slug === slug);
      if (fromCard && entry) {
        setCarouselHidden(true);
        const sheetRect = folio.sheetRect();
        let mounted = false;
        await folio.flyCard(slug, sheetRect, 1, (p) => {
          if (p > 0.45 && !mounted) {
            mounted = true;
            setView("project");
            setProjectSlug(slug);
            setSheetEntered(true);
          }
        });
        if (!mounted) {
          setView("project");
          setProjectSlug(slug);
          setSheetEntered(true);
        }
        // hide the flown mesh under the DOM sheet
        if (entry) {
          entry.mesh.visible = false;
          entry.flying = false;
        }
      } else {
        folio.closeHole();
        setView("project");
        setProjectSlug(slug);
        setSheetEntered(false);
        await wait(60);
        setSheetEntered(true);
      }
      busy.current = false;
    },
    [folio, overlay]
  );

  const closeProject = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const slug = projectSlug;
    setSheetEntered(false);
    await wait(260);
    setView("home");
    setProjectSlug(null);
    setReturning(slug);

    const entry = slug ? folio.cards.find((c) => c.slug === slug) : null;
    if (entry) {
      entry.mesh.visible = true;
      entry.flying = true;
      setCarouselHidden(false);
      await wait(80);
      carouselApi.current.center(slug);
      await folio.landCard(slug, 0.9);
    } else {
      setCarouselHidden(false);
    }
    setReturning(null);
    busy.current = false;
  }, [folio, projectSlug]);

  const switchProject = useCallback(
    async (slug: string) => {
      if (busy.current) return;
      busy.current = true;
      setSheetEntered(false);
      await wait(280);
      setProjectSlug(slug);
      await wait(80);
      setSheetEntered(true);
      busy.current = false;
    },
    []
  );

  const goHome = useCallback(() => {
    if (busy.current) return;
    if (overlay) closeOverlay();
    if (view === "project") closeProject();
    else if (view === "full") wipeTo("home");
  }, [view, overlay, closeOverlay, closeProject, wipeTo]);

  const goFull = useCallback(() => {
    if (busy.current || view !== "home" || overlay) return;
    wipeTo("full");
  }, [view, overlay, wipeTo]);

  const projectFor = useCallback((slug: string) => FEATURED.find((p) => p.slug === slug)!, []);

  return (
    <>
      <HomeCarousel
        folio={folio}
        enabled={view === "home" && !overlay}
        returning={returning}
        hidden={carouselHidden}
        onSelect={(slug) => openProject(slug, true)}
        apiRef={carouselApi}
      />

      {view === "full" && (
        <FullIndex entered={fullEntered} onSelect={(slug) => openProject(slug, false)} />
      )}

      {view === "project" && project && (
        <ProjectSheet
          project={project}
          entered={sheetEntered}
          onClose={closeProject}
          onPrev={(slug) => switchProject(slug)}
          onNext={(slug) => switchProject(slug)}
        />
      )}

      <ProfileOverlay open={overlay === "profile"} />
      <NewsletterOverlay open={overlay === "newsletter"} />

      <Hud
        view={view}
        overlay={overlay}
        onProfile={() => toggleOverlay("profile")}
        onNewsletter={() => toggleOverlay("newsletter")}
        onHome={goHome}
        onFull={goFull}
      />
      {void projectFor}
    </>
  );
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
