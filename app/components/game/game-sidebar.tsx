import {
  ChevronDown,
  Gauge,
  History,
  Mic,
  MicOff,
  Settings2,
  Volume2,
} from "lucide-react";
import { Move } from "chess.js";
import { Side, voiceOptions } from "@/app/components/game/constants";
import type { BotOptions } from "@/lib/chess/types";

type GameSidebarProps = {
  side: Side;
  preset: string;
  customSkill: number;
  options: BotOptions;
  voice: string;
  transcript: string;
  history: Move[];
  isThinking: boolean;
  isListening: boolean;
  supported: boolean;
  onChangeSide: (side: Side) => void;
  onChangePreset: (preset: string) => void;
  onChangeCustomSkill: (skill: number) => void;
  onChangeVoice: (voice: string) => void;
  onToggleListening: () => void;
};

export function GameSidebar({
  side,
  preset,
  customSkill,
  options,
  voice,
  transcript,
  history,
  isThinking,
  isListening,
  supported,
  onChangeSide,
  onChangePreset,
  onChangeCustomSkill,
  onChangeVoice,
  onToggleListening,
}: GameSidebarProps) {
  return (
    <aside className="flex flex-col gap-5">
      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">
              Your opponent
            </p>
            <h2 className="mt-1 text-xl font-semibold">Vox Engine</h2>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Gauge size={19} />
          </div>
        </div>

        <label
          className="mb-2 block text-xs font-semibold text-muted-foreground"
          htmlFor="side"
        >
          Play as
        </label>
        <select
          id="side"
          value={side}
          onChange={(e) => onChangeSide(e.target.value as Side)}
          className="mb-4 w-full rounded-lg border border-line bg-background px-3 py-3 text-sm font-semibold"
        >
          <option value="white">White</option>
          <option value="black">Black</option>
          <option value="random">Random</option>
        </select>

        <label
          className="mb-2 block text-xs font-semibold text-muted-foreground"
          htmlFor="difficulty"
        >
          Playing strength
        </label>
        <div className="relative">
          <select
            id="difficulty"
            value={preset}
            onChange={(e) => onChangePreset(e.target.value)}
            className="w-full appearance-none rounded-lg border border-line bg-background px-3 py-3 text-sm font-semibold"
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Master</option>
            <option>Custom</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-3.5 text-muted-foreground"
            size={16}
          />
        </div>

        {preset === "Custom" && (
          <label className="mt-5 block text-xs font-semibold text-muted-foreground">
            Skill level
            <input
              type="range"
              min="0"
              max="20"
              value={customSkill}
              onChange={(e) => onChangeCustomSkill(Number(e.target.value))}
              className="mt-3 w-full accent-brand"
            />
            <span className="float-right font-mono text-brand">
              {customSkill}/20
            </span>
          </label>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-background p-3">
            <span className="block text-muted-foreground">Skill level</span>
            <strong className="mt-1 block font-mono text-base">
              {options.skillLevel}/20
            </strong>
          </div>
          <div className="rounded-lg bg-background p-3">
            <span className="block text-muted-foreground">Search depth</span>
            <strong className="mt-1 block font-mono text-base">
              {options.depth} ply
            </strong>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">
              Voice accent
            </p>
            <h2 className="mt-1 text-lg font-semibold">Spoken moves</h2>
          </div>
          <Volume2 size={18} className="text-brand" />
        </div>
        <select
          value={voice}
          onChange={(e) => onChangeVoice(e.target.value)}
          className="w-full rounded-lg border border-line bg-background px-3 py-3 text-sm font-semibold"
        >
          {voiceOptions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

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
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => (
                <div key={i} className="contents">
                  <span className="font-mono text-xs text-muted-foreground">
                    {i + 1}.
                  </span>
                  <span className="font-mono text-xs font-semibold">
                    {history[i * 2]?.san || "—"}{" "}
                    <span className="text-muted-foreground">
                      {history[i * 2 + 1]?.san || ""}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 px-1 text-[11px] leading-5 text-muted-foreground">
        <Settings2 size={14} className="mt-0.5 shrink-0 text-brand" />
        <span>
          Board orientation follows your color. Engine settings apply to each
          response.
        </span>
      </div>
    </aside>
  );
}
