"use client";

import { useState } from "react";
import { GameState } from "@/lib/types";
import { getPairMastery } from "@/lib/engine";

interface Props {
  gameState: GameState;
  onBack: () => void;
  onReset: () => void;
}

const BOX_COLORS: Record<number, string> = {
  0: "bg-white/5 border-white/10",
  1: "bg-rose-500/40 border-rose-400/50",
  2: "bg-orange-500/40 border-orange-400/50",
  3: "bg-yellow-500/40 border-yellow-400/50",
  4: "bg-lime-500/40 border-lime-400/50",
  5: "bg-emerald-500/50 border-emerald-400/60",
};

const BOX_LABELS: Record<number, string> = {
  0: "Not started",
  1: "Learning",
  2: "Reviewing",
  3: "Familiar",
  4: "Known",
  5: "Mastered ⭐",
};

export default function ProgressScreen({ gameState, onBack, onReset }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    a: number;
    b: number;
  } | null>(null);

  const mastered = gameState.pairs.filter((p) => p.box >= 5).length;
  const introduced = gameState.pairs.filter((p) => p.box > 0).length;
  const total = gameState.pairs.length;
  const masteryPercent = Math.round((mastered / total) * 100);

  const selectedPair = selectedCell
    ? getPairMastery(selectedCell.a, selectedCell.b, gameState.pairs)
    : null;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-4 relative z-10">
      {/* Top bar */}
      <div className="w-full max-w-lg flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className="text-white/60 hover:text-white text-base transition-colors cursor-pointer px-2 py-1"
        >
          ← Back
        </button>
        <h2 className="text-xl font-bold text-white">📊 Progress Map</h2>
        <div className="w-16" />
      </div>

      {/* Summary */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 mb-4 text-center w-full max-w-lg">
        <div className="flex justify-around">
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {mastered}
            </div>
            <div className="text-xs text-white/60">Mastered</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">
              {introduced}
            </div>
            <div className="text-xs text-white/60">Introduced</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-fuchsia-400">
              {masteryPercent}%
            </div>
            <div className="text-xs text-white/60">Complete</div>
          </div>
        </div>
        {/* Overall progress bar */}
        <div className="mt-3 bg-white/10 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${masteryPercent}%` }}
          />
        </div>
      </div>

      {/* Multiplication grid */}
      <div className="w-full max-w-lg overflow-x-auto">
        <div
          className="grid gap-[3px] mx-auto"
          style={{
            gridTemplateColumns: `32px repeat(12, 1fr)`,
            maxWidth: 420,
          }}
        >
          {/* Header row */}
          <div className="text-white/40 text-xs font-bold flex items-center justify-center">
            ×
          </div>
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={`h-${i}`}
              className="text-white/60 text-xs font-bold flex items-center justify-center h-7"
            >
              {i + 1}
            </div>
          ))}

          {/* Grid rows */}
          {Array.from({ length: 12 }, (_, row) => (
            <>
              {/* Row header */}
              <div
                key={`r-${row}`}
                className="text-white/60 text-xs font-bold flex items-center justify-center w-8"
              >
                {row + 1}
              </div>
              {/* Cells */}
              {Array.from({ length: 12 }, (_, col) => {
                const a = row + 1;
                const b = col + 1;
                const pair = getPairMastery(a, b, gameState.pairs);
                const box = pair?.box ?? 0;
                const isSelected =
                  selectedCell?.a === a && selectedCell?.b === b;

                return (
                  <button
                    key={`c-${row}-${col}`}
                    onClick={() => setSelectedCell({ a, b })}
                    className={`aspect-square rounded-sm border text-[10px] font-medium flex items-center justify-center
                      transition-all duration-200 cursor-pointer
                      ${BOX_COLORS[box]}
                      ${isSelected ? "ring-2 ring-white scale-110 z-10" : "hover:scale-105"}
                    `}
                    title={`${a} × ${b} = ${a * b}`}
                  >
                    <span className="text-white/70">{a * b}</span>
                  </button>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Selected cell detail */}
      {selectedPair && selectedCell && (
        <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl px-5 py-3 border border-white/20 w-full max-w-lg animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xl font-bold text-white">
                {selectedCell.a} × {selectedCell.b} ={" "}
                {selectedCell.a * selectedCell.b}
              </div>
              <div
                className={`text-sm mt-1 ${selectedPair.box >= 5 ? "text-emerald-400" : selectedPair.box >= 3 ? "text-yellow-400" : selectedPair.box > 0 ? "text-rose-400" : "text-white/40"}`}
              >
                {BOX_LABELS[selectedPair.box]}
              </div>
            </div>
            {selectedPair.totalAttempts > 0 && (
              <div className="text-right">
                <div className="text-white/80 text-sm">
                  {selectedPair.totalCorrect}/{selectedPair.totalAttempts}{" "}
                  correct
                </div>
                <div className="text-white/50 text-xs">
                  {Math.round(
                    (selectedPair.totalCorrect / selectedPair.totalAttempts) *
                      100,
                  )}
                  % accuracy
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {[0, 1, 2, 3, 4, 5].map((box) => (
          <div key={box} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded-sm border ${BOX_COLORS[box]}`} />
            <span className="text-white/50 text-xs">
              {
                [
                  "New",
                  "Learning",
                  "Reviewing",
                  "Familiar",
                  "Known",
                  "Mastered",
                ][box]
              }
            </span>
          </div>
        ))}
      </div>

      {/* Reset */}
      <div className="mt-6 mb-4">
        {confirmReset ? (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-center animate-fade-in">
            <p className="text-white/80 text-sm mb-3">
              Are you sure? This will erase all progress!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  onReset();
                  setConfirmReset(false);
                }}
                className="px-5 py-2 bg-rose-500 text-white text-sm font-bold rounded-lg
                  hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-5 py-2 bg-white/10 text-white text-sm rounded-lg
                  hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="text-white/30 hover:text-white/60 text-sm transition-colors cursor-pointer"
          >
            Reset Progress
          </button>
        )}
      </div>
    </div>
  );
}
