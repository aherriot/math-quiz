"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameState, PairState, getLevel } from "@/lib/types";
import { selectNextPair, processAnswer } from "@/lib/engine";

interface Props {
  gameState: GameState;
  onUpdateState: (state: GameState) => void;
  onBack: () => void;
}

type Phase = "introducing" | "asking" | "correct" | "wrong" | "levelup";

const ENCOURAGEMENTS = [
  "Amazing! 🌟",
  "Stellar! 💫",
  "Fantastic! 🎉",
  "Super! 🦸",
  "Brilliant! ✨",
  "Out of this world! 🪐",
  "You rock! 🚀",
  "Wow! 🌈",
];

const WRONG_ENCOURAGEMENTS = [
  "Almost there! You'll get it! 💪",
  "Keep going, space explorer! 🚀",
  "Don't give up! 🌟",
  "You're learning! That's what counts! ⭐",
  "Practice makes perfect! 💫",
];

export default function QuizScreen({
  gameState,
  onUpdateState,
  onBack,
}: Props) {
  const [phase, setPhase] = useState<Phase>("asking");
  const [currentPair, setCurrentPair] = useState<PairState | null>(null);

  const [answer, setAnswer] = useState("");
  const [starsEarned, setStarsEarned] = useState(0);
  const [displayA, setDisplayA] = useState(0);
  const [displayB, setDisplayB] = useState(0);
  const [encouragement, setEncouragement] = useState("");
  const [newLevelName, setNewLevelName] = useState("");
  const [newLevelEmoji, setNewLevelEmoji] = useState("");
  const [animKey, setAnimKey] = useState(0); // force re-trigger animations
  const [starBursts, setStarBursts] = useState<
    {
      id: number;
      x: number;
      y: number;
      tx: number;
      ty: number;
      emoji: string;
    }[]
  >([]);

  const lastPairRef = useRef<{ a: number; b: number } | undefined>(undefined);
  const initializedRef = useRef(false);

  const pickNext = useCallback((state: GameState) => {
    const { pair, isNew: isNewPair } = selectNextPair(
      state,
      lastPairRef.current,
    );
    setCurrentPair(pair);
    setAnswer("");
    setAnimKey((k) => k + 1);

    const flip = pair.a !== pair.b && Math.random() > 0.5;
    setDisplayA(flip ? pair.b : pair.a);
    setDisplayB(flip ? pair.a : pair.b);

    setPhase(isNewPair ? "introducing" : "asking");
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      pickNext(gameState);
    }
  }, [gameState, pickNext]);

  const handleSubmit = useCallback(() => {
    if (!currentPair || !answer) return;
    const numAnswer = parseInt(answer, 10);
    if (isNaN(numAnswer)) return;

    const result = processAnswer(gameState, currentPair, numAnswer);
    lastPairRef.current = { a: currentPair.a, b: currentPair.b };

    if (result.correct) {
      setStarsEarned(result.starsEarned);
      setEncouragement(
        ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)],
      );

      // Star burst effect — pre-compute random positions
      const bursts = Array.from({ length: result.starsEarned * 3 }, (_, i) => ({
        id: Date.now() + i,
        x: 40 + Math.random() * 20,
        y: 30 + Math.random() * 20,
        tx: (Math.random() - 0.5) * 200,
        ty: -50 - Math.random() * 150,
        emoji: ["⭐", "🌟", "✨", "💫"][i % 4],
      }));
      setStarBursts(bursts);
      setTimeout(() => setStarBursts([]), 1200);

      if (result.leveledUp) {
        const newLevel = getLevel(result.newState.totalStars);
        setNewLevelName(newLevel.name);
        setNewLevelEmoji(newLevel.emoji);
        setPhase("levelup");
      } else {
        setPhase("correct");
      }
    } else {
      setEncouragement(
        WRONG_ENCOURAGEMENTS[
          Math.floor(Math.random() * WRONG_ENCOURAGEMENTS.length)
        ],
      );
      setPhase("wrong");
    }

    onUpdateState(result.newState);
  }, [gameState, currentPair, answer, onUpdateState]);

  const handleNext = useCallback(() => {
    pickNext(gameState);
  }, [gameState, pickNext]);

  const handleIntroduced = useCallback(() => {
    if (currentPair) {
      const newPairs = gameState.pairs.map((p) => {
        if (p.a === currentPair.a && p.b === currentPair.b && p.box === 0) {
          return { ...p, box: 1 };
        }
        return p;
      });
      onUpdateState({ ...gameState, pairs: newPairs });
    }
    setPhase("asking");
  }, [gameState, currentPair, onUpdateState]);

  // Keyboard support — placed after handler definitions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === "asking") {
        if (e.key >= "0" && e.key <= "9" && answer.length < 3) {
          setAnswer((prev) => prev + e.key);
        } else if (e.key === "Backspace") {
          setAnswer((prev) => prev.slice(0, -1));
        } else if (e.key === "Enter" && answer.length > 0) {
          handleSubmit();
        }
      } else if (
        phase === "correct" ||
        phase === "wrong" ||
        phase === "levelup"
      ) {
        if (e.key === "Enter" || e.key === " ") {
          handleNext();
        }
      } else if (phase === "introducing") {
        if (e.key === "Enter" || e.key === " ") {
          handleIntroduced();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, answer, handleSubmit, handleNext, handleIntroduced]);

  const handleNumpad = (key: string) => {
    if (key === "backspace") {
      setAnswer((prev) => prev.slice(0, -1));
    } else if (key === "submit") {
      handleSubmit();
    } else {
      if (answer.length < 3) {
        setAnswer((prev) => prev + key);
      }
    }
  };

  if (!currentPair) return null;

  const correctAnswer = currentPair.a * currentPair.b;
  const streak = gameState.currentStreak;

  const numpadColors = [
    "from-pink-500/30 to-pink-600/30 border-pink-400/30",
    "from-violet-500/30 to-violet-600/30 border-violet-400/30",
    "from-blue-500/30 to-blue-600/30 border-blue-400/30",
    "from-cyan-500/30 to-cyan-600/30 border-cyan-400/30",
    "from-teal-500/30 to-teal-600/30 border-teal-400/30",
    "from-emerald-500/30 to-emerald-600/30 border-emerald-400/30",
    "from-amber-500/30 to-amber-600/30 border-amber-400/30",
    "from-orange-500/30 to-orange-600/30 border-orange-400/30",
    "from-rose-500/30 to-rose-600/30 border-rose-400/30",
    "from-fuchsia-500/30 to-fuchsia-600/30 border-fuchsia-400/30",
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-4 relative z-10">
      {/* Star burst effect */}
      {starBursts.map((s) => (
        <div
          key={s.id}
          className="fixed text-3xl pointer-events-none z-50 animate-star-burst"
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              "--tx": `${s.tx}px`,
              "--ty": `${s.ty}px`,
            } as React.CSSProperties
          }
        >
          {s.emoji}
        </div>
      ))}

      {/* Top bar */}
      <div className="w-full max-w-md flex justify-between items-center mb-2">
        <button
          onClick={onBack}
          className="text-white/60 hover:text-white text-base transition-colors cursor-pointer px-2 py-1"
        >
          ← Base
        </button>
        <div className="flex items-center gap-3">
          {streak >= 3 && (
            <span className="text-orange-400 font-bold animate-pulse text-sm">
              🔥 {streak}
            </span>
          )}
          <span className="text-yellow-400 text-sm font-medium">
            ⭐ {gameState.totalStars}
          </span>
        </div>
      </div>

      <div
        className="flex-1 flex flex-col items-center justify-center w-full max-w-sm"
        key={animKey}
      >
        {/* INTRODUCING phase */}
        {phase === "introducing" && (
          <div className="text-center animate-bounce-in">
            <div className="text-lg text-fuchsia-400 font-bold mb-3 animate-pulse">
              ✨ New Fact! ✨
            </div>
            <div className="bg-white/10 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-xl shadow-fuchsia-500/10">
              <div className="text-5xl md:text-6xl font-bold text-white leading-tight">
                {displayA} × {displayB}
              </div>
              <div className="text-5xl md:text-6xl font-bold text-amber-400 mt-2">
                = {correctAnswer}
              </div>
              <div className="text-white/50 text-base mt-4">
                Remember this one!
              </div>
            </div>
            <button
              onClick={handleIntroduced}
              className="mt-6 px-10 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xl font-bold rounded-xl
                shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Got it! 👍
            </button>
          </div>
        )}

        {/* ASKING phase */}
        {phase === "asking" && (
          <div className="text-center w-full animate-fade-in">
            {/* Question */}
            <div className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              {displayA} × {displayB} ={" "}
              <span className="text-fuchsia-400">?</span>
            </div>

            {/* Answer display */}
            <div className="bg-white/10 rounded-2xl p-4 mb-5 min-h-[68px] flex items-center justify-center border-2 border-white/20 backdrop-blur-sm">
              <span className="text-4xl md:text-5xl font-bold text-white tabular-nums">
                {answer || (
                  <span className="text-white/20 text-3xl">type answer</span>
                )}
              </span>
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => handleNumpad(String(n))}
                  className={`h-14 text-2xl font-bold rounded-xl bg-gradient-to-b ${numpadColors[n - 1]}
                    text-white border active:scale-90 hover:brightness-125 transition-all duration-100 cursor-pointer select-none`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => handleNumpad("backspace")}
                className="h-14 text-xl font-bold rounded-xl bg-gradient-to-b from-rose-500/20 to-rose-600/20
                  text-rose-300 border border-rose-500/30 active:scale-90 hover:brightness-125 transition-all duration-100 cursor-pointer select-none"
              >
                ⌫
              </button>
              <button
                onClick={() => handleNumpad("0")}
                className={`h-14 text-2xl font-bold rounded-xl bg-gradient-to-b ${numpadColors[9]}
                  text-white border active:scale-90 hover:brightness-125 transition-all duration-100 cursor-pointer select-none`}
              >
                0
              </button>
              <button
                onClick={() => handleNumpad("submit")}
                className="h-14 text-2xl font-bold rounded-xl bg-gradient-to-b from-emerald-500/30 to-emerald-600/30
                  text-emerald-300 border border-emerald-500/30 active:scale-90 hover:brightness-125 transition-all duration-100 cursor-pointer select-none
                  disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={answer.length === 0}
              >
                ✓
              </button>
            </div>
          </div>
        )}

        {/* CORRECT phase */}
        {phase === "correct" && (
          <div className="text-center animate-bounce-in">
            <div className="text-7xl mb-2 animate-wiggle">🌟</div>
            <div className="text-3xl font-bold text-emerald-400 mb-1">
              {encouragement}
            </div>
            <div className="text-2xl text-white/90 mb-2">
              {displayA} × {displayB} = {correctAnswer}
            </div>
            <div className="text-yellow-400 text-xl animate-float-up">
              +{starsEarned} ⭐
            </div>
            {streak >= 3 && (
              <div className="text-orange-400 text-lg mt-1 font-bold animate-pulse">
                🔥 {streak} in a row!
              </div>
            )}
            <button
              onClick={handleNext}
              className="mt-5 px-10 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xl font-bold rounded-xl
                shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Next →
            </button>
          </div>
        )}

        {/* WRONG phase */}
        {phase === "wrong" && (
          <div className="text-center animate-shake">
            <div className="text-5xl mb-3">💪</div>
            <div className="text-xl text-rose-400 font-bold mb-3">
              Not quite!
            </div>
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-md border border-white/20 mb-3 shadow-xl">
              <div className="text-white/60 text-base mb-2">The answer is:</div>
              <div className="text-4xl md:text-5xl font-bold text-white">
                {displayA} × {displayB} ={" "}
                <span className="text-amber-400">{correctAnswer}</span>
              </div>
            </div>
            <div className="text-white/60 text-base">{encouragement}</div>
            <button
              onClick={handleNext}
              className="mt-5 px-10 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xl font-bold rounded-xl
                shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Continue →
            </button>
          </div>
        )}

        {/* LEVEL UP phase */}
        {phase === "levelup" && (
          <div className="text-center animate-bounce-in">
            <div className="text-7xl mb-2 animate-wiggle">{newLevelEmoji}</div>
            <div className="text-2xl text-fuchsia-400 font-bold mb-1">
              🎉 LEVEL UP! 🎉
            </div>
            <div className="bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-2xl p-6 backdrop-blur-md border border-fuchsia-400/30 mb-3">
              <div className="text-white/60 text-sm mb-1">You are now a</div>
              <div className="text-3xl md:text-4xl font-bold text-white">
                {newLevelEmoji} {newLevelName}
              </div>
            </div>
            <div className="text-yellow-400 text-xl">
              ⭐ {gameState.totalStars} stars collected!
            </div>
            <button
              onClick={handleNext}
              className="mt-5 px-10 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xl font-bold rounded-xl
                shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Keep Going! 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
