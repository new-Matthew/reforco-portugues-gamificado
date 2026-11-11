import type { Clock, RandomProvider } from "../../core/ports/system";

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

export class MathRandomProvider implements RandomProvider {
  next(): number {
    return Math.random();
  }
}
