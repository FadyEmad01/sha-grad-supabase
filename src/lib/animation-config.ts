/**
 * animation-config.ts
 * Central source of truth for all animation easings, durations, and transitions.
 * Import from here across the project to keep motion consistent.
 */

// ─── Cubic-bezier easing curves ──────────────────────────────────────────────

export const easings = {
  /** Bouncy spring-like reveal — original hero curve */
  reveal: [0.944, 0.008, 0.147, 1.002] as [number, number, number, number],

  /** Smooth, cinematic full-screen expand */
  expand: [0.76, 0, 0.24, 1] as [number, number, number, number],

  /** Fast-out for elements leaving the frame */
  slideOut: [0.4, 0, 1, 1] as [number, number, number, number],

  /** Ease-in-out for soft state transitions */
  gentle: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],

  /** Snappy enter — fast deceleration into place */
  snappyIn: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number],
} as const

// ─── Duration values (seconds) ───────────────────────────────────────────────

export const durations = {
  reveal: 1.3,
  expand: 1.1,
  slideOut: 0.65,
  gentle: 0.4,
  snappyIn: 0.35,
} as const

// ─── Pre-built transition objects (drop straight into Framer Motion) ─────────

export const transitions = {
  reveal: {
    duration: durations.reveal,
    ease: easings.reveal,
  },
  expand: {
    duration: durations.expand,
    ease: easings.expand,
  },
  slideOut: {
    duration: durations.slideOut,
    ease: easings.slideOut,
  },
  gentle: {
    duration: durations.gentle,
    ease: easings.gentle,
  },
  snappyIn: {
    duration: durations.snappyIn,
    ease: easings.snappyIn,
  },
} as const

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Build a transition object with an optional delay.
 *
 * @example
 * transition={makeTransition("slideOut", 0.1)}
 */
export function makeTransition(
  key: keyof typeof transitions,
  delay?: number
): (typeof transitions)[keyof typeof transitions] & { delay?: number } {
  return delay !== undefined
    ? { ...transitions[key], delay }
    : transitions[key]
}