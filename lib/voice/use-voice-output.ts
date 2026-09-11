"use client";

let voicesCache: SpeechSynthesisVoice[] = [];

export function useVoiceOutput() {
  function ensureVoicesLoaded() {
    if (voicesCache.length === 0 && typeof window !== "undefined") {
      voicesCache = window.speechSynthesis.getVoices();
    }
    return voicesCache;
  }

  function speak(text: string, preferredVoice: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const voices = ensureVoicesLoaded();
    if (voices.length === 0) {
      // Voices not yet loaded, wait for voiceschanged event
      const handleVoicesChanged = () => {
        voicesCache = window.speechSynthesis.getVoices();
        const match = voicesCache.find((item) => item.name === preferredVoice);
        if (match) utterance.voice = match;
        utterance.rate = 0.92;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged,
        );
      };
      window.speechSynthesis.addEventListener(
        "voiceschanged",
        handleVoicesChanged,
        {
          once: true,
        },
      );
    } else {
      const match = voices.find((item) => item.name === preferredVoice);
      if (match) utterance.voice = match;
      utterance.rate = 0.92;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }

  // Initialize voices cache and listen for updates
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      voicesCache = window.speechSynthesis.getVoices();
    });
    voicesCache = window.speechSynthesis.getVoices();
  }

  return { speak };
}
