export type SoundEffectName = "click" | "correct" | "wrong" | "purchase";

export interface ToneStep {
  readonly frequency: number;
  readonly endFrequency?: number;
  readonly duration: number;
  readonly delay?: number;
  readonly type: OscillatorType;
  readonly volume: number;
}

export const SOUND_EFFECTS: Readonly<
  Record<SoundEffectName, readonly ToneStep[]>
> = {
  click: [
    { frequency: 920, duration: 0.05, type: "square", volume: 0.035 },
  ],
  correct: [
    { frequency: 523.25, duration: 0.12, type: "triangle", volume: 0.06 },
    {
      frequency: 783.99,
      duration: 0.2,
      delay: 0.12,
      type: "triangle",
      volume: 0.065,
    },
  ],
  wrong: [
    {
      frequency: 196,
      endFrequency: 82,
      duration: 0.32,
      type: "sawtooth",
      volume: 0.07,
    },
  ],
  purchase: [
    { frequency: 1046.5, duration: 0.08, type: "square", volume: 0.04 },
    {
      frequency: 1318.51,
      duration: 0.09,
      delay: 0.07,
      type: "square",
      volume: 0.04,
    },
    {
      frequency: 1567.98,
      duration: 0.16,
      delay: 0.15,
      type: "triangle",
      volume: 0.055,
    },
    {
      frequency: 2093,
      duration: 0.22,
      delay: 0.25,
      type: "sine",
      volume: 0.045,
    },
  ],
};

export type AudioContextFactory = () => AudioContext | null;

type AudioContextWindow = Window & {
  readonly webkitAudioContext?: typeof AudioContext;
};

function createBrowserAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const AudioContextCtor =
    window.AudioContext ?? (window as AudioContextWindow).webkitAudioContext;
  if (!AudioContextCtor) return null;

  try {
    return new AudioContextCtor();
  } catch {
    return null;
  }
}

export class SoundEffects {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly createContext: AudioContextFactory;

  constructor(createContext: AudioContextFactory = createBrowserAudioContext) {
    this.createContext = createContext;
  }

  play(effect: SoundEffectName): void {
    const context = this.ensureContext();
    if (!context || !this.master) return;

    if (context.state === "suspended") {
      void context.resume().catch(() => undefined);
    }

    const now = context.currentTime;

    try {
      for (const step of SOUND_EFFECTS[effect]) {
        this.scheduleStep(context, step, now);
      }
    } catch {
      // O áudio é opcional; uma falha nunca deve quebrar a interação.
    }
  }

  dispose(): void {
    if (this.context && this.context.state !== "closed") {
      void this.context.close().catch(() => undefined);
    }
    this.context = null;
    this.master = null;
  }

  private ensureContext(): AudioContext | null {
    if (this.context?.state === "closed") {
      this.context = null;
      this.master = null;
    }
    if (this.context) return this.context;

    const context = this.createContext();
    if (!context) return null;

    try {
      const master = context.createGain();
      master.gain.value = 0.7;
      master.connect(context.destination);
      this.context = context;
      this.master = master;
      return context;
    } catch {
      void context.close().catch(() => undefined);
      return null;
    }
  }

  private scheduleStep(
    context: AudioContext,
    step: ToneStep,
    now: number,
  ): void {
    if (!this.master) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + (step.delay ?? 0);
    const end = start + step.duration;
    const attack = Math.min(0.01, step.duration / 3);

    oscillator.type = step.type;
    oscillator.frequency.setValueAtTime(step.frequency, start);
    if (step.endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(
        step.endFrequency,
        end,
      );
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(step.volume, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }
}

export const soundEffects = new SoundEffects();
