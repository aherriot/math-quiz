"use client";

import { useState, useEffect, useCallback } from "react";
import { GameState, Screen } from "@/lib/types";
import { loadGameState, saveGameState, clearGameState } from "@/lib/storage";
import { createInitialState } from "@/lib/engine";
import Stars from "@/components/Stars";
import HomeScreen from "@/components/HomeScreen";
import QuizScreen from "@/components/QuizScreen";
import ProgressScreen from "@/components/ProgressScreen";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = loadGameState();
    setGameState(saved ?? createInitialState());
    setLoaded(true);
  }, []);

  // Persist state changes
  useEffect(() => {
    if (gameState && loaded) {
      saveGameState(gameState);
    }
  }, [gameState, loaded]);

  const handleReset = useCallback(() => {
    clearGameState();
    setGameState(createInitialState());
    setScreen("home");
  }, []);

  if (!loaded || !gameState) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center">
        <Stars />
        <div className="relative z-10 text-center">
          <div className="text-6xl animate-float">🚀</div>
          <div className="text-white/60 mt-4 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Stars />
      {screen === "home" && (
        <HomeScreen
          gameState={gameState}
          onPlay={() => setScreen("quiz")}
          onProgress={() => setScreen("progress")}
        />
      )}
      {screen === "quiz" && (
        <QuizScreen
          gameState={gameState}
          onUpdateState={setGameState}
          onBack={() => setScreen("home")}
        />
      )}
      {screen === "progress" && (
        <ProgressScreen
          gameState={gameState}
          onBack={() => setScreen("home")}
          onReset={handleReset}
        />
      )}
    </>
  );
}
