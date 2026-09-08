export type Op = "mul" | "add" | "sub" | "div";

/** A quiz mode is one operation, a related pair of them, or everything. */
export type Mode = Op | "addsub" | "muldiv" | "mixed";

export const MODE_OPS: Record<Mode, readonly Op[]> = {
  add: ["add"],
  sub: ["sub"],
  addsub: ["add", "sub"],
  mul: ["mul"],
  div: ["div"],
  muldiv: ["mul", "div"],
  mixed: ["add", "sub", "mul", "div"],
};

export interface FactState {
  op: Op;
  a: number;
  b: number;
  order: number; // rank within its op, easiest first — drives introduction order
  box: number; // 0=not introduced, 1=learning, 2=reviewing, 3=familiar, 4=known, 5=mastered
  /**
   * Consecutive correct answers for this one fact. Purely internal scheduling
   * input — never shown to the player, and unrelated to any run of right
   * answers across facts.
   */
  correctStreak: number;
  totalCorrect: number;
  totalAttempts: number;
  lastSeen: number;
}

export interface GameState {
  facts: FactState[];
  mode: Mode;
  /**
   * When true, every fact in the mode is fair game from the start — no "New
   * Fact!" introductions, for a player who already knows them and just wants
   * practice. Mastery is still tracked from their answers.
   */
  practiceAll: boolean;
  totalStars: number;
  totalAnswered: number;
}

export type Screen = "home" | "quiz" | "progress";

export const OP_SYMBOL: Record<Op, string> = {
  mul: "×",
  add: "+",
  sub: "−",
  div: "÷",
};

export const MODES: readonly { mode: Mode; label: string; emoji: string }[] = [
  { mode: "add", label: "Add", emoji: "➕" },
  { mode: "sub", label: "Subtract", emoji: "➖" },
  { mode: "addsub", label: "Add & Sub", emoji: "➕➖" },
  { mode: "mul", label: "Multiply", emoji: "✖️" },
  { mode: "div", label: "Divide", emoji: "➗" },
  { mode: "muldiv", label: "Mul & Div", emoji: "✖️➗" },
  { mode: "mixed", label: "Everything", emoji: "🎲" },
];

export function answerOf(fact: { op: Op; a: number; b: number }): number {
  switch (fact.op) {
    case "mul":
      return fact.a * fact.b;
    case "add":
      return fact.a + fact.b;
    case "sub":
      return fact.a - fact.b;
    case "div":
      return fact.a / fact.b;
  }
}

/** Addition and multiplication are commutative, so the operands can be shown either way round. */
export function isCommutative(op: Op): boolean {
  return op === "add" || op === "mul";
}

export function modeIncludes(mode: Mode, op: Op): boolean {
  return MODE_OPS[mode].includes(op);
}

export type Level = { name: string; minStars: number; emoji: string };

/**
 * Ranks climb the nested cosmic scale — each one is a bigger place than the
 * last — so the name alone says which is higher without having to learn the
 * ladder.
 */
export const LEVELS: readonly Level[] = [
  { name: "Launch Cadet", minStars: 0, emoji: "🚀" },
  { name: "Sky Pilot", minStars: 10, emoji: "☁️" },
  { name: "Orbit Scout", minStars: 25, emoji: "🛰️" },
  { name: "Moon Walker", minStars: 45, emoji: "🌙" },
  { name: "Planet Explorer", minStars: 75, emoji: "🪐" },
  { name: "Comet Chaser", minStars: 115, emoji: "☄️" },
  { name: "Star Captain", minStars: 165, emoji: "⭐" },
  { name: "Solar Guardian", minStars: 230, emoji: "☀️" },
  { name: "Nebula Navigator", minStars: 320, emoji: "🌌" },
  { name: "Cluster Chief", minStars: 440, emoji: "✨" },
  { name: "Galaxy Commander", minStars: 600, emoji: "🛸" },
  { name: "Supercluster Admiral", minStars: 820, emoji: "🌠" },
  { name: "Universe Master", minStars: 1120, emoji: "💫" },
  { name: "Multiverse Monarch", minStars: 1550, emoji: "🌀" },
  { name: "Cosmic Sovereign", minStars: 2200, emoji: "👑" },
  { name: "Infinity Legend", minStars: 3200, emoji: "♾️" },
];

export function getLevel(stars: number): Level {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (stars >= l.minStars) level = l;
    else break;
  }
  return level;
}

export function getLevelIndex(stars: number): number {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (stars >= LEVELS[i].minStars) idx = i;
    else break;
  }
  return idx;
}

export function getNextLevel(stars: number): Level | null {
  for (const l of LEVELS) {
    if (stars < l.minStars) return l;
  }
  return null;
}
