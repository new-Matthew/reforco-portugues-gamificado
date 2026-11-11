export interface Clock {
  now(): number;
}

export interface RandomProvider {
  next(): number;
}
