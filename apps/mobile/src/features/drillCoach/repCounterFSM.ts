/**
 * Drill Coach — Rep Counter FSM
 *
 * A finite state machine that counts verified reps from a stream of
 * signal snapshots.  Each call to `tick()` advances the state machine
 * and returns the updated counts + quality.
 *
 * States:
 *   idle       → waiting for pose tracking to stabilise
 *   ready      → user is in the "ready / start" position
 *   rep_active → rep is in progress (signal moved out of ready into rep_start band)
 *   rep_done   → rep completed (signal reached rep_end band) — immediately resets to ready
 *
 * Transitions:
 *   idle       → ready      : all "ready" bands satisfied AND confidence >= minConfidence
 *   ready      → rep_active : all "rep_start" bands satisfied
 *   rep_active → rep_done   : all "rep_end" bands satisfied
 *   rep_done   → ready      : automatic on same tick
 *
 * Quality:
 *   During each rep (rep_active phase) we accumulate per-frame quality scores.
 *   When the rep completes, the mean becomes the rep's quality.
 *   repsValid counts reps whose quality >= QUALITY_THRESHOLD.
 */

import { signalsInBands, computeSignalQuality } from './signals';
import type { RepFsmConfig, SignalDefinition } from './signals';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type RepFsmState = 'idle' | 'ready' | 'rep_active' | 'rep_done';

export interface RepCounterSnapshot {
  state: RepFsmState;
  repsAttempted: number;
  repsValid: number;
  avgQuality: number;
  currentRepQuality: number | null;
  /** per-rep quality log, one entry per completed rep */
  repLog: RepEntry[];
}

interface RepEntry {
  quality: number;
  valid: boolean;
  frameCount: number;
}

const QUALITY_THRESHOLD = 0.6; // rep counts as "valid" above this quality

// ─────────────────────────────────────────────
// FSM class
// ─────────────────────────────────────────────

export class RepCounterFSM {
  private state: RepFsmState = 'idle';
  private repsAttempted = 0;
  private repsValid = 0;
  private repLog: RepEntry[] = [];

  /** Accumulated quality scores during the current rep_active phase */
  private activeRepQualitySum = 0;
  private activeRepFrameCount = 0;

  constructor(
    private readonly fsmConfig: RepFsmConfig,
    private readonly signalDefs: SignalDefinition[],
    private readonly minConfidence: number = 0.5
  ) {}

  /**
   * Feed a new frame's signal map + confidence into the FSM.
   * Returns a snapshot of the current state.
   */
  tick(
    signals: Record<string, number>,
    confidence: number
  ): RepCounterSnapshot {
    switch (this.state) {
      case 'idle':
        if (
          confidence >= this.minConfidence &&
          signalsInBands(signals, this.fsmConfig.ready)
        ) {
          this.state = 'ready';
        }
        break;

      case 'ready':
        if (signalsInBands(signals, this.fsmConfig.rep_start)) {
          this.state = 'rep_active';
          this.activeRepQualitySum = 0;
          this.activeRepFrameCount = 0;
        }
        break;

      case 'rep_active': {
        // Accumulate quality while the rep is in progress
        const frameQuality = computeSignalQuality(signals, this.signalDefs);
        this.activeRepQualitySum += frameQuality;
        this.activeRepFrameCount += 1;

        if (signalsInBands(signals, this.fsmConfig.rep_end)) {
          // Rep completed
          const repQuality =
            this.activeRepFrameCount > 0
              ? this.activeRepQualitySum / this.activeRepFrameCount
              : 0;
          const valid = repQuality >= QUALITY_THRESHOLD;

          this.repsAttempted += 1;
          if (valid) this.repsValid += 1;
          this.repLog.push({
            quality: repQuality,
            valid,
            frameCount: this.activeRepFrameCount,
          });

          this.state = 'rep_done';
        }
        break;
      }

      case 'rep_done':
        // Auto-reset to ready on the next tick
        this.state = 'ready';
        break;
    }

    return this.snapshot();
  }

  /** Reset all counters and return to idle. */
  reset(): void {
    this.state = 'idle';
    this.repsAttempted = 0;
    this.repsValid = 0;
    this.repLog = [];
    this.activeRepQualitySum = 0;
    this.activeRepFrameCount = 0;
  }

  snapshot(): RepCounterSnapshot {
    const avgQuality =
      this.repLog.length > 0
        ? this.repLog.reduce((s, r) => s + r.quality, 0) / this.repLog.length
        : 0;

    const currentRepQuality =
      this.state === 'rep_active' && this.activeRepFrameCount > 0
        ? this.activeRepQualitySum / this.activeRepFrameCount
        : null;

    return {
      state: this.state,
      repsAttempted: this.repsAttempted,
      repsValid: this.repsValid,
      avgQuality,
      currentRepQuality,
      repLog: [...this.repLog],
    };
  }
}
