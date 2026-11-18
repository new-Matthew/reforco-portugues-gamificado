import { describe, expect, it, vi } from "vitest";
import {
  SOUND_EFFECTS,
  SoundEffects,
  type ToneStep,
} from "../src/core/soundEffects";

interface ScheduledTone {
  readonly frequency: number;
  readonly endFrequency?: number;
  readonly start: number;
  readonly stop: number;
  readonly type: OscillatorType;
}

function createFakeAudioContext() {
  const scheduled: ScheduledTone[] = [];
  let state: AudioContextState = "running";
  const resume = vi.fn(() => Promise.resolve());
  const close = vi.fn(() => Promise.resolve());

  const createGain = () => ({
    gain: {
      value: 1,
      setValueAtTime: () => undefined,
      exponentialRampToValueAtTime: () => undefined,
    },
    connect: () => undefined,
    disconnect: () => undefined,
  });

  const createOscillator = () => {
    const tone = {
      type: "sine" as OscillatorType,
      frequency: 0,
      endFrequency: undefined as number | undefined,
      start: 0,
      stop: 0,
    };

    const oscillator = {
      type: "sine" as OscillatorType,
      frequency: {
        setValueAtTime: (value: number) => {
          tone.frequency = value;
        },
        exponentialRampToValueAtTime: (value: number) => {
          tone.endFrequency = value;
        },
      },
      connect: () => undefined,
      disconnect: () => undefined,
      start: (time: number) => {
        tone.start = time;
      },
      stop: (time: number) => {
        tone.stop = time;
        scheduled.push({
          frequency: tone.frequency,
          endFrequency: tone.endFrequency,
          start: tone.start,
          stop: tone.stop,
          type: oscillator.type,
        });
      },
      onended: null as (() => void) | null,
    };

    return oscillator;
  };

  const context = {
    get state() {
      return state;
    },
    currentTime: 10,
    destination: {},
    createGain,
    createOscillator,
    resume,
    close,
  } as unknown as AudioContext;

  return {
    context,
    scheduled,
    resume,
    close,
    setState(next: AudioContextState) {
      state = next;
    },
  };
}

function expectValidStep(step: ToneStep): void {
  expect(step.frequency).toBeGreaterThan(0);
  expect(step.duration).toBeGreaterThan(0);
  expect(step.volume).toBeGreaterThan(0);
}

describe("sound effect sequences", () => {
  it("uses a short high click", () => {
    const [click] = SOUND_EFFECTS.click;
    expect(click).toBeDefined();
    if (!click) return;
    expectValidStep(click);
    expect(click.frequency).toBeGreaterThanOrEqual(800);
    expect(click.duration).toBeLessThanOrEqual(0.06);
    expect(click.type).toBe("square");
  });

  it("uses two ascending notes for success", () => {
    expect(SOUND_EFFECTS.correct).toHaveLength(2);
    const [first, second] = SOUND_EFFECTS.correct;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (!first || !second) return;
    expectValidStep(first);
    expectValidStep(second);
    expect(second.frequency).toBeGreaterThan(first.frequency);
    expect(second.delay).toBeGreaterThan(0);
  });

  it("uses a low descending buzzer for errors", () => {
    const [wrong] = SOUND_EFFECTS.wrong;
    expect(wrong).toBeDefined();
    if (!wrong) return;
    expectValidStep(wrong);
    expect(wrong.endFrequency).toBeDefined();
    expect(wrong.endFrequency ?? 0).toBeLessThan(wrong.frequency);
    expect(wrong.frequency).toBeLessThan(300);
  });

  it("uses a bright ascending arpeggio for purchases", () => {
    expect(SOUND_EFFECTS.purchase.length).toBeGreaterThanOrEqual(3);
    SOUND_EFFECTS.purchase.forEach(expectValidStep);
    const frequencies = SOUND_EFFECTS.purchase.map((step) => step.frequency);
    expect(frequencies).toEqual([...frequencies].sort((a, b) => a - b));
  });
});

describe("SoundEffects", () => {
  it("schedules the success sequence on the shared audio context", () => {
    const fake = createFakeAudioContext();
    const factory = vi.fn(() => fake.context);
    const effects = new SoundEffects(factory);

    effects.play("correct");
    effects.play("click");

    expect(factory).toHaveBeenCalledTimes(1);
    expect(fake.scheduled).toHaveLength(3);
    expect(fake.scheduled[0]?.frequency).toBeCloseTo(523.25);
    expect(fake.scheduled[0]?.start).toBeCloseTo(10);
    expect(fake.scheduled[1]?.frequency).toBeCloseTo(783.99);
    expect(fake.scheduled[1]?.start).toBeCloseTo(10.12);
    expect(fake.scheduled[2]?.frequency).toBeCloseTo(920);
  });

  it("ramps the error tone down to a lower frequency", () => {
    const fake = createFakeAudioContext();
    const effects = new SoundEffects(() => fake.context);

    effects.play("wrong");

    expect(fake.scheduled).toHaveLength(1);
    expect(fake.scheduled[0]?.frequency).toBe(196);
    expect(fake.scheduled[0]?.endFrequency).toBe(82);
    expect(fake.scheduled[0]?.type).toBe("sawtooth");
  });

  it("resumes a suspended context before scheduling", () => {
    const fake = createFakeAudioContext();
    fake.setState("suspended");
    const effects = new SoundEffects(() => fake.context);

    effects.play("click");

    expect(fake.resume).toHaveBeenCalledTimes(1);
    expect(fake.scheduled).toHaveLength(1);
  });

  it("fails silently when the browser has no audio context", () => {
    const effects = new SoundEffects(() => null);
    expect(() => effects.play("purchase")).not.toThrow();
  });
});
