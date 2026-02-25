"use client";

import { useMemo } from "react";

export default function Stars() {
  const stars = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: ((i * 73 + 31) % 1000) / 10,
      y: ((i * 47 + 13) % 1000) / 10,
      size: 1 + (i % 3),
      delay: ((i * 13) % 50) / 10,
      duration: 2 + (i % 4),
      opacity: 0.2 + (i % 5) * 0.15,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
