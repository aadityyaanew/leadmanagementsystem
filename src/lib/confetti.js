import confetti from "canvas-confetti";

export function fireAdmissionConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10b981", "#3b82f6", "#6366f1", "#f59e0b"],
    });
  } catch (e) {
    // Graceful fallback if window or canvas is unavailable
  }
}
