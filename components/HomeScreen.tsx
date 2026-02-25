"use client";

import { GameState, getLevel, getNextLevel } from "@/lib/types";

interface Props {
  gameState: GameState;
  onPlay: () => void;
  onProgress: () => void;
}

export default function HomeScreen({ gameState, onPlay, onProgress }: Props) {
  const level = getLevel(gameState.totalStars);
  const nextLevel = getNextLevel(gameState.totalStars);
  const mastered = gameState.pairs.filter((p) => p.box >= 5).length;
  const introduced = gameState.pairs.filter((p) => p.box > 0).length;
  const total = gameState.pairs.length;

  const progressToNext = nextLevel
    ? ((gameState.totalStars - level.minStars) /
        (nextLevel.minStars - level.minStars)) *
      100
    : 100;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 relative z-10">
      {/* Rocket */}
      <div className="text-8xl animate-float mb-2 select-none">🚀</div>

      {/* Title */}
      <h1 className="text-4xl md:text-6xl font-bold text-center mb-1 leading-tight">
        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
          Multiplication
        </span>
        <br />
        <span className="bg-gradient-to-r from-amber-300 via-pink-400 to-violet-400 bg-clip-text text-transparent">
          Galaxy
        </span>
      </h1>

      {/* Level badge */}
      <div className="mt-5 flex flex-col items-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20">
          <div className="text-2xl text-white font-bold text-center">
            {level.emoji} {level.name}
          </div>
          <div className="text-yellow-400 text-lg text-center mt-1">
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

      {/* Stats row */}
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
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-400">
            {gameState.bestStreak}
          </div>
          <div className="text-xs uppercase tracking-wide">Best Streak</div>
        </div>
      </div>

      {/* Play button */}
      <button
        onClick={onPlay}
        className="mt-8 px-14 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-2xl font-bold rounded-2xl
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
