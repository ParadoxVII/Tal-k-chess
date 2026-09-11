"use client";

let voicesCache: SpeechSynthesisVoice[] = [];

function logVoiceOutputError(message: string, detail?: unknown) {
  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error(`[voice-output] ${message}`, detail ?? {});
  }
}

export function useVoiceOutput() {
  function ensureVoicesLoaded() {
    if (typeof window === "undefined" || !window.speechSynthesis) return [];

    if (voicesCache.length === 0) {
      voicesCache = window.speechSynthesis.getVoices();
    }

    return voicesCache;
  }

  function speak(text: string, preferredVoice: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;
    synth.cancel();

    if (typeof synth.resume === "function") {
      synth.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.pitch = 1;

    const voices = ensureVoicesLoaded();
    console.log(
      "trying to speak with voices:",
      voices.map((v) => v.name),
      "preferred voice:",
      preferredVoice,
      "voicesloaded:",
      voices.length,
    );
    const match =
      voices.find((item) => item.name === preferredVoice) ?? voices[0] ?? null;

    if (match) {
      utterance.voice = match;
    }

    // On mobile browsers (especially iOS Safari/Chrome), voices may not be ready
    // yet and the speech synthesis API can be blocked until a user interaction.
    // Speak immediately with the best available fallback instead of waiting forever.
    try {
      synth.speak(utterance);
    } catch (error) {
      logVoiceOutputError("speech synthesis failed on initial speak", {
        preferredVoice,
        text,
        error,
      });
    }

    // If voices are still loading, refresh once when they become available.
    if (voices.length === 0) {
      const handleVoicesChanged = () => {
        const refreshedVoices = synth.getVoices();
        const refreshedMatch =
          refreshedVoices.find((item) => item.name === preferredVoice) ??
          refreshedVoices[0];

        if (refreshedMatch) {
          utterance.voice = refreshedMatch;
        }

        // Re-issue the speak call with the final voice selection if possible.
        try {
          synth.speak(utterance);
        } catch (error) {
          logVoiceOutputError("speech synthesis failed after voice refresh", {
            preferredVoice,
            text,
            error,
          });
        }
      };

      synth.addEventListener("voiceschanged", handleVoicesChanged, {
        once: true,
      });
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
