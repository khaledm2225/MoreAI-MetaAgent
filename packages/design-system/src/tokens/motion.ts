export interface MotionToken {
  readonly durationMs: number;
  readonly easing: string;
}

/** Every animation comes from here. A raw curve anywhere else is a bug. */
export const motion = {
  /** A bouncy answer to a press, the playful feel. Tightens into `quick` under reduced motion. */
  pop: { durationMs: 500, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  /** A short, plain change of state. */
  quick: { durationMs: 200, easing: 'ease-out' },
  /** One turn of a loading spinner. */
  spin: { durationMs: 800, easing: 'linear' },
  /** One breath of a loading placeholder. It stands still under reduced motion. */
  pulse: { durationMs: 1500, easing: 'ease-in-out' },
  /** The wait between list items popping in, one after another. */
  stagger: { durationMs: 120, easing: 'linear' },
  /** One piece of confetti falling. */
  confetti: { durationMs: 2600, easing: 'ease-in' },
} as const satisfies Record<string, MotionToken>;

export type MotionName = keyof typeof motion;
