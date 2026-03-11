/**
 * Shared XP base values by item type.
 * These are DISPLAY constants only — the backend (award_xp RPC) is the
 * authoritative source of truth for actual XP awarded after multipliers.
 */
export const XP_BASE = {
  lesson: 50,
  drill: 20,
  cue: 10,
} as const;

export type XpItemType = keyof typeof XP_BASE;
