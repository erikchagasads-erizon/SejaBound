import { EMPTY_BRIEFING_DNA_ANSWERS, type BriefingDnaAnswers } from './types';

export const BRIEFING_DNA_DRAFT_KEY = 'dna-bnd-briefing-draft';

interface BriefingDnaDraft {
  step: number;
  answers: BriefingDnaAnswers;
}

export function loadBriefingDnaDraft(): BriefingDnaDraft | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(BRIEFING_DNA_DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<BriefingDnaDraft>;
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      step: typeof parsed.step === 'number' ? parsed.step : 1,
      answers: { ...EMPTY_BRIEFING_DNA_ANSWERS, ...parsed.answers },
    };
  } catch {
    return null;
  }
}

export function saveBriefingDnaDraft(draft: BriefingDnaDraft): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(BRIEFING_DNA_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage indisponível (modo privado, cota excedida) — segue sem persistência.
  }
}

export function clearBriefingDnaDraft(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(BRIEFING_DNA_DRAFT_KEY);
  } catch {
    // no-op
  }
}
