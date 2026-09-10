'use client'

export function useVoiceOutput() {
  function speak(text: string, preferredVoice = 'Default voice') {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    if (preferredVoice !== 'Default voice') {
      const match = voices.find((item) => item.name === preferredVoice || item.name.includes(preferredVoice))
      if (match) utterance.voice = match
    }
    utterance.rate = 0.92
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }
  return { speak }
}
