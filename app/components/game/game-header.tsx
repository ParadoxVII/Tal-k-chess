"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ChevronDown,
  Menu,
  Moon,
  RotateCcw,
  Sun,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Side, voiceOptions } from "@/app/components/game/constants";

type GameHeaderProps = {
  darkMode: boolean;
  isThinking: boolean;
  status: string;
  soundOn: boolean;
  side: Side;
  preset: string;
  customSkill: number;
  voice: string;
  voiceSilenceMs: number;
  voiceHotkey: string;
  onToggleDarkMode: () => void;
  onToggleSound: () => void;
  onReset: () => void;
  onChangeSide: (side: Side) => void;
  onChangePreset: (preset: string) => void;
  onChangeCustomSkill: (skill: number) => void;
  onChangeVoice: (voice: string) => void;
  onChangeVoiceSilenceMs: (ms: number) => void;
  onChangeVoiceHotkey: (key: string) => void;
};

export function GameHeader({
  darkMode,
  isThinking,
  status,
  soundOn,
  side,
  preset,
  customSkill,
  voice,
  voiceSilenceMs,
  voiceHotkey,
  onToggleDarkMode,
  onToggleSound,
  onReset,
  onChangeSide,
  onChangePreset,
  onChangeCustomSkill,
  onChangeVoice,
  onChangeVoiceSilenceMs,
  onChangeVoiceHotkey,
}: GameHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [capturingHotkey, setCapturingHotkey] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  function startCapturingHotkey() {
    setCapturingHotkey(true);
    const handleNextKey = (event: KeyboardEvent) => {
      event.preventDefault();
      window.removeEventListener("keydown", handleNextKey, true);
      setCapturingHotkey(false);
      if (event.key === "Escape") return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      onChangeVoiceHotkey(key);
    };
    window.addEventListener("keydown", handleNextKey, true);
  }

  return (
    <header className="relative mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 pb-8">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[.22em] text-brand">
        Tal-k Chess
      </div>

      <div className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
        <Activity
          size={14}
          className={isThinking ? "animate-pulse text-brand" : "text-brand"}
        />
        {status}
      </div>

      <div className="flex items-center gap-2">
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
        <button
          onClick={onToggleDarkMode}
          className="rounded-lg border border-line bg-card p-2 hover:bg-muted"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg border border-line bg-card p-2 hover:bg-muted"
          aria-label="Settings menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={15} /> : <Menu size={15} />}
        </button>
      </div>

      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-line bg-card p-5 shadow-xl"
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">
            Opponent
          </p>
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
            className="mb-4 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm font-semibold"
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
          <div className="relative mb-4">
            <select
              id="difficulty"
              value={preset}
              onChange={(e) => onChangePreset(e.target.value)}
              className="w-full appearance-none rounded-lg border border-line bg-background px-3 py-2 text-sm font-semibold"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Master</option>
              <option>Custom</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-2.5 text-muted-foreground"
              size={16}
            />
          </div>

          {preset === "Custom" && (
            <label className="mb-4 block text-xs font-semibold text-muted-foreground">
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

          <hr className="my-4 border-line" />

          <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">
            Voice
          </p>
          <label
            className="mb-2 block text-xs font-semibold text-muted-foreground"
            htmlFor="voice"
          >
            Spoken move accent
          </label>
          <select
            id="voice"
            value={voice}
            onChange={(e) => onChangeVoice(e.target.value)}
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm font-semibold"
          >
            {voiceOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <label className="mt-4 block text-xs font-semibold text-muted-foreground">
            Listening pause length
            <input
              type="range"
              min="1000"
              max="4000"
              step="200"
              value={voiceSilenceMs}
              onChange={(e) => onChangeVoiceSilenceMs(Number(e.target.value))}
              className="mt-3 w-full accent-brand"
            />
            <span className="float-right font-mono text-brand">
              {(voiceSilenceMs / 1000).toFixed(1)}s
            </span>
          </label>
          <p className="mt-1 text-[11px] text-muted-foreground">
            How long to wait after you stop talking before submitting the move.
          </p>

          <label className="mb-2 mt-4 block text-xs font-semibold text-muted-foreground">
            Voice control hotkey
          </label>
          <button
            type="button"
            onClick={startCapturingHotkey}
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-left text-sm font-semibold hover:bg-muted"
          >
            {capturingHotkey ? (
              "Press any key…"
            ) : (
              <>
                Press{" "}
                <kbd className="rounded border border-line bg-card px-1.5 py-0.5 font-mono">
                  {voiceHotkey.toUpperCase()}
                </kbd>{" "}
                to toggle
              </>
            )}
          </button>
        </div>
      )}
    </header>
  );
}
