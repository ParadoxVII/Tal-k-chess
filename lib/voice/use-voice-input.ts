'use client'

import { useEffect, useRef, useState } from 'react'

type Recognition = { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; onresult: ((event: any) => void) | null; onerror: ((event: any) => void) | null; onend: (() => void) | null }
type RecognitionConstructor = new () => Recognition

declare global { interface Window { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor } }

export function useVoiceInput(onFinalTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<Recognition | null>(null)

  useEffect(() => {
    setSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition))
    return () => recognitionRef.current?.stop()
  }, [])
  function toggleListening() {
    if (!supported) { setError('Speech recognition is not supported here'); return }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return
    const recognition = new Recognition(); recognition.continuous = false; recognition.interimResults = true; recognition.lang = 'en-US'
    recognition.onresult = (event) => { const result = event.results[0]; const text = result[0].transcript.trim(); setTranscript(text); if (result.isFinal) onFinalTranscript(text) }
    recognition.onerror = () => { setError('Microphone access was unavailable'); setIsListening(false) }
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition; setError(null); setTranscript(''); setIsListening(true); recognition.start()
  }
  return { isListening, transcript, error, supported, toggleListening }
}
