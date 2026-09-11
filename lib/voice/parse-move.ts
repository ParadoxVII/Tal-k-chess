import { Chess } from "chess.js";

const numberWords: Record<string, string> = {
  one: "1",
  won: "1",
  two: "2",
  three: "3",
  free: "3",
  four: "4",
  fore: "4",
  for: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  ate: "8",
};

const fileWords: Record<string, string> = {
  alpha: "a",
  apple: "a",
  bravo: "b",
  bee: "b",
  be: "b",
  charlie: "c",
  sea: "c",
  see: "c",
  cee: "c",
  delta: "d",
  dee: "d",
  echo: "e",
  foxtrot: "f",
  eff: "f",
  golf: "g",
  gee: "g",
  hotel: "h",
  aitch: "h",
};

const pieces: Record<string, string> = {
  king: "k",
  kings: "k",
  queen: "q",
  queens: "q",
  rook: "r",
  route: "r",
  tellher: "r",
  rooks: "r",
  rock: "r",
  rocks: "r",
  tower: "r",
  towers: "r",
  bishop: "b",
  bishops: "b",
  knight: "n",
  knights: "n",
  horse: "n",
  horses: "n",
  night: "n",
  nite: "n",
  nice: "n",
  pawn: "p",
  pawns: "p",
};

type LegalMove = {
  from: string;
  to: string;
  promotion?: string;
  piece: string;
  san: string;
};

const fillerWords = new Set<string>([
  "to",
  "the",
  "takes",
  "take",
  "captures",
  "capture",
  "at",
  "on",
  "move",
  "moves",
  "goes",
  "go",
  "please",
  "and",
  "then",
  ...Object.keys(pieces),
]);

function findCastleMove(lowerTranscript: string, legal: LegalMove[]) {
  if (!/castl/.test(lowerTranscript)) return null;
  const isQueenside = /queen|long/.test(lowerTranscript);
  const targetSan = isQueenside ? "O-O-O" : "O-O";
  const match = legal.find(
    (move) => move.san.replace(/[+#]/, "") === targetSan,
  );
  return match
    ? { from: match.from, to: match.to, promotion: match.promotion }
    : null;
}

type TargetSquare = { square: string; consumed: Set<number> };

function extractTargetSquare(normalized: string[]): TargetSquare | null {
  for (let index = 0; index < normalized.length; index += 1) {
    const word = normalized[index];
    if (/^[a-h][1-8]$/.test(word)) {
      return { square: word, consumed: new Set([index]) };
    }
    const next = normalized[index + 1];
    if (/^[a-h]$/.test(word) && next && /^[1-8]$/.test(next)) {
      return {
        square: `${word}${next}`,
        consumed: new Set([index, index + 1]),
      };
    }
  }
  return null;
}

type DisambiguationHint = { square?: string; file?: string; rank?: string };

/**
 * Finds a leftover origin-square hint (e.g. "a1", or just "a" for the a-file,
 * or "1" for the 1st rank) among the words that were not consumed by the
 * target square, so "rook a1 to a4" or "rook a to a4" can disambiguate
 * between two rooks that could otherwise both reach a4.
 */
function findDisambiguationHint(
  words: string[],
  normalized: string[],
  consumed: Set<number>,
): DisambiguationHint | null {
  const candidates: number[] = [];
  for (let index = 0; index < normalized.length; index += 1) {
    if (consumed.has(index) || fillerWords.has(words[index])) continue;
    candidates.push(index);
  }

  for (const index of candidates) {
    if (/^[a-h][1-8]$/.test(normalized[index])) {
      return { square: normalized[index] };
    }
  }
  for (const index of candidates) {
    if (/^[a-h]$/.test(normalized[index])) return { file: normalized[index] };
    if (/^[1-8]$/.test(normalized[index])) return { rank: normalized[index] };
  }
  return null;
}

export function parseSpokenMove(
  transcript: string,
  game: Chess,
): { from: string; to: string; promotion?: string } | null {
  const lower = transcript.toLowerCase();
  const legal = game.moves({ verbose: true }) as LegalMove[];

  const castleMove = findCastleMove(lower, legal);
  if (castleMove) return castleMove;

  const words = lower
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const normalized = words.map(
    (word) => fileWords[word] ?? numberWords[word] ?? word,
  );
  const coordinates = normalized.join("").match(/[a-h][1-8]/g) ?? [];
  if (coordinates.length >= 2)
    return (
      legal.find(
        (move) => move.from === coordinates[0] && move.to === coordinates[1],
      ) ?? null
    );

  const target = extractTargetSquare(normalized);
  if (!target) return null;

  const piece = words.map((word) => pieces[word]).find(Boolean) ?? "p";
  const candidates = legal.filter(
    (move) => move.to === target.square && move.piece === piece,
  );
  if (candidates.length <= 1) return candidates[0] ?? null;

  // Multiple pieces of the same type can reach this square (e.g. two rooks) —
  // look for a leftover origin hint (full square, file, or rank) to pick the
  // right one instead of guessing.
  const hint = findDisambiguationHint(words, normalized, target.consumed);
  if (hint?.square)
    return candidates.find((move) => move.from === hint.square) ?? null;
  if (hint?.file) {
    const byFile = candidates.filter((move) => move.from[0] === hint.file);
    if (byFile.length === 1) return byFile[0];
  }
  if (hint?.rank) {
    const byRank = candidates.filter((move) => move.from[1] === hint.rank);
    if (byRank.length === 1) return byRank[0];
  }
  return null;
}
