import { History, Mic, MicOff } from "lucide-react";
import { Move } from "chess.js";

type GameSidebarProps = {
  transcript: string;
  history: Move[];
  pgn: string;
  isThinking: boolean;
  isListening: boolean;
  supported: boolean;
  onToggleListening: () => void;
};

export function GameSidebar({
  transcript,
  history,
  pgn,
  isThinking,
  isListening,
  supported,
  onToggleListening,
}: GameSidebarProps) {
  return (
    <aside className="flex flex-col gap-5">
      <button
        onClick={onToggleListening}
        disabled={!supported || isThinking}
        className={`flex items-center justify-between rounded-2xl border p-5 text-left transition-colors ${isListening ? "border-brand bg-brand text-brand-foreground" : "border-line bg-card hover:bg-muted"}`}
      >
        <div>
          <p
            className={`text-xs font-bold uppercase tracking-[.16em] ${isListening ? "text-brand-foreground/70" : "text-muted-foreground"}`}
          >
            Voice control
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {isListening ? "Listening now" : "Speak your move"}
          </h2>
          <p
            className={`mt-1 text-xs ${isListening ? "text-brand-foreground/75" : "text-muted-foreground"}`}
          >
            {transcript || "Try “knight to f3” or “e4”"}
          </p>
        </div>
        <div
          className={`flex size-11 items-center justify-center rounded-full ${isListening ? "bg-brand-foreground text-brand" : "bg-brand/10 text-brand"}`}
        >
          {isListening ? <MicOff size={19} /> : <Mic size={19} />}
        </div>
      </button>

      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <History size={16} className="text-brand" /> Move history
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground">
            {history.length} moves
          </span>
        </div>
        <div className="max-h-52 overflow-auto">
          {history.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Your moves will appear here.
            </p>
          ) : (
            <p className="font-mono text-xs leading-6 text-foreground">{pgn}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
