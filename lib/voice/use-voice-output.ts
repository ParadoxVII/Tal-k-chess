'use client'

export function useVoiceOutput() {
  function speak(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.92; utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }
  return { speak }
}
