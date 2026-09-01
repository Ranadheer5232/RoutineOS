import confetti from "canvas-confetti";

export const triggerFullCelebration = () => {
  // Center burst
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#2563eb", "#16a34a", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"],
  });

  // Left cannon
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#22c55e", "#3b82f6", "#fbbf24", "#a855f7"],
    });
  }, 180);

  // Right cannon
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#ec4899", "#f97316", "#06b6d4", "#84cc16"],
    });
  }, 360);
};

export const triggerAchievementUnlock = () => {
  confetti({
    particleCount: 60,
    spread: 100,
    origin: { y: 0.5 },
    colors: ["#ffd700", "#ffa500", "#22c55e", "#3b82f6"],
    shapes: ["star", "circle"],
  });
};
