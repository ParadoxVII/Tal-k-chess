"use client";
// @ts-nocheck

import { useEffect, useRef, useState } from "react";

type RecognitionResult = {
  isFinal: boolean;
  [index: number]: { transcript: string };
};
type RecognitionEvent = { results: ArrayLike<RecognitionResult> };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};
type RecognitionConstructor = new () => Recognition;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

// Default duration to wait after the last detected word before treating the
// phrase as finished. Long spoken moves (e.g. "rook a takes on b4 check")
// have natural pauses between words, so this needs to be generous enough
// that a normal pause between words doesn't cut the recording off early.
export const DEFAULT_SILENCE_TIMEOUT_MS = 2200;
// Hard cap so the microphone doesn't stay open forever if something goes wrong.
const MAX_LISTEN_MS = 25000;

export function useVoiceInput(
  onFinalTranscript: (text: string) => void,
  silenceTimeoutMs: number = DEFAULT_SILENCE_TIMEOUT_MS,
) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTranscriptRef = useRef("");
  const finishedRef = useRef(true);

  function clearTimers() {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    silenceTimeoutRef.current = null;
    maxTimeoutRef.current = null;
  }

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimers();
    recognitionRef.current?.stop();
    const text = latestTranscriptRef.current.trim();
    if (text) onFinalTranscript(text);
  }

  useEffect(() => {
    setSupported(
      !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    );
    return () => {
      recognitionRef.current?.stop();
      clearTimers();
    };
  }, []);

  function scheduleSilenceStop() {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    silenceTimeoutRef.current = setTimeout(finish, silenceTimeoutMs);
  }

  function toggleListening() {
    if (!supported) {
      setError("Speech recognition is not supported here");
      return;
    }
    if (isListening) {
      finish();
      setIsListening(false);
      return;
    }
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new (Recognition as any)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";
    (recognition as any).onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (const element of event.results) {
        const result = element;
        const text = result[0].transcript;
        if (result.isFinal) finalText += `${text} `;
        else interimText += text;
      }
      const combined = `${finalText}${interimText}`.trim();
      latestTranscriptRef.current = combined;
      setTranscript(combined);
      scheduleSilenceStop();
    };
    (recognition as any).onerror = () => {
      setError("Microphone access was unavailable");
      setIsListening(false);
      finishedRef.current = true;
      clearTimers();
    };
    (recognition as any).onend = () => {
      setIsListening(false);
      clearTimers();
      if (!finishedRef.current) {
        finishedRef.current = true;
        const text = latestTranscriptRef.current.trim();
        if (text) onFinalTranscript(text);
      }
    };
    recognitionRef.current = recognition;
    finishedRef.current = false;
    latestTranscriptRef.current = "";
    setError(null);
    setTranscript("");
    setIsListening(true);
    recognition.start();
    maxTimeoutRef.current = setTimeout(finish, MAX_LISTEN_MS);
  }
  return { isListening, transcript, error, supported, toggleListening };
}
