type ConfettiFire = typeof import("canvas-confetti");
type ConfettiModule = { default: ConfettiFire };

let confettiLoader: Promise<ConfettiModule> | null = null;

function loadConfetti(): Promise<ConfettiModule> {
  confettiLoader ??= import("canvas-confetti");
  return confettiLoader;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function preloadConfetti(): void {
  if (typeof window === "undefined") return;

  const run = (): void => {
    void loadConfetti().catch(() => undefined);
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 1500 });
    return;
  }

  window.setTimeout(run, 600);
}

export async function fireCorrectConfetti(): Promise<void> {
  if (typeof window === "undefined" || prefersReducedMotion()) return;

  try {
    const module = await loadConfetti();
    const fire = module.default;
    void fire({
      particleCount: 72,
      spread: 68,
      startVelocity: 30,
      decay: 0.9,
      gravity: 0.9,
      ticks: 110,
      scalar: 0.9,
      shapes: ["square", "circle", "star"],
      colors: ["#ffcf5c", "#57d68d", "#5b8cff", "#b388ff", "#ffe38a"],
      origin: { x: 0.5, y: 0.62 },
      zIndex: 200,
      disableForReducedMotion: true,
    });
  } catch {
    // O confete é opcional; o quiz segue normalmente se o módulo falhar.
  }
}
