import type { BotOptions } from "@/lib/chess/types";

export const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

export const pieceGlyph: Record<string, string> = {
  p: "♟︎",
  n: "♞︎",
  b: "♝︎",
  r: "♜︎",
  q: "♛︎",
  k: "♚︎",
};

export const voiceOptions = [
  "Default voice",
  "Samantha",
  "Karen",
  "Moira",
  "Victoria",
  "Daniel",
  "Alex",
  "Google UK English Female",
  "Google US English",
  "Microsoft Zira",
  "Microsoft Hazel",
  "Thomas",
];

export const presets: Record<string, BotOptions> = {
  Beginner: { skillLevel: 0, depth: 2, timeLimitMs: 500 },
  Intermediate: { skillLevel: 10, depth: 6, timeLimitMs: 1200 },
  Master: { skillLevel: 20, depth: 14, timeLimitMs: 2500 },
};

export type Side = "white" | "black" | "random";
