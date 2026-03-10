import type { CueDetail } from '@/hooks/useCueDetail';

export interface CuePresentation {
  whatThisHelps: string;
  useThisWhen: string[];
  tryItNow: string[];
  goodRepSigns: string[];
  overdoWarning: string | null;
}

/**
 * Derives a user-facing CuePresentation from a CueDetail.
 * Pure function — no React, no async, no LLM calls.
 * Falls back gracefully when fields are missing.
 */
export function buildCuePresentation(detail: CueDetail): CuePresentation {
  const { cue, phase, mechanic, relatedErrors, relatedDrills } = detail;
  const cueType = cue.cue_type ?? '';

  // ── whatThisHelps ─────────────────────────────────────────────
  let whatThisHelps: string;
  if (mechanic && phase) {
    whatThisHelps = `Improves your ${mechanic.name} during the ${phase.name}`;
  } else if (mechanic) {
    whatThisHelps = `Improves your ${mechanic.name}`;
  } else if (phase) {
    whatThisHelps = `Helps with your ${phase.name}`;
  } else if (relatedErrors.length > 0) {
    whatThisHelps = `Addresses ${relatedErrors[0].name}`;
  } else if (cue.notes) {
    const firstSentence = cue.notes.split(/[.!?]/)[0].trim();
    whatThisHelps = firstSentence || 'A coaching cue for your swing';
  } else {
    whatThisHelps = 'A coaching cue for your swing';
  }

  // ── useThisWhen ───────────────────────────────────────────────
  const useThisWhen: string[] = [];

  // From related errors (cap at 2)
  for (const err of relatedErrors.slice(0, 2)) {
    const miss = err.typical_miss ?? err.name;
    useThisWhen.push(`You're seeing ${miss}`);
  }

  // From cue_type
  if (cueType === 'feel') {
    useThisWhen.push('You need a physical checkpoint during practice');
  } else if (cueType === 'visual' || cueType === 'thought') {
    useThisWhen.push('You want a mental image to carry to the course');
  } else if (cueType === 'checkpoint') {
    useThisWhen.push("You're warming up or building a pre-shot routine");
  }

  // From phase
  if (phase && useThisWhen.length < 4) {
    useThisWhen.push(`You're working on your ${phase.name}`);
  }

  // Ensure at least one item
  if (useThisWhen.length === 0) {
    useThisWhen.push("You're looking for a swing thought during practice");
  }

  // ── tryItNow ──────────────────────────────────────────────────
  const tryItNow: string[] = [];

  tryItNow.push('Set up to the ball as normal');

  if (cueType === 'feel') {
    tryItNow.push(`As you swing, focus on feeling: "${cue.text}"`);
  } else if (cueType === 'visual' || cueType === 'thought') {
    tryItNow.push(`Hold this image in your mind: "${cue.text}"`);
  } else {
    tryItNow.push(`Focus on: "${cue.text}"`);
  }

  // Add error-observation steps (cap at 2)
  for (const err of relatedErrors.slice(0, 2)) {
    const miss = err.typical_miss ?? err.name;
    tryItNow.push(`Notice if "${miss}" goes away`);
  }

  // Final rep count step
  const repCount = Math.min(5, 3 + relatedDrills.length);
  tryItNow.push(`Repeat for ${repCount} swings total`);

  // ── goodRepSigns ──────────────────────────────────────────────
  const goodRepSigns: string[] = [];

  // From related errors' fix field (cap at 2)
  for (const err of relatedErrors.slice(0, 2)) {
    if (err.fix) {
      goodRepSigns.push(err.fix);
    }
  }

  // From mechanic short description
  if (mechanic?.description_short && goodRepSigns.length < 3) {
    goodRepSigns.push(mechanic.description_short);
  }

  // Fallbacks
  if (goodRepSigns.length === 0) {
    goodRepSigns.push('The cue feels natural, not forced');
    goodRepSigns.push("You can maintain it without thinking about it");
  } else if (goodRepSigns.length < 2) {
    goodRepSigns.push("You can maintain it without thinking about it");
  }

  // ── overdoWarning ─────────────────────────────────────────────
  const overdoWarning =
    cueType === 'feel'
      ? 'If this starts to feel exaggerated or uncomfortable, ease back. The cue should guide, not dominate your swing.'
      : null;

  return { whatThisHelps, useThisWhen, tryItNow, goodRepSigns, overdoWarning };
}
