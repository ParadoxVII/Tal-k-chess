export interface BotOptions {
  depth?: number
  skillLevel?: number
  timeLimitMs?: number
}

export interface ChessBotAdapter {
  id: string
  name: string
  setOptions(options: BotOptions): void
  getBestMove(fen: string, options?: BotOptions): Promise<string>
  dispose(): void
}
