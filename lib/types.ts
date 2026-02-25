export interface PairState {
  a: number;
  b: number;
  box: number; // 0=not introduced, 1=learning, 2=reviewing, 3=familiar, 4=known, 5=mastered
  correctStreak: number;
  totalCorrect: number;
  totalAttempts: number;
  lastSeen: number;
}

export interface GameState {
  pairs: PairState[];
  totalStars: number;
  currentStreak: number;
  bestStreak: number;
  totalAnswered: number;
}

export type Screen = "home" | "quiz" | "progress";

export type Level = { name: string; minStars: number; emoji: string };

export const LEVELS: readonly Level[] = [
  { name: "Space Cadet", minStars: 0, emoji: "🚀" },
  { name: "Star Pilot", minStars: 25, emoji: "⭐" },
  { name: "Moon Walker", minStars: 75, emoji: "🌙" },
  { name: "Planet Explorer", minStars: 150, emoji: "🪐" },
  { name: "Comet Chaser", minStars: 300, emoji: "☄️" },
  { name: "Nebula Navigator", minStars: 500, emoji: "🌌" },
  { name: "Galaxy Commander", minStars: 800, emoji: "🛸" },
  { name: "Universe Master", minStars: 1200, emoji: "✨" },
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
