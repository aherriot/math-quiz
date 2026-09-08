import {
  FactState,
  GameState,
  Mode,
  Op,
  answerOf,
  getLevelIndex,
  isCommutative,
  modeIncludes,
} from "./types";

// Factor difficulty ordering: easiest factors first
const FACTOR_ORDER = [1, 2, 10, 5, 11, 3, 4, 9, 6, 7, 8, 12];

function mulDifficulty(a: number, b: number): number {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  const minRank = FACTOR_ORDER.indexOf(min);
  const maxRank = FACTOR_ORDER.indexOf(max);
  return minRank * 20 + maxRank;
}

// Addition facts to 9 + 9. Kids pick these up in a fairly predictable order:
// +1, then doubles and make-ten, then near-doubles, then the rest.
function addDifficulty(a: number, b: number): number {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  let score = min * 12 + max;
  if (min === 1) score -= 60;
  if (a === b) score -= 35;
  if (min >= 2 && a + b === 10) score -= 28;
  if (min === 2) score -= 20;
  if (Math.abs(a - b) === 1) score -= 12;
  return score;
}

// Subtraction facts with a minuend up to 18 and a subtrahend up to 9 — the ones
// that show up column-by-column inside bigger subtraction. The hard ones bridge
// ten (15 - 9); the rest can be counted back without crossing over.
function subDifficulty(a: number, b: number): number {
  const diff = a - b;
  const bridgesTen = a > 10 && diff < 10;
  let score = (bridgesTen ? 200 : 0) + b * 12 + a;
  if (b === 1) score -= 40;
  if (diff === 0) score -= 5;
  if (a === 10) score -= 14; // partners of ten
  if (diff === 10) score -= 18; // 15 - 5, 17 - 7 …
  if (a <= 10) score -= 10;
  return score;
}

// Division facts are the times table read backwards: a dividend up to 144 over a
// divisor of 1-12. Dividing by the easy factors comes first, same as multiplying.
function divDifficulty(divisor: number, quotient: number): number {
  return FACTOR_ORDER.indexOf(divisor) * 20 + FACTOR_ORDER.indexOf(quotient);
}

function factsForOp(op: Op): { a: number; b: number }[] {
  const out: { a: number; b: number; score: number }[] = [];
  if (op === "mul") {
    for (let a = 1; a <= 12; a++) {
      for (let b = a; b <= 12; b++) {
        out.push({ a, b, score: mulDifficulty(a, b) });
      }
    }
  } else if (op === "add") {
    for (let a = 1; a <= 9; a++) {
      for (let b = a; b <= 9; b++) {
        out.push({ a, b, score: addDifficulty(a, b) });
      }
    }
  } else if (op === "sub") {
    for (let b = 1; b <= 9; b++) {
      for (let a = b; a <= 18; a++) {
        out.push({ a, b, score: subDifficulty(a, b) });
      }
    }
  } else {
    for (let divisor = 1; divisor <= 12; divisor++) {
      for (let quotient = 1; quotient <= 12; quotient++) {
        out.push({
          a: divisor * quotient,
          b: divisor,
          score: divDifficulty(divisor, quotient),
        });
      }
    }
  }
  out.sort((x, y) => x.score - y.score);
  return out.map(({ a, b }) => ({ a, b }));
}

export function generateAllFacts(): FactState[] {
  const ops: Op[] = ["add", "sub", "mul", "div"];
  return ops.flatMap((op) =>
    factsForOp(op).map(({ a, b }, i) => ({
      op,
      a,
      b,
      order: i,
      box: 0,
      correctStreak: 0,
      totalCorrect: 0,
      totalAttempts: 0,
      lastSeen: 0,
    })),
  );
}

export function createInitialState(mode: Mode = "add"): GameState {
  return {
    facts: generateAllFacts(),
    mode,
    practiceAll: false,
    totalStars: 0,
    totalAnswered: 0,
  };
}

export function factsInMode(state: GameState, mode: Mode = state.mode) {
  return state.facts.filter((f) => modeIncludes(mode, f.op));
}

export function selectNextFact(
  state: GameState,
  lastFact?: { op: Op; a: number; b: number },
): { fact: FactState; isNew: boolean } {
  const pool = factsInMode(state);
  // In practice-all mode nothing needs introducing — the whole pool is active.
  const active = state.practiceAll ? pool : pool.filter((f) => f.box > 0);

  if (!state.practiceAll) {
    const struggling = active.filter((f) => f.box <= 1);
    const notIntroduced = pool
      .filter((f) => f.box === 0)
      // In mixed mode this interleaves the ops, since each op's `order` restarts at 0.
      .sort((x, y) => x.order - y.order);

    // Introduce new fact when not too many struggling and user is progressing
    const shouldIntroduce =
      notIntroduced.length > 0 &&
      (active.length < 3 ||
        (struggling.length === 0 && active.some((f) => f.box >= 2)));

    if (shouldIntroduce) {
      return { fact: notIntroduced[0], isNew: true };
    }
  }

  // Filter out last fact to avoid immediate repetition
  let candidates = active;
  if (lastFact && active.length > 1) {
    candidates = active.filter((f) => !sameFact(f, lastFact));
  }
  if (candidates.length === 0) candidates = active;

  // Weighted selection: lower correctStreak = much higher weight
  const weights = candidates.map((f) => {
    // Base weight drops exponentially with correctStreak
    // streak 0 → 64, streak 1 → 16, streak 2 → 4, streak 3 → 1, streak 4+ → 0.25
    let w = Math.pow(4, Math.max(0, 3 - f.correctStreak));
    const elapsed = Date.now() - f.lastSeen;
    if (elapsed > 60000) w *= 1.5;
    if (f.correctStreak === 0 && f.totalAttempts > 0) w *= 2;
    return Math.max(w, 0.25);
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return { fact: candidates[i], isNew: false };
  }
  return { fact: candidates[candidates.length - 1], isNew: false };
}

function sameFact(
  x: { op: Op; a: number; b: number },
  y: { op: Op; a: number; b: number },
): boolean {
  return x.op === y.op && x.a === y.a && x.b === y.b;
}

export interface AnswerResult {
  newState: GameState;
  correct: boolean;
  starsEarned: number;
  leveledUp: boolean;
}

export function processAnswer(
  state: GameState,
  fact: FactState,
  answer: number,
): AnswerResult {
  const correct = answer === answerOf(fact);
  const prevLevel = getLevelIndex(state.totalStars);

  const newFacts = state.facts.map((f) => {
    if (!sameFact(f, fact)) return f;
    const u = { ...f };
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

  // One star per correct answer, flat. There is deliberately no bonus for a run
  // of right answers: it made getting one wrong feel like losing something.
  const starsEarned = correct ? 1 : 0;

  const newTotalStars = state.totalStars + starsEarned;
  const newLevel = getLevelIndex(newTotalStars);

  return {
    newState: {
      ...state,
      facts: newFacts,
      totalStars: newTotalStars,
      totalAnswered: state.totalAnswered + 1,
    },
    correct,
    starsEarned,
    leveledUp: newLevel > prevLevel,
  };
}

/**
 * Look up a fact by operands. For the commutative ops the operands are stored
 * with a <= b, so either orientation finds the same fact.
 */
export function getFactMastery(
  op: Op,
  a: number,
  b: number,
  facts: FactState[],
): FactState | undefined {
  return facts.find(
    (f) =>
      f.op === op &&
      ((f.a === a && f.b === b) ||
        (isCommutative(op) && f.a === b && f.b === a)),
  );
}
