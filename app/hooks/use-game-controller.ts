"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, Move } from "chess.js";
import { LegalMoveBot } from "@/lib/chess/legal-move-bot";
import { describeMove } from "@/lib/voice/describe-move";
import { parseSpokenMove } from "@/lib/voice/parse-move";
import {
  DEFAULT_SILENCE_TIMEOUT_MS,
  useVoiceInput,
} from "@/lib/voice/use-voice-input";
import { useVoiceOutput } from "@/lib/voice/use-voice-output";
import { files, presets, Side } from "@/app/components/game/constants";
import defaultSettings from "@/lib/voice/default-settings.json";

export function useGameController() {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<string | null>(null);
  const [history, setHistory] = useState<Move[]>([]);
  const mapDifficultyToPreset = (d: string) => {
    const normal = d?.toLowerCase?.();
    if (!normal) return "Intermediate";
    if (normal === "easy" || normal === "beginner") return "Beginner";
    if (normal === "hard" || normal === "master") return "Master";
    if (normal === "custom") return "Custom";
    return "Intermediate";
  };

  const [preset, setPreset] = useState<string>(
    mapDifficultyToPreset(defaultSettings.difficulty as string),
  );
  const [customSkill, setCustomSkill] = useState(10);
  const [side, setSide] = useState<Side>("white");
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [isThinking, setIsThinking] = useState(false);
  const [status, setStatus] = useState("Your move");
  const [soundOn, setSoundOn] = useState(!Boolean(defaultSettings.muted));
  const [voice, setVoice] = useState(defaultSettings.preferredVoice);
  const [uiThemeMode, setUiThemeMode] = useState<"light" | "dark" | "system">(
    (defaultSettings.uiThemeMode as "light" | "dark" | "system") ?? "system",
  );
  const [chessboardTheme, setChessboardTheme] = useState<string>(
    (defaultSettings.chessboardTheme as string) ?? "classic",
  );
  // Derive darkMode from uiThemeMode for backward compatibility with existing UI
  const darkMode =
    uiThemeMode === "dark" ||
    (uiThemeMode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [voiceReady, setVoiceReady] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
    color: "w" | "b";
  } | null>(null);
  const [redoStack, setRedoStack] = useState<Move[]>([]);
  const [illegalFlash, setIllegalFlash] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [voiceSilenceMs, setVoiceSilenceMs] = useState(
    (defaultSettings.pauseMs as number) ?? DEFAULT_SILENCE_TIMEOUT_MS,
  );
  const [boardSidebarGap, setBoardSidebarGap] = useState(16);
  const normalizeHotkey = (hk: any) => {
    if (!hk) return "v";
    // Accept forms like 'KeyV' or single character 'v'
    if (typeof hk === "string" && hk.startsWith("Key") && hk.length === 4)
      return hk[3].toLowerCase();
    if (typeof hk === "string" && hk.length === 1) return hk.toLowerCase();
    return "v";
  };
  const [voiceHotkey, setVoiceHotkey] = useState(
    normalizeHotkey(defaultSettings.hotkeys?.toggleVoice),
  );

  const engineRef = useRef<LegalMoveBot | null>(null);
  const engineFenRef = useRef<string | null>(null);
  const illegalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const gameOverInfo = useMemo(() => {
    if (game.isCheckmate()) {
      return {
        type: "checkmate" as const,
        winner: (game.turn() === "w" ? "b" : "w") as "w" | "b",
      };
    }
    if (game.isDraw()) return { type: "draw" as const };
    return null;
  }, [game]);
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
      setRedoStack([]);
      setIllegalFlash(null);
      if (next.isCheckmate()) {
        const winner = next.turn() === "w" ? "b" : "w";
        setStatus(
          winner === playerColor
            ? "Checkmate — you win!"
            : "Checkmate — you lose",
        );
      } else if (next.isDraw()) {
        setStatus("Draw");
      } else {
        setStatus(next.turn() === playerColor ? "Your move" : "Thinking…");
      }
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
          console.log("Speaking move:", botMove.san);
          speak(describeMove(botMove.san), voice);
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
        setSelected(null);
        setIllegalFlash({ from, to });
        if (illegalTimeoutRef.current) clearTimeout(illegalTimeoutRef.current);
        illegalTimeoutRef.current = setTimeout(
          () => setIllegalFlash(null),
          500,
        );
        return;
      }
      commitGame(next);
    },
    [cloneGame, commitGame, game, isPlayerTurn, isThinking],
  );

  const handleSquare = useCallback(
    (square: string) => {
      if (isThinking || !isPlayerTurn || pendingPromotion) return;
      if (selected) {
        if (selected === square) {
          setSelected(null);
          return;
        }
        const ownPiece = game.get(square as any);
        if (ownPiece?.color === playerColor) {
          setSelected(square);
          return;
        }
        const legalMoves = game.moves({ verbose: true }) as Move[];
        const requiresPromotion = legalMoves.some(
          (move) =>
            move.from === selected &&
            move.to === square &&
            Boolean(move.promotion),
        );
        if (requiresPromotion) {
          const piece = game.get(selected as any);
          setPendingPromotion({
            from: selected,
            to: square,
            color: piece?.color ?? playerColor,
          });
          return;
        }
        void playHumanMove(selected, square);
        return;
      }
      const piece = game.get(square as any);
      if (piece?.color === playerColor) setSelected(square);
    },
    [
      game,
      isPlayerTurn,
      isThinking,
      pendingPromotion,
      playHumanMove,
      playerColor,
      selected,
    ],
  );

  const undo = useCallback(() => {
    if (isThinking || pendingPromotion || history.length === 0) return;
    const next = cloneGame(game);
    const popped: Move[] = [];
    while (next.history().length > 0) {
      const undone = next.undo();
      if (!undone) break;
      popped.push(undone as Move);
      if (next.turn() === playerColor) break;
    }
    if (popped.length === 0) return;
    const poppedChrono = [...popped].reverse();
    setRedoStack((stack) => [...poppedChrono, ...stack]);
    setGame(next);
    setHistory(next.history({ verbose: true }) as Move[]);
    setSelected(null);
    setPendingPromotion(null);
    setIllegalFlash(null);
    setStatus(next.turn() === playerColor ? "Your move" : "Thinking…");
  }, [
    cloneGame,
    game,
    history.length,
    isThinking,
    pendingPromotion,
    playerColor,
  ]);

  const redo = useCallback(() => {
    if (isThinking || pendingPromotion || redoStack.length === 0) return;
    const next = cloneGame(game);
    let applied = 0;
    while (applied < redoStack.length) {
      const move = redoStack[applied];
      const result = next.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      if (!result) break;
      applied += 1;
      if (next.turn() === playerColor) break;
    }
    if (applied === 0) return;
    setRedoStack((stack) => stack.slice(applied));
    setGame(next);
    setHistory(next.history({ verbose: true }) as Move[]);
    setSelected(null);
    setPendingPromotion(null);
    setIllegalFlash(null);
    setStatus(next.turn() === playerColor ? "Your move" : "Thinking…");
  }, [cloneGame, game, isThinking, pendingPromotion, playerColor, redoStack]);

  const resolvePromotion = useCallback(
    (promotion: "q" | "r" | "b" | "n") => {
      if (!pendingPromotion) return;
      const { from, to } = pendingPromotion;
      setPendingPromotion(null);
      void playHumanMove(from, to, promotion);
    },
    [pendingPromotion, playHumanMove],
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelected(null);
  }, []);

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
      if (illegalTimeoutRef.current) clearTimeout(illegalTimeoutRef.current);
      setSide(nextSide);
      setPlayerColor(nextColor);
      setGame(fresh);
      setHistory([]);
      setSelected(null);
      setPendingPromotion(null);
      setRedoStack([]);
      setIllegalFlash(null);
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
  } = useVoiceInput(onTranscript, voiceSilenceMs);

  useEffect(() => {
    engineRef.current = new LegalMoveBot();
    return () => engineRef.current?.dispose();
  }, []);

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

  useEffect(() => {
    return () => {
      if (illegalTimeoutRef.current) clearTimeout(illegalTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        undo();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        redo();
      } else if (event.key === "Escape") {
        if (pendingPromotion) cancelPromotion();
        else setSelected(null);
      } else if (event.key.toLowerCase() === voiceHotkey) {
        event.preventDefault();
        if (supported && !isThinking) toggleListening();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    pendingPromotion,
    cancelPromotion,
    supported,
    isThinking,
    toggleListening,
    voiceHotkey,
  ]);

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
    uiThemeMode,
    chessboardTheme,
    voiceReady,
    isListening,
    transcript,
    supported,
    options,
    orientedBoard,
    lastMove,
    pgn,
    pendingPromotion,
    illegalFlash,
    gameOverInfo,
    voiceSilenceMs,
    boardSidebarGap,
    voiceHotkey,
    setPreset,
    setCustomSkill,
    setVoice,
    setSoundOn,
    setUiThemeMode,
    setChessboardTheme,
    setVoiceSilenceMs,
    setBoardSidebarGap,
    setVoiceHotkey,
    reset,
    changeSide,
    handleSquare,
    resolvePromotion,
    cancelPromotion,
    toggleListening,
  };
}
