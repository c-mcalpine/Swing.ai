/**
 * Drill Coach — Hold Position Verifier
 *
 * Tracks whether a user holds a target pose for at least `min_hold_ms`
 * continuously.  Resets whenever the pose leaves the target band or
 * confidence drops below the threshold.
 *
 * Usage:
 *   const verifier = new HoldVerifier(holdConfig, signalDefs, minConfidence);
 *   // each frame:
 *   const snap = verifier.tick(signals, confidence, Date.now());
 *   // snap.holdMs — how long they've been holding continuously
 *   // snap.isHolding — currently in position
 *   // snap.isComplete — holdMs >= min_hold_ms
 */

import { signalsInBands, computeSignalQuality } from './signals';
import type { SignalDefinition } from './signals';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface HoldConfig {
  target: Record<string, [number, number]>;
  min_hold_ms: number;
}

export interface HoldSnapshot {
  isHolding: boolean;
  isComplete: boolean;
  holdMs: number;
  bestHoldMs: number;
  quality: number;
}

// ─────────────────────────────────────────────
// Class
// ─────────────────────────────────────────────

export class HoldVerifier {
  private holdStartMs: number | null = null;
  private currentHoldMs = 0;
  private bestHoldMs = 0;
  private qualitySum = 0;
  private qualityFrames = 0;

  constructor(
    private readonly holdConfig: HoldConfig,
    private readonly signalDefs: SignalDefinition[],
    private readonly minConfidence: number = 0.5
  ) {}

  /**
   * Feed the latest signal map, confidence, and wall-clock timestamp.
   */
  tick(
    signals: Record<string, number>,
    confidence: number,
    nowMs: number
  ): HoldSnapshot {
    const inPosition =
      confidence >= this.minConfidence &&
      signalsInBands(signals, this.holdConfig.target);

    if (inPosition) {
      if (this.holdStartMs === null) {
        this.holdStartMs = nowMs;
      }
      this.currentHoldMs = nowMs - this.holdStartMs;
      if (this.currentHoldMs > this.bestHoldMs) {
        this.bestHoldMs = this.currentHoldMs;
      }
      // Accumulate quality while holding
      const q = computeSignalQuality(signals, this.signalDefs);
      this.qualitySum += q;
      this.qualityFrames += 1;
    } else {
      // Broke position — reset timer
      this.holdStartMs = null;
      this.currentHoldMs = 0;
    }

    return this.snapshot();
  }

  /** Hard reset (e.g. user taps "retry"). */
  reset(): void {
    this.holdStartMs = null;
    this.currentHoldMs = 0;
    this.bestHoldMs = 0;
    this.qualitySum = 0;
    this.qualityFrames = 0;
  }

  snapshot(): HoldSnapshot {
    const quality =
      this.qualityFrames > 0 ? this.qualitySum / this.qualityFrames : 0;
    return {
      isHolding: this.holdStartMs !== null,
      isComplete: this.currentHoldMs >= this.holdConfig.min_hold_ms,
      holdMs: this.currentHoldMs,
      bestHoldMs: this.bestHoldMs,
      quality,
    };
  }
}
