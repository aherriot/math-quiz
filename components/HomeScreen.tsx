"use client";

import {
  GameState,
  LEVELS,
  MODES,
  Mode,
  getLevel,
  getLevelIndex,
  getNextLevel,
} from "@/lib/types";
import { factsInMode } from "@/lib/engine";

interface Props {
  gameState: GameState;
  onPlay: () => void;
  onProgress: () => void;
  onSelectMode: (mode: Mode) => void;
  onTogglePracticeAll: () => void;
}

export default function HomeScreen({
  gameState,
  onPlay,
  onProgress,
  onSelectMode,
  onTogglePracticeAll,
}: Props) {
  const level = getLevel(gameState.totalStars);
  const levelIndex = getLevelIndex(gameState.totalStars);
  const nextLevel = getNextLevel(gameState.totalStars);

  const pool = factsInMode(gameState);
  const mastered = pool.filter((f) => f.box >= 5).length;
  const introduced = pool.filter((f) => f.box > 0).length;
  const total = pool.length;

  const progressToNext = nextLevel
    ? ((gameState.totalStars - level.minStars) /
        (nextLevel.minStars - level.minStars)) *
      100
    : 100;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 relative z-10">
      {/* Rocket */}
      <div className="text-7xl animate-float mb-2 select-none">🚀</div>

      {/* Title */}
      <h1 className="text-4xl md:text-6xl font-bold text-center mb-1 leading-tight">
        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
          Math
        </span>
        <br />
        <span className="bg-gradient-to-r from-amber-300 via-pink-400 to-violet-400 bg-clip-text text-transparent">
          Galaxy
        </span>
      </h1>

      {/* Mode picker */}
      <div className="mt-5 grid grid-cols-3 gap-2 w-full max-w-sm">
        {MODES.map((m) => {
          const selected = gameState.mode === m.mode;
          return (
            <button
              key={m.mode}
              onClick={() => onSelectMode(m.mode)}
              aria-pressed={selected}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer
                ${m.mode === "mixed" ? "col-span-3" : ""}
                ${
                  selected
                    ? "bg-gradient-to-b from-violet-500/40 to-fuchsia-500/30 border-fuchsia-400/60 scale-105 shadow-lg shadow-fuchsia-500/20"
                    : "bg-white/5 border-white/15 hover:bg-white/10"
                }`}
            >
              <span className="text-xl leading-none">{m.emoji}</span>
              <span
                className={`text-xs font-bold ${selected ? "text-white" : "text-white/60"}`}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Already-know-them-all switch */}
      <button
        onClick={onTogglePracticeAll}
        role="switch"
        aria-checked={gameState.practiceAll}
        className="mt-3 w-full max-w-sm flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/15
          bg-white/5 hover:bg-white/10 transition-all duration-200 cursor-pointer text-left"
      >
        <span
          className={`shrink-0 w-11 h-6 rounded-full p-0.5 transition-colors duration-200
            ${gameState.practiceAll ? "bg-emerald-500" : "bg-white/20"}`}
        >
          <span
            className={`block w-5 h-5 rounded-full bg-white transition-transform duration-200
              ${gameState.practiceAll ? "translate-x-5" : ""}`}
          />
        </span>
        <span>
          <span className="block text-sm font-bold text-white">
            I already know these
          </span>
          <span className="block text-xs text-white/50">
            {gameState.practiceAll
              ? "Every fact is fair game — no new-fact cards"
              : "Teach me new facts one at a time"}
          </span>
        </span>
      </button>

      {/* Level badge */}
      <div className="mt-5 flex flex-col items-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20">
          <div className="text-2xl text-white font-bold text-center">
            {level.emoji} {level.name}
          </div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 text-center mt-0.5">
            Rank {levelIndex + 1} of {LEVELS.length}
          </div>
          {/* One pip per rank, filled up to the one reached */}
          <div className="mt-2 flex justify-center gap-1">
            {LEVELS.map((l, i) => (
              <span
                key={l.name}
                className={`w-1.5 h-1.5 rounded-full ${
                  i <= levelIndex ? "bg-amber-400" : "bg-white/15"
                }`}
              />
            ))}
          </div>
          <div className="text-yellow-400 text-lg text-center mt-2">
            ⭐ {gameState.totalStars} stars
          </div>
        </div>

        {/* Progress to next level */}
        {nextLevel && (
          <div className="mt-3 w-56">
            <div className="bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              />
            </div>
            <div className="text-white/50 text-sm mt-1 text-center">
              {nextLevel.minStars - gameState.totalStars} stars to{" "}
              {nextLevel.emoji} {nextLevel.name}
            </div>
          </div>
        )}
      </div>

      {/* Stats row — scoped to the selected mode */}
      <div className="flex gap-6 mt-6 text-white/80">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">{mastered}</div>
          <div className="text-xs uppercase tracking-wide">Mastered</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-fuchsia-400">
            {introduced}
          </div>
          <div className="text-xs uppercase tracking-wide">Learning</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400">{total}</div>
          <div className="text-xs uppercase tracking-wide">Total</div>
        </div>
      </div>

      {/* Play button */}
      <button
        onClick={onPlay}
        className="mt-7 px-14 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-2xl font-bold rounded-2xl
          shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/50 hover:scale-105
          active:scale-95 transition-all duration-200 cursor-pointer"
      >
        🚀 Blast Off!
      </button>

      {/* Progress button */}
      <button
        onClick={onProgress}
        className="mt-4 px-8 py-3 bg-white/10 text-white text-lg rounded-xl border border-white/20
          hover:bg-white/20 active:scale-95 transition-all duration-200 cursor-pointer"
      >
        📊 Progress Map
      </button>
    </div>
  );
}
