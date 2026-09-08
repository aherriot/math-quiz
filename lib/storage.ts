import { FactState, GameState, MODE_OPS, Mode, Op } from "./types";
import { createInitialState, generateAllFacts } from "./engine";

const KEY = "multiplication-galaxy-v1";

interface LegacyPair {
  a: number;
  b: number;
  box: number;
  correctStreak: number;
  totalCorrect: number;
  totalAttempts: number;
  lastSeen: number;
}

interface StoredState extends Partial<GameState> {
  /** v1 saves predated the other operations and stored multiplication facts only. */
  pairs?: LegacyPair[];
  /** Dropped: runs of right answers across facts no longer earn or track anything. */
  currentStreak?: number;
  bestStreak?: number;
}

const VALID_MODES: Mode[] = Object.keys(MODE_OPS) as Mode[];

function keyOf(f: { op: Op; a: number; b: number }): string {
  return `${f.op}:${f.a}:${f.b}`;
}

/**
 * Rebuild the fact list from the current catalogue, carrying over progress for
 * any fact we already have a record of. This keeps saved games working when the
 * catalogue gains operations or facts.
 */
function hydrateFacts(saved: FactState[]): FactState[] {
  const byKey = new Map(saved.map((f) => [keyOf(f), f]));
  return generateAllFacts().map((fact) => {
    const prev = byKey.get(keyOf(fact));
    if (!prev) return fact;
    return {
      ...fact,
      box: prev.box ?? 0,
      correctStreak: prev.correctStreak ?? 0,
      totalCorrect: prev.totalCorrect ?? 0,
      totalAttempts: prev.totalAttempts ?? 0,
      lastSeen: prev.lastSeen ?? 0,
    };
  });
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* localStorage might be unavailable */
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { pairs, facts, mode, totalStars, totalAnswered, practiceAll } =
      JSON.parse(raw) as StoredState;

    const savedFacts: FactState[] =
      facts ?? (pairs ?? []).map((p) => ({ ...p, op: "mul" as Op, order: 0 }));

    const base = createInitialState();
    // Built field by field rather than spread, so fields dropped from GameState
    // (the old currentStreak / bestStreak) can't ride along and be re-persisted.
    return {
      facts: hydrateFacts(savedFacts),
      totalStars: totalStars ?? base.totalStars,
      totalAnswered: totalAnswered ?? base.totalAnswered,
      practiceAll: practiceAll === true,
      mode:
        mode && VALID_MODES.includes(mode)
          ? mode
          : pairs
            ? "mul" // an existing player was part-way through the times tables
            : base.mode,
    };
  } catch {
    return null;
  }
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
