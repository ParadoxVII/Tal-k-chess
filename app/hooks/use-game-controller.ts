"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, Move } from "chess.js";
import { LegalMoveBot } from "@/lib/chess/legal-move-bot";
import { parseSpokenMove } from "@/lib/voice/parse-move";
import { useVoiceInput } from "@/lib/voice/use-voice-input";
import { useVoiceOutput } from "@/lib/voice/use-voice-output";
import { files, presets, Side } from "@/app/components/game/constants";

export function useGameController() {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<string | null>(null);
  const [history, setHistory] = useState<Move[]>([]);
  const [preset, setPreset] = useState("Intermediate");
  const [customSkill, setCustomSkill] = useState(10);
  const [side, setSide] = useState<Side>("white");
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [isThinking, setIsThinking] = useState(false);
  const [status, setStatus] = useState("Your move");
  const [soundOn, setSoundOn] = useState(true);
  const [voice, setVoice] = useState("Default voice");
  const [darkMode, setDarkMode] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);

  const engineRef = useRef<LegalMoveBot | null>(null);
  const engineFenRef = useRef<string | null>(null);
  const { speak } = useVoiceOutput();

  const cloneGame = useCallback((source: Chess) => {
    const clone = new Chess();
    const pgnText = source.pgn();
    if (pgnText) clone.loadPgn(pgnText);
    return clone;
  }, []);

  const options =
    preset === "Custom"
      ? {
          skillLevel: customSkill,
          depth: Math.max(2, Math.round(customSkill * 0.7)),
          timeLimitMs: 1800,
        }
      : presets[preset];

  const isPlayerTurn = game.turn() === playerColor;
  const board = useMemo(
    () =>
      Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => `${files[col]}${8 - row}`),
      ),
    [],
  );

  const orientedBoard = useMemo(
    () =>
      playerColor === "w"
        ? board
        : board.map((row) => [...row].reverse()).reverse(),
    [board, playerColor],
  );

  const lastMove = history.at(-1);
  const pgn = useMemo(
    () =>
      history
        .reduce((moves, move, index) => {
          const moveNumber = Math.floor(index / 2) + 1;
          return index % 2 === 0
            ? `${moves}${moveNumber}. ${move.san}`
            : `${moves} ${move.san} `;
        }, "")
        .trim(),
    [history],
  );

  const commitGame = useCallback(
    (next: Chess) => {
      setGame(next);
      setHistory(next.history({ verbose: true }) as Move[]);
      setSelected(null);
      if (next.isCheckmate()) setStatus("Checkmate");
      else if (next.isDraw()) setStatus("Draw");
      else setStatus(next.turn() === playerColor ? "Your move" : "Thinking…");
    },
    [playerColor],
  );

  const makeEngineMove = useCallback(
    async (position: Chess) => {
      setIsThinking(true);
      setStatus("Thinking…");
      try {
        const engine = engineRef.current;
        if (!engine) throw new Error("Engine unavailable");

        const best = await engine.getBestMove(position.fen(), options);
        if (!best) throw new Error("Engine returned no move");

        const bot = cloneGame(position);
        const botMove = bot.move({
          from: best.slice(0, 2),
          to: best.slice(2, 4),
          promotion: best[4],
        }) as Move | null;

        if (!botMove) throw new Error(`Engine returned illegal move: ${best}`);

        commitGame(bot);

        if (soundOn) {
          speak(
            `${botMove.piece === "n" ? "Knight" : botMove.piece} ${botMove.san}`,
            voice,
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown engine error";
        console.error("Engine move failed", {
          message,
          error,
          fen: position.fen(),
        });
        setStatus(`Engine unavailable — ${message}`);
      } finally {
        setIsThinking(false);
      }
    },
    [cloneGame, commitGame, options, soundOn, speak, voice],
  );

  const playHumanMove = useCallback(
    async (from: string, to: string, promotion?: string) => {
      if (isThinking || !isPlayerTurn || game.isGameOver()) return;
      const next = cloneGame(game);
      try {
        next.move({ from, to, promotion: promotion ?? "q" });
      } catch {
        setStatus("Illegal move");
        return;
      }
      commitGame(next);
    },
    [cloneGame, commitGame, game, isPlayerTurn, isThinking],
  );

  const handleSquare = useCallback(
    (square: string) => {
      if (isThinking || !isPlayerTurn) return;
      if (selected) {
        void playHumanMove(selected, square);
        return;
      }
      const piece = game.get(square as any);
      if (piece?.color === playerColor) setSelected(square);
    },
    [game, isPlayerTurn, isThinking, playHumanMove, playerColor, selected],
  );

  const reset = useCallback(
    (nextSide: Side = side) => {
      const nextColor =
        nextSide === "black"
          ? "b"
          : nextSide === "white"
            ? "w"
            : Math.random() > 0.5
              ? "w"
              : "b";
      const fresh = new Chess();
      engineFenRef.current = null;
      setSide(nextSide);
      setPlayerColor(nextColor);
      setGame(fresh);
      setHistory([]);
      setSelected(null);
      setStatus(nextColor === "w" ? "Your move" : "Thinking…");
      setIsThinking(false);
    },
    [side],
  );

  const changeSide = useCallback(
    (value: Side) => {
      reset(value);
    },
    [reset],
  );

  const onTranscript = useCallback(
    (text: string) => {
      setStatus(`Heard “${text}”`);
      const move = parseSpokenMove(text, game);
      if (move) void playHumanMove(move.from, move.to, move.promotion);
      else setStatus("Could not find a legal move");
    },
    [game, playHumanMove],
  );

  const {
    isListening,
    transcript,
    error: voiceError,
    toggleListening,
    supported,
  } = useVoiceInput(onTranscript);

  useEffect(() => {
    engineRef.current = new LegalMoveBot();
    return () => engineRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (side === "random") setPlayerColor(Math.random() > 0.5 ? "w" : "b");
    else setPlayerColor(side === "white" ? "w" : "b");
  }, [side]);

  useEffect(() => {
    const fen = game.fen();
    if (
      !isPlayerTurn &&
      !game.isGameOver() &&
      !isThinking &&
      engineFenRef.current !== fen
    ) {
      engineFenRef.current = fen;
      void makeEngineMove(game);
    }
  }, [game, isPlayerTurn, isThinking, makeEngineMove]);

  useEffect(() => {
    setVoiceReady(true);
  }, []);

  useEffect(() => {
    if (voiceError) setStatus(voiceError);
  }, [voiceError]);

  return {
    game,
    selected,
    history,
    preset,
    customSkill,
    side,
    playerColor,
    isThinking,
    status,
    soundOn,
    voice,
    darkMode,
    voiceReady,
    isListening,
    transcript,
    supported,
    options,
    orientedBoard,
    lastMove,
    pgn,
    setPreset,
    setCustomSkill,
    setVoice,
    setSoundOn,
    setDarkMode,
    reset,
    changeSide,
    handleSquare,
    toggleListening,
  };
}
