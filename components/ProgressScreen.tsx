"use client";

import { Fragment, useState } from "react";
import { GameState, MODE_OPS, OP_SYMBOL, Op, answerOf } from "@/lib/types";
import { getFactMastery } from "@/lib/engine";

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

const OP_TABS: { op: Op; label: string }[] = [
  { op: "add", label: "➕" },
  { op: "sub", label: "➖" },
  { op: "mul", label: "✖️" },
  { op: "div", label: "➗" },
];

interface Grid {
  rows: number[];
  cols: number[];
  width: number;
  /** The fact a cell stands for, or null where the operation has no such fact. */
  operands: (row: number, col: number) => { a: number; b: number } | null;
  /** The number printed in the cell — the answer, except for division. */
  cellText: (row: number, col: number) => number;
  caption?: string;
}

/** Grid layout per operation: rows are the left operand, columns the right one. */
const GRIDS: Record<Op, Grid> = {
  add: {
    rows: range(1, 9),
    cols: range(1, 9),
    width: 380,
    operands: (a, b) => ({ a, b }),
    cellText: (a, b) => a + b,
  },
  sub: {
    rows: range(1, 18),
    cols: range(1, 9),
    width: 340,
    // Subtraction only defines a cell when the result isn't negative.
    operands: (a, b) => (b > a ? null : { a, b }),
    cellText: (a, b) => a - b,
  },
  mul: {
    rows: range(1, 12),
    cols: range(1, 12),
    width: 420,
    operands: (a, b) => ({ a, b }),
    cellText: (a, b) => a * b,
  },
  div: {
    // Rows are the quotient and columns the divisor, so the cell holds the
    // dividend — the times-table grid read backwards.
    rows: range(1, 12),
    cols: range(1, 12),
    width: 420,
    operands: (quotient, divisor) => ({ a: quotient * divisor, b: divisor }),
    cellText: (quotient, divisor) => quotient * divisor,
    caption: "cell ÷ column = row",
  },
};

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

export default function ProgressScreen({ gameState, onBack, onReset }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  // Open on the first operation of whatever mode the player was last using.
  const [op, setOp] = useState<Op>(MODE_OPS[gameState.mode][0]);
  const [selectedCell, setSelectedCell] = useState<{
    a: number;
    b: number;
  } | null>(null);

  const facts = gameState.facts.filter((f) => f.op === op);
  const mastered = facts.filter((f) => f.box >= 5).length;
  const introduced = facts.filter((f) => f.box > 0).length;
  const masteryPercent = Math.round((mastered / facts.length) * 100);

  const symbol = OP_SYMBOL[op];
  const { rows, cols, width, operands, cellText, caption } = GRIDS[op];

  const selectedOperands = selectedCell
    ? operands(selectedCell.a, selectedCell.b)
    : null;
  const selectedFact = selectedOperands
    ? getFactMastery(op, selectedOperands.a, selectedOperands.b, gameState.facts)
    : null;

  const selectMode = (next: Op) => {
    setOp(next);
    setSelectedCell(null);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-4 relative z-10">
      {/* Top bar */}
      <div className="w-full max-w-lg flex justify-between items-center mb-3">
        <button
          onClick={onBack}
          className="text-white/60 hover:text-white text-base transition-colors cursor-pointer px-2 py-1"
        >
          ← Back
        </button>
        <h2 className="text-xl font-bold text-white">📊 Progress Map</h2>
        <div className="w-16" />
      </div>

      {/* Operation tabs */}
      <div className="flex gap-2 mb-3">
        {OP_TABS.map((t) => (
          <button
            key={t.op}
            onClick={() => selectMode(t.op)}
            aria-pressed={op === t.op}
            className={`px-5 py-2 rounded-xl text-lg font-bold border transition-all duration-200 cursor-pointer
              ${
                op === t.op
                  ? "bg-gradient-to-b from-violet-500/40 to-fuchsia-500/30 border-fuchsia-400/60 text-white"
                  : "bg-white/5 border-white/15 text-white/60 hover:bg-white/10"
              }`}
          >
            {t.label}
          </button>
        ))}
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
            <div className="text-xs text-white/60">Started</div>
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

      {/* Fact grid */}
      {caption && (
        <div className="text-white/40 text-xs mb-2">{caption}</div>
      )}
      <div className="w-full max-w-lg overflow-x-auto">
        <div
          className="grid gap-[3px] mx-auto"
          style={{
            gridTemplateColumns: `32px repeat(${cols.length}, 1fr)`,
            maxWidth: width,
          }}
        >
          {/* Header row */}
          <div className="text-white/40 text-xs font-bold flex items-center justify-center">
            {symbol}
          </div>
          {cols.map((b) => (
            <div
              key={`h-${b}`}
              className="text-white/60 text-xs font-bold flex items-center justify-center h-7"
            >
              {b}
            </div>
          ))}

          {/* Grid rows */}
          {rows.map((a) => (
            <Fragment key={`r-${a}`}>
              <div className="text-white/60 text-xs font-bold flex items-center justify-center w-8">
                {a}
              </div>
              {cols.map((b) => {
                const ops = operands(a, b);
                if (!ops) {
                  return <div key={`c-${a}-${b}`} className="aspect-square" />;
                }
                const fact = getFactMastery(op, ops.a, ops.b, gameState.facts);
                const box = fact?.box ?? 0;
                const isSelected =
                  selectedCell?.a === a && selectedCell?.b === b;
                const result = cellText(a, b);

                return (
                  <button
                    key={`c-${a}-${b}`}
                    onClick={() => setSelectedCell({ a, b })}
                    className={`aspect-square rounded-sm border text-[10px] font-medium flex items-center justify-center
                      transition-all duration-200 cursor-pointer
                      ${BOX_COLORS[box]}
                      ${isSelected ? "ring-2 ring-white scale-110 z-10" : "hover:scale-105"}
                    `}
                    title={`${ops.a} ${symbol} ${ops.b} = ${answerOf({ op, ...ops })}`}
                  >
                    <span className="text-white/70">{result}</span>
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Selected cell detail */}
      {selectedFact && selectedCell && (
        <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl px-5 py-3 border border-white/20 w-full max-w-lg animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xl font-bold text-white">
                {selectedOperands!.a} {symbol} {selectedOperands!.b} ={" "}
                {answerOf({ op, ...selectedOperands! })}
              </div>
              <div
                className={`text-sm mt-1 ${selectedFact.box >= 5 ? "text-emerald-400" : selectedFact.box >= 3 ? "text-yellow-400" : selectedFact.box > 0 ? "text-rose-400" : "text-white/40"}`}
              >
                {BOX_LABELS[selectedFact.box]}
              </div>
            </div>
            {selectedFact.totalAttempts > 0 && (
              <div className="text-right">
                <div className="text-white/80 text-sm">
                  {selectedFact.totalCorrect}/{selectedFact.totalAttempts}{" "}
                  correct
                </div>
                <div className="text-white/50 text-xs">
                  {Math.round(
                    (selectedFact.totalCorrect / selectedFact.totalAttempts) *
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
