import { Chess } from "chess.js";
import type { BotOptions, ChessBotAdapter } from "./types";

type ScoredMove = {
  from: string;
  to: string;
  promotion?: string;
  score: number;
};

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

/**
 * In-process chess "bot". It has no notion of board state of its own —
 * every call reconstructs a fresh `Chess` instance from the FEN it is
 * given and picks from that position's own legal move list. This makes
 * illegal or stale moves structurally impossible: chess.js already
 * handles legality, castling, en passant, and promotion.
 */
export class LegalMoveBot implements ChessBotAdapter {
  id = "legal-move-bot";
  name = "Vox Engine";
  private options: BotOptions = {};

  setOptions(options: BotOptions) {
    this.options = { ...this.options, ...options };
  }

  async getBestMove(fen: string, options: BotOptions = {}): Promise<string> {
    this.setOptions(options);
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true }) as Array<{
      from: string;
      to: string;
      promotion?: string;
      san: string;
      captured?: string;
    }>;

    if (moves.length === 0) {
      throw new Error("No legal moves available");
    }

    const scored: ScoredMove[] = moves.map((move) => {
      let score = 0;
      if (move.captured) score += PIECE_VALUES[move.captured] ?? 0;
      if (move.promotion) score += PIECE_VALUES[move.promotion] ?? 0;
      if (move.san.includes("#")) score += 100;
      else if (move.san.includes("+")) score += 0.5;
      return {
        from: move.from,
        to: move.to,
        promotion: move.promotion,
        score,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    // Higher skill narrows the pool toward the strongest moves; lower
    // skill stays closer to a uniform random choice among legal moves.
    const skill = Math.max(0, Math.min(20, this.options.skillLevel ?? 10));
    const poolSize = Math.max(1, Math.round(scored.length * (1 - skill / 22)));
    const pool = scored.slice(0, poolSize);
    const choice = pool[Math.floor(Math.random() * pool.length)];

    const thinkTime = Math.max(
      50,
      Math.min(1200, this.options.timeLimitMs ?? 300),
    );
    await new Promise((resolve) => setTimeout(resolve, thinkTime));

    return `${choice.from}${choice.to}${choice.promotion ?? ""}`;
  }

  dispose() {
    // No worker or external resources to release.
  }
}
