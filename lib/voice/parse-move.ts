import { Chess } from "chess.js";
import defaultLexicon from "./chess_speech_lexicon.json";

type Lexicon = {
  files: Record<string, string>;
  numbers: Record<string, string>;
  pieces: Record<string, string>;
  fillerWords?: string[];
  aliases?: Array<[string, string]>;
  boosts?: Record<string, number>;
};

type LegalMove = {
  from: string;
  to: string;
  promotion?: string;
  piece: string;
  san: string;
};

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

function findDisambiguationHint(
  words: string[],
  normalized: string[],
  consumed: Set<number>,
  fillerWords: Set<string>,
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

/**
 * Core parser that requires a lexicon JSON to be passed in.
 * Returns a legal move or null.
 */
export function parseSpokenMoveWithLexicon(
  transcript: string,
  game: Chess,
  lexicon: Lexicon,
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
    (word) => lexicon.files[word] ?? lexicon.numbers[word] ?? word,
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

  const piece = words.map((word) => lexicon.pieces[word]).find(Boolean) ?? "p";
  const candidates = legal.filter(
    (move) => move.to === target.square && move.piece === piece,
  );
  if (candidates.length <= 1) return candidates[0] ?? null;

  const fillerSet = new Set<string>([
    ...(lexicon.fillerWords ?? []),
    ...Object.keys(lexicon.pieces),
  ]);
  const hint = findDisambiguationHint(
    words,
    normalized,
    target.consumed,
    fillerSet,
  );
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

// Convenience wrapper for existing call sites: uses the master/default lexicon.
// New code should call `parseSpokenMoveWithLexicon` and supply a custom lexicon.
export function parseSpokenMove(transcript: string, game: Chess) {
  return parseSpokenMoveWithLexicon(
    transcript,
    game,
    defaultLexicon as Lexicon,
  );
}
