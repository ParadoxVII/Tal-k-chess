import type { BotOptions, ChessBotAdapter } from './types'

export class StockfishAdapter implements ChessBotAdapter {
  id = 'stockfish'
  name = 'Stockfish'
  private worker: Worker | null = null
  private options: BotOptions = {}
  private pending: { resolve: (move: string) => void; reject: (error: Error) => void } | null = null

  constructor() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker('/stockfish.js')
      this.worker.onmessage = (event) => {
        const line = String(event.data)
        const match = line.match(/^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/)
        if (match && this.pending) {
          this.pending.resolve(match[1])
          this.pending = null
        }
      }
    }
  }

  setOptions(options: BotOptions) { this.options = { ...this.options, ...options } }

  getBestMove(fen: string, options: BotOptions = {}): Promise<string> {
    this.setOptions(options)
    if (!this.worker) return Promise.reject(new Error('Stockfish worker is unavailable'))
    if (this.pending) this.pending.reject(new Error('Engine request superseded'))
    return new Promise((resolve, reject) => {
      this.pending = { resolve, reject }
      const skill = Math.max(0, Math.min(20, this.options.skillLevel ?? 10))
      const depth = Math.max(1, this.options.depth ?? 6)
      const time = Math.max(100, this.options.timeLimitMs ?? 1200)
      this.worker?.postMessage('stop')
      this.worker?.postMessage('uci')
      this.worker?.postMessage(`setoption name Skill Level value ${skill}`)
      this.worker?.postMessage('isready')
      this.worker?.postMessage(`position fen ${fen}`)
      this.worker?.postMessage(`go depth ${depth} movetime ${time}`)
      window.setTimeout(() => {
        if (this.pending?.resolve === resolve) { this.pending = null; reject(new Error('Engine timed out')) }
      }, time + 5000)
    })
  }

  dispose() { this.pending?.reject(new Error('Engine disposed')); this.pending = null; this.worker?.terminate(); this.worker = null }
}
