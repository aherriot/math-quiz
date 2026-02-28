import { PairState, GameState, getLevelIndex } from "./types";

// Factor difficulty ordering: easiest factors first
const FACTOR_ORDER = [1, 2, 10, 5, 11, 3, 4, 9, 6, 7, 8, 12];

function difficultyScore(a: number, b: number): number {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  const minRank = FACTOR_ORDER.indexOf(min);
  const maxRank = FACTOR_ORDER.indexOf(max);
  return minRank * 20 + maxRank;
}

export function generateOrderedPairs(): { a: number; b: number }[] {
  const pairs: { a: number; b: number; score: number }[] = [];
  for (let a = 1; a <= 12; a++) {
    for (let b = a; b <= 12; b++) {
      pairs.push({ a, b, score: difficultyScore(a, b) });
    }
  }
  pairs.sort((x, y) => x.score - y.score);
  return pairs.map(({ a, b }) => ({ a, b }));
}

export function createInitialState(): GameState {
  const orderedPairs = generateOrderedPairs();
  const pairs: PairState[] = orderedPairs.map(({ a, b }) => ({
    a,
    b,
    box: 0,
    correctStreak: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    lastSeen: 0,
  }));

  // Introduce first 3 pairs
  for (let i = 0; i < 3; i++) {
    pairs[i].box = 1;
  }

  return {
    pairs,
    totalStars: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalAnswered: 0,
  };
}

export function selectNextPair(
  state: GameState,
  lastPair?: { a: number; b: number },
): { pair: PairState; isNew: boolean } {
  const active = state.pairs.filter((p) => p.box > 0);
  const struggling = active.filter((p) => p.box <= 1);
  const notIntroduced = state.pairs.filter((p) => p.box === 0);

  // Introduce new pair when not too many struggling and user is progressing
  const shouldIntroduce =
    notIntroduced.length > 0 &&
    (active.length < 3 ||
      (struggling.length === 0 && active.some((p) => p.box >= 2)));

  if (shouldIntroduce) {
    return { pair: notIntroduced[0], isNew: true };
  }

  // Filter out last pair to avoid immediate repetition
  let candidates = active;
  if (lastPair && active.length > 1) {
    candidates = active.filter(
      (p) => !(p.a === lastPair.a && p.b === lastPair.b),
    );
  }
  if (candidates.length === 0) candidates = active;

  // Weighted selection: lower correctStreak = much higher weight
  const weights = candidates.map((p) => {
    // Base weight drops exponentially with correctStreak
    // streak 0 → 64, streak 1 → 16, streak 2 → 4, streak 3 → 1, streak 4+ → 0.25
    let w = Math.pow(4, Math.max(0, 3 - p.correctStreak));
    const elapsed = Date.now() - p.lastSeen;
    if (elapsed > 60000) w *= 1.5;
    if (p.correctStreak === 0 && p.totalAttempts > 0) w *= 2;
    return Math.max(w, 0.25);
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return { pair: candidates[i], isNew: false };
  }
  return { pair: candidates[candidates.length - 1], isNew: false };
}

export interface AnswerResult {
  newState: GameState;
  correct: boolean;
  starsEarned: number;
  leveledUp: boolean;
}

export function processAnswer(
  state: GameState,
  pair: PairState,
  answer: number,
): AnswerResult {
  const correct = answer === pair.a * pair.b;
  const prevLevel = getLevelIndex(state.totalStars);

  const newPairs = state.pairs.map((p) => {
    if (p.a !== pair.a || p.b !== pair.b) return p;
    const u = { ...p };
    if (correct) {
      u.correctStreak += 1;
      u.totalCorrect += 1;
      u.box = Math.min(5, u.box + 1);
    } else {
      u.correctStreak = 0;
      u.box = 1;
    }
    u.totalAttempts += 1;
    u.lastSeen = Date.now();
    return u;
  });

  const newStreak = correct ? state.currentStreak + 1 : 0;
  let starsEarned = 0;
  if (correct) {
    starsEarned = 1;
    if (newStreak >= 10) starsEarned = 5;
    else if (newStreak >= 5) starsEarned = 3;
    else if (newStreak >= 3) starsEarned = 2;
  }

  const newTotalStars = state.totalStars + starsEarned;
  const newLevel = getLevelIndex(newTotalStars);

  return {
    newState: {
      pairs: newPairs,
      totalStars: newTotalStars,
      currentStreak: newStreak,
      bestStreak: Math.max(state.bestStreak, newStreak),
      totalAnswered: state.totalAnswered + 1,
    },
    correct,
    starsEarned,
    leveledUp: newLevel > prevLevel,
  };
}

export function getPairMastery(
  a: number,
  b: number,
  pairs: PairState[],
): PairState | undefined {
  return pairs.find(
    (p) => (p.a === a && p.b === b) || (p.a === b && p.b === a),
  );
}
