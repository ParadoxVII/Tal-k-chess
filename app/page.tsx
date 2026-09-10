'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess, Move } from 'chess.js'
import { Activity, ChevronDown, CircleHelp, Flag, Gauge, History, Mic, MicOff, RotateCcw, Settings2, Volume2, VolumeX, Zap } from 'lucide-react'
import { StockfishAdapter } from '@/lib/chess/stockfish-adapter'
import { BotOptions } from '@/lib/chess/types'
import { parseSpokenMove } from '@/lib/voice/parse-move'
import { useVoiceInput } from '@/lib/voice/use-voice-input'
import { useVoiceOutput } from '@/lib/voice/use-voice-output'

const presets: Record<string, BotOptions> = {
  Beginner: { skillLevel: 0, depth: 2, timeLimitMs: 500 },
  Intermediate: { skillLevel: 10, depth: 6, timeLimitMs: 1200 },
  Master: { skillLevel: 20, depth: 14, timeLimitMs: 2500 },
}
const files = ['a','b','c','d','e','f','g','h']
const pieceGlyph: Record<string, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }

export default function Home() {
  const [game, setGame] = useState(() => new Chess())
  const [selected, setSelected] = useState<string | null>(null)
  const [history, setHistory] = useState<Move[]>([])
  const [preset, setPreset] = useState('Intermediate')
  const [customSkill, setCustomSkill] = useState(10)
  const [isThinking, setIsThinking] = useState(false)
  const [status, setStatus] = useState('Your move')
  const [soundOn, setSoundOn] = useState(true)
  const engineRef = useRef<StockfishAdapter | null>(null)
  const { speak } = useVoiceOutput()
  const onTranscript = useCallback((text: string) => {
    setStatus(`Heard “${text}”`)
    const move = parseSpokenMove(text, game)
    if (move) playHumanMove(move.from, move.to, move.promotion)
    else setStatus('Could not find a legal move')
  }, [game])
  const { isListening, transcript, error: voiceError, toggleListening, supported } = useVoiceInput(onTranscript)
  const options = preset === 'Custom' ? { skillLevel: customSkill, depth: Math.max(2, Math.round(customSkill * .7)), timeLimitMs: 1800 } : presets[preset]

  useEffect(() => { engineRef.current = new StockfishAdapter(); return () => engineRef.current?.dispose() }, [])
  useEffect(() => { if (voiceError) setStatus(voiceError) }, [voiceError])

  function commitGame(next: Chess, move: Move) {
    setGame(next); setHistory(next.history({ verbose: true }) as Move[]); setSelected(null)
    if (next.isCheckmate()) setStatus('Checkmate')
    else if (next.isDraw()) setStatus('Draw')
    else setStatus(next.turn() === 'w' ? 'Your move' : 'Thinking…')
  }
  async function playHumanMove(from: string, to: string, promotion?: string) {
    if (isThinking || game.turn() !== 'w' || game.isGameOver()) return
    const next = new Chess(game.fen()); let move: Move
    try { move = next.move({ from, to, promotion: promotion ?? 'q' }) as Move } catch { setStatus('Illegal move'); return }
    commitGame(next, move); setIsThinking(true)
    try {
      const best = await engineRef.current?.getBestMove(next.fen(), options)
      if (!best) throw new Error('Engine unavailable')
      const bot = new Chess(next.fen()); const botMove = bot.move({ from: best.slice(0,2), to: best.slice(2,4), promotion: best[4] }) as Move
      commitGame(bot, botMove); if (soundOn) speak(`${botMove.piece === 'n' ? 'Knight' : botMove.piece} ${botMove.san}`)
    } catch { setStatus('Engine unavailable — try again'); } finally { setIsThinking(false) }
  }
  function handleSquare(square: string) {
    if (selected) { playHumanMove(selected, square); return }
    const piece = game.get(square as any)
    if (piece?.color === 'w' && game.turn() === 'w' && !isThinking) setSelected(square)
  }
  function reset() { const fresh = new Chess(); setGame(fresh); setHistory([]); setSelected(null); setStatus('Your move'); setIsThinking(false) }
  const board = useMemo(() => Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => `${files[col]}${8-row}`)), [])
  const lastMove = history.at(-1)

  return <main className="min-h-screen bg-background px-5 py-6 text-foreground md:px-10 lg:px-16">
    <header className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 pb-8">
      <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm"><Zap data-icon="inline-start" /></div><div><div className="font-mono text-[11px] font-bold uppercase tracking-[.22em] text-brand">Vox Chess</div><div className="text-xs text-muted-foreground">A quieter way to play</div></div></div>
      <div className="hidden items-center gap-6 text-xs font-medium text-muted-foreground md:flex"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-brand" /> Engine online</span><span>Game 01 / Casual</span><button className="rounded-lg p-2 hover:bg-muted" aria-label="Help"><CircleHelp size={17} /></button></div>
    </header>
    <div className="mx-auto grid max-w-[1400px] gap-8 xl:grid-cols-[minmax(540px,1fr)_360px]">
      <section className="min-w-0"><div className="mb-5 flex items-end justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">White to move</p><h1 className="text-3xl font-semibold tracking-tight">Find your next move.</h1></div><div className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-2 text-xs font-medium text-muted-foreground"><Activity size={14} className={isThinking ? 'animate-pulse text-brand' : 'text-brand'} />{status}</div></div>
        <div className="mx-auto max-w-[760px] overflow-hidden rounded-2xl border border-line bg-card p-3 shadow-[0_18px_60px_rgba(34,65,53,.08)] sm:p-5"><div className="grid aspect-square grid-cols-8 overflow-hidden rounded-lg border border-[#c7d5ce]">{board.flat().map(square => { const piece = game.get(square as any); const dark = ((files.indexOf(square[0]) + Number(square[1])) % 2) === 0; const isSelected = selected === square; const isLast = lastMove?.from === square || lastMove?.to === square; return <button key={square} onClick={() => handleSquare(square)} aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`} className={`relative flex items-center justify-center transition-colors ${dark ? 'bg-[#7ca895]' : 'bg-[#e8f0e9]'} ${isLast ? 'shadow-[inset_0_0_0_4px_rgba(230,184,92,.62)]' : ''} ${isSelected ? 'shadow-[inset_0_0_0_5px_#0d7560]' : ''}`}><span className={`absolute left-1 top-1 font-mono text-[9px] font-bold ${dark ? 'text-[#e0eee6]' : 'text-[#789187]'} ${Number(square[1]) === 8 ? 'opacity-100' : 'opacity-0'}`}>{square[0]}</span>{piece && <span className={`select-none text-[clamp(2rem,7vw,4.4rem)] leading-none ${piece.color === 'w' ? 'text-[#f9fbf8] drop-shadow-[0_2px_1px_rgba(29,53,43,.42)]' : 'text-[#173128] drop-shadow-[0_2px_1px_rgba(255,255,255,.2)]'}`}>{pieceGlyph[piece.type]}</span>}</button> })}</div></div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="flex size-8 items-center justify-center rounded-full bg-card font-mono text-xs font-bold text-brand">{isThinking ? 'AI' : 'You'}</span><span>{isThinking ? 'Vox is considering the position…' : supported ? 'Say a move or click a piece to begin.' : 'Voice input is not available in this browser.'}</span></div><div className="flex gap-2"><button onClick={reset} className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold hover:bg-muted"><RotateCcw size={14} /> New game</button><button onClick={() => setSoundOn(!soundOn)} className="rounded-lg border border-line bg-card p-2 hover:bg-muted" aria-label={soundOn ? 'Mute voice' : 'Enable voice'}>{soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}</button></div></div>
      </section>
      <aside className="flex flex-col gap-5"><div className="rounded-2xl border border-line bg-card p-5"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">Your opponent</p><h2 className="mt-1 text-xl font-semibold">Vox Engine</h2></div><div className="flex size-10 items-center justify-center rounded-xl bg-[#e4f1eb] text-brand"><Gauge size={19} /></div></div><label className="mb-2 block text-xs font-semibold text-muted-foreground" htmlFor="difficulty">Playing strength</label><div className="relative"><select id="difficulty" value={preset} onChange={e => setPreset(e.target.value)} className="w-full appearance-none rounded-lg border border-line bg-background px-3 py-3 text-sm font-semibold outline-none focus:border-brand"><option>Beginner</option><option>Intermediate</option><option>Master</option><option>Custom</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-muted-foreground" size={16} /></div>{preset === 'Custom' && <label className="mt-5 block text-xs font-semibold text-muted-foreground">Skill level <input type="range" min="0" max="20" value={customSkill} onChange={e => setCustomSkill(Number(e.target.value))} className="mt-3 w-full accent-[#0d7560]" /><span className="float-right font-mono text-brand">{customSkill}/20</span></label>}<div className="mt-5 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-background p-3"><span className="block text-muted-foreground">Skill level</span><strong className="mt-1 block font-mono text-base">{options.skillLevel}/20</strong></div><div className="rounded-lg bg-background p-3"><span className="block text-muted-foreground">Search depth</span><strong className="mt-1 block font-mono text-base">{options.depth} ply</strong></div></div></div>
        <button onClick={toggleListening} disabled={!supported || isThinking} className={`flex items-center justify-between rounded-2xl border p-5 text-left transition-colors ${isListening ? 'border-brand bg-brand text-brand-foreground' : 'border-line bg-card hover:bg-muted'}`}><div><p className={`text-xs font-bold uppercase tracking-[.16em] ${isListening ? 'text-brand-foreground/70' : 'text-muted-foreground'}`}>Voice control</p><h2 className="mt-1 text-lg font-semibold">{isListening ? 'Listening now' : 'Speak your move'}</h2><p className={`mt-1 text-xs ${isListening ? 'text-brand-foreground/75' : 'text-muted-foreground'}`}>{transcript || 'Try “knight to f3” or “e4”'}</p></div><div className={`flex size-11 items-center justify-center rounded-full ${isListening ? 'bg-brand-foreground text-brand' : 'bg-[#e4f1eb] text-brand'}`}>{isListening ? <MicOff size={19} /> : <Mic size={19} />}</div></button>
        <div className="rounded-2xl border border-line bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-semibold"><History size={16} className="text-brand" /> Move history</h2><span className="font-mono text-[11px] text-muted-foreground">{history.length} moves</span></div><div className="max-h-52 overflow-auto">{history.length === 0 ? <p className="py-6 text-center text-xs text-muted-foreground">Your moves will appear here.</p> : <div className="grid grid-cols-2 gap-x-4 gap-y-2">{Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => <div key={i} className="contents"><span className="font-mono text-xs text-muted-foreground">{i + 1}.</span><span className="font-mono text-xs font-semibold">{history[i*2]?.san || '—'} <span className="text-muted-foreground">{history[i*2+1]?.san || ''}</span></span></div>)}</div>}</div></div>
        <div className="flex items-start gap-3 px-1 text-[11px] leading-5 text-muted-foreground"><Settings2 size={14} className="mt-0.5 shrink-0 text-brand" /><span>Engine settings are applied to the next response. Drag pieces or use voice input at any time.</span></div>
      </aside>
    </div>
  </main>
}
