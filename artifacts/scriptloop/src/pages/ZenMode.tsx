import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useScript } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLoopedAudio } from "@/hooks/useLoopedAudio";
import { ZenControls } from "@/components/ZenControls";

const NOISE_DATA_URI =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

const AUTO_HIDE_MS = 3000;

export default function ZenMode() {
  const params = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const scriptId = params.id ? Number(params.id) : undefined;

  const { data: script, isLoading, error } = useScript(scriptId);
  const [gapSeconds, setGapSeconds] = useState<number>(2);

  // Sync gap from script once it loads (and when switching scripts)
  useEffect(() => {
    if (script?.loopGapSeconds != null) {
      setGapSeconds(script.loopGapSeconds);
    }
  }, [script?.id, script?.loopGapSeconds]);

  const audioSrc = script?.audioUrl ?? "";
  const { audioRef, isPlaying, toggle, loopCount } = useLoopedAudio({
    src: audioSrc,
    gapSeconds,
  });

  const exitToDetail = useCallback(() => {
    if (scriptId) {
      navigate(`/scripts/${scriptId}`);
    } else {
      navigate("/dashboard");
    }
  }, [navigate, scriptId]);

  // Auto-hide controls on desktop
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isMobile) {
      setControlsVisible(true);
      return;
    }
    const reveal = () => {
      setControlsVisible(true);
      if (hideTimer.current !== undefined) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, AUTO_HIDE_MS);
    };
    reveal();
    window.addEventListener("mousemove", reveal);
    window.addEventListener("touchstart", reveal);
    return () => {
      window.removeEventListener("mousemove", reveal);
      window.removeEventListener("touchstart", reveal);
      if (hideTimer.current !== undefined) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = undefined;
      }
    };
  }, [isMobile]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      // Ignore when focus is on any interactive control — let native
      // keyboard activation (Space click, Enter submit, etc.) win.
      if (
        target &&
        target.closest(
          'input, textarea, select, button, a, [role="button"], [role="menuitem"], [role="option"], [role="combobox"], [contenteditable="true"]',
        )
      ) {
        if (e.key === "Escape") {
          e.preventDefault();
          exitToDetail();
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        exitToDetail();
      } else if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exitToDetail, toggle]);

  // Loading
  if (isLoading) {
    return (
      <ZenShell>
        <p className="text-sm text-white/40">Loading…</p>
      </ZenShell>
    );
  }

  // Not found / error
  if (error || !script) {
    return (
      <ZenShell>
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-white/50">
            {error ? "Couldn't load script." : "Script not found."}
          </p>
          <Button
            variant="ghost"
            onClick={exitToDetail}
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            Exit
          </Button>
        </div>
      </ZenShell>
    );
  }

  // No audio
  if (!script.audioUrl) {
    return (
      <ZenShell>
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          <p className="font-serif text-2xl text-white/80">Generate audio first.</p>
          <p className="max-w-sm text-sm text-white/40">
            Zen Mode plays your script on loop. Open the editor to generate
            the audio, then come back here.
          </p>
          <Button
            variant="ghost"
            onClick={exitToDetail}
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            Exit
          </Button>
        </div>
      </ZenShell>
    );
  }

  return (
    <ZenShell>
      <article
        className="zen-text mx-auto max-w-[640px] px-6 py-24 text-center font-serif text-2xl leading-relaxed text-white/85 sm:text-3xl sm:leading-relaxed"
        style={{ whiteSpace: "pre-wrap" }}
      >
        {script.content || "(empty script)"}
      </article>

      <audio
        ref={audioRef}
        src={script.audioUrl}
        preload="auto"
        className="sr-only"
      />

      <ZenControls
        isPlaying={isPlaying}
        onTogglePlay={toggle}
        gapSeconds={gapSeconds}
        onGapChange={setGapSeconds}
        loopCount={loopCount}
        onExit={exitToDetail}
        visible={controlsVisible}
      />

      <style>{`
        @keyframes zen-breathe {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
        .zen-text {
          animation: zen-breathe 8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .zen-text { animation: none; }
        }
      `}</style>
    </ZenShell>
  );
}

function ZenShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-auto bg-[#0a0a0a]"
      style={{
        backgroundImage: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%), ${NOISE_DATA_URI}`,
      }}
    >
      {children}
    </div>
  );
}
