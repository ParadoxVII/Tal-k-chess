import { Activity, CircleHelp, Moon, Sun } from "lucide-react";

type GameHeaderProps = {
  darkMode: boolean;
  isThinking: boolean;
  status: string;
  onToggleDarkMode: () => void;
};

export function GameHeader({
  darkMode,
  isThinking,
  status,
  onToggleDarkMode,
}: GameHeaderProps) {
  return (
    <header className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 pb-8">
      <div className="flex items-center gap-3">
        <div>
          <div className="font-mono text-[11px] font-bold uppercase tracking-[.22em] text-brand">
            Tal-k Chess
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-2 text-xs font-medium text-muted-foreground md:flex">
          <span className="size-2 rounded-full bg-brand" /> Engine online
        </span>
        <div className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
          <Activity
            size={14}
            className={isThinking ? "animate-pulse text-brand" : "text-brand"}
          />
          {status}
        </div>
        <button
          onClick={onToggleDarkMode}
          className="rounded-lg p-2 hover:bg-muted"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="rounded-lg p-2 hover:bg-muted" aria-label="Help">
          <CircleHelp size={17} />
        </button>
      </div>
    </header>
  );
}
