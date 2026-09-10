import { Chess, Move } from "chess.js";
import { RotateCcw, Volume2, VolumeX } from "lucide-react";
import { files, pieceGlyph } from "@/app/components/game/constants";

type ChessBoardProps = {
  game: Chess;
  orientedBoard: string[][];
  selected: string | null;
  lastMove?: Move;
  isThinking: boolean;
  voiceReady: boolean;
  supported: boolean;
  soundOn: boolean;
  onSquareClick: (square: string) => void;
  onReset: () => void;
  onToggleSound: () => void;
};

export function ChessBoard({
  game,
  orientedBoard,
  selected,
  lastMove,
  isThinking,
  voiceReady,
  supported,
  soundOn,
  onSquareClick,
  onReset,
  onToggleSound,
}: ChessBoardProps) {
  return (
    <section className="min-w-0">
      <div className="mx-auto aspect-square w-full max-w-[760px] overflow-hidden rounded-2xl border border-line bg-card p-3 shadow-[0_18px_60px_rgba(34,65,53,.08)] sm:p-5">
        <div className="grid aspect-square h-full grid-cols-8 overflow-hidden rounded-lg border border-line">
          {orientedBoard.flat().map((square) => {
            const piece = game.get(square as any);
            const dark =
              (files.indexOf(square[0]) + Number(square[1])) % 2 === 0;
            const isSelected = selected === square;
            const isLast = lastMove?.from === square || lastMove?.to === square;

            return (
              <button
                key={square}
                onClick={() => onSquareClick(square)}
                aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : ""}`}
                className={`relative flex aspect-square min-h-0 items-center justify-center transition-colors ${dark ? "bg-board-dark" : "bg-board-light"} ${isLast ? "shadow-[inset_0_0_0_4px_rgba(230,184,92,.62)]" : ""} ${isSelected ? "shadow-[inset_0_0_0_5px_#0d7560]" : ""}`}
              >
                <span
                  className={`absolute left-1 top-1 font-mono text-[9px] font-bold ${dark ? "text-[#e0eee6]" : "text-[#789187]"} ${Number(square[1]) === 8 ? "opacity-100" : "opacity-0"}`}
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
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex size-8 items-center justify-center rounded-full bg-card font-mono text-xs font-bold text-brand">
            {isThinking ? "AI" : "You"}
          </span>
          <span>
            {isThinking
              ? "Vox is considering the position…"
              : !voiceReady
                ? "Say a move or click a piece to begin."
                : supported
                  ? "Say a move or click a piece to begin."
                  : "Voice input is not available in this browser."}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold hover:bg-muted"
          >
            <RotateCcw size={14} /> New game
          </button>
          <button
            onClick={onToggleSound}
            className="rounded-lg border border-line bg-card p-2 hover:bg-muted"
            aria-label={soundOn ? "Mute voice" : "Enable voice"}
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>
    </section>
  );
}
