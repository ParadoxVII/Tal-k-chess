import { Chess, Move } from "chess.js";
import { files, pieceGlyph } from "@/app/components/game/constants";

type PendingPromotion = { from: string; to: string; color: "w" | "b" };
type IllegalFlash = { from: string; to: string };
type GameOverInfo =
  | { type: "checkmate"; winner: "w" | "b" }
  | { type: "draw" };

type ChessBoardProps = {
  game: Chess;
  orientedBoard: string[][];
  selected: string | null;
  lastMove?: Move;
  playerColor: "w" | "b";
  pendingPromotion: PendingPromotion | null;
  illegalFlash: IllegalFlash | null;
  gameOverInfo: GameOverInfo | null;
  onSquareClick: (square: string) => void;
  onResolvePromotion: (promotion: "q" | "r" | "b" | "n") => void;
  onCancelPromotion: () => void;
  onPlayAgain: () => void;
};

const promotionChoices = [
  { piece: "q", label: "Queen" },
  { piece: "r", label: "Rook" },
  { piece: "b", label: "Bishop" },
  { piece: "n", label: "Knight" },
] as const;

export function ChessBoard({
  game,
  orientedBoard,
  selected,
  lastMove,
  playerColor,
  pendingPromotion,
  illegalFlash,
  gameOverInfo,
  onSquareClick,
  onResolvePromotion,
  onCancelPromotion,
  onPlayAgain,
}: ChessBoardProps) {
  return (
    <section className="min-w-0">
      <div className="relative mx-auto aspect-square w-full max-w-[760px] overflow-hidden rounded-2xl border border-line bg-card p-3 shadow-[0_18px_60px_rgba(34,65,53,.08)] sm:p-5">
        <div className="grid aspect-square h-full grid-cols-8 overflow-hidden rounded-lg border border-line">
          {orientedBoard.flat().map((square) => {
            const piece = game.get(square as any);
            const light =
              (files.indexOf(square[0]) + Number(square[1])) % 2 === 0;
            const isSelected = selected === square;
            const isLast = lastMove?.from === square || lastMove?.to === square;
            const isIllegal =
              illegalFlash?.from === square || illegalFlash?.to === square;

            return (
              <button
                key={square}
                onClick={() => onSquareClick(square)}
                aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : ""}`}
                className={`relative flex aspect-square min-h-0 items-center justify-center transition-colors ${light ? "bg-board-light" : "bg-board-dark"} ${isLast ? "shadow-[inset_0_0_0_4px_rgba(230,184,92,.62)]" : ""} ${isSelected ? "shadow-[inset_0_0_0_5px_#0d7560]" : ""} ${isIllegal ? "animate-[illegal-flash_0.5s_ease-out] shadow-[inset_0_0_0_5px_#b94b42]" : ""}`}
              >
                <span
                  className={`absolute left-1 top-1 font-mono text-[9px] font-bold ${light ? "text-[#789187]" : "text-[#e0eee6]"} ${Number(square[1]) === 8 ? "opacity-100" : "opacity-0"}`}
                >
                  {square[0]}
                </span>
                {piece && (
                  <span
                    className={`select-none text-[clamp(1.75rem,7vw,4.4rem)] leading-none ${piece.color === "w" ? "text-[#f9fbf8] drop-shadow-[0_2px_1px_rgba(29,53,43,.42)]" : "text-[#173128] drop-shadow-[0_2px_1px_rgba(255,255,255,.2)]"}`}
                  >
                    {pieceGlyph[piece.type]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {pendingPromotion && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/50 p-4 backdrop-blur-sm">
            <div className="rounded-xl border border-line bg-card p-4 shadow-lg">
              <p className="mb-3 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Promote pawn to
              </p>
              <div className="flex gap-2">
                {promotionChoices.map(({ piece, label }) => (
                  <button
                    key={piece}
                    onClick={() => onResolvePromotion(piece)}
                    aria-label={label}
                    className="flex size-14 items-center justify-center rounded-lg border border-line bg-background text-3xl hover:bg-muted"
                  >
                    <span
                      className={
                        pendingPromotion.color === "w"
                          ? "text-[#f9fbf8] drop-shadow-[0_2px_1px_rgba(29,53,43,.42)]"
                          : "text-[#173128]"
                      }
                    >
                      {pieceGlyph[piece]}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={onCancelPromotion}
                className="mt-3 w-full text-center text-xs text-muted-foreground hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {gameOverInfo && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/60 p-4 backdrop-blur-sm">
            <div className="animate-[pop-in_0.4s_ease-out] rounded-2xl border border-line bg-card px-8 py-7 text-center shadow-2xl">
              {gameOverInfo.type === "checkmate" ? (
                <>
                  <p
                    className={`text-3xl font-black ${gameOverInfo.winner === playerColor ? "text-brand" : "text-danger"}`}
                  >
                    {gameOverInfo.winner === playerColor
                      ? "Victory!"
                      : "Defeat"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Checkmate
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-black text-muted-foreground">
                    Draw
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nobody wins this time
                  </p>
                </>
              )}
              <button
                onClick={onPlayAgain}
                className="mt-5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90"
              >
                Play again
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
