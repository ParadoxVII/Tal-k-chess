import type { BotOptions, ChessBotAdapter } from './types'

export class StockfishAdapter implements ChessBotAdapter {
  id = 'stockfish'
  name = 'Stockfish'
  private worker: Worker | null = null
  private options: BotOptions = {}
  private pending: { resolve: (move: string) => void; reject: (error: Error) => void; timeout: number } | null = null

  constructor() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker('/stockfish.js')
      this.worker.onmessage = (event) => {
        const line = String(event.data)
        const match = line.match(/^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/)
        if (match && this.pending) {
          const request = this.pending
          window.clearTimeout(request.timeout)
          this.pending = null
          request.resolve(match[1])
        }
      }
    }
  }

  setOptions(options: BotOptions) { this.options = { ...this.options, ...options } }

  getBestMove(fen: string, options: BotOptions = {}): Promise<string> {
    this.setOptions(options)
    if (!this.worker) return Promise.reject(new Error('Stockfish worker is unavailable'))
    if (this.pending) {
      window.clearTimeout(this.pending.timeout)
      this.pending.reject(new Error('Engine request superseded'))
      this.pending = null
    }
    const skill = Math.max(0, Math.min(20, this.options.skillLevel ?? 10))
    const depth = Math.max(1, this.options.depth ?? 6)
    const time = Math.max(100, this.options.timeLimitMs ?? 1200)
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        if (this.pending?.resolve === resolve) {
          this.pending = null
          reject(new Error('Engine timed out'))
        }
      }, time + 5000)
      this.pending = { resolve, reject, timeout }
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
