import { Chess } from 'chess.js'

const numberWords: Record<string, string> = { one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8' }
const fileWords: Record<string, string> = { alpha: 'a', bravo: 'b', charlie: 'c', delta: 'd', echo: 'e', foxtrot: 'f', golf: 'g', hotel: 'h' }
const pieces: Record<string, string> = { king: 'k', queen: 'q', rook: 'r', bishop: 'b', knight: 'n', horse: 'n', pawn: 'p' }

export function parseSpokenMove(transcript: string, game: Chess): { from: string; to: string; promotion?: string } | null {
  const words = transcript.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
  const normalized = words.map(word => fileWords[word] ?? numberWords[word] ?? word)
  const coordinates = normalized.join('').match(/[a-h][1-8]/g) ?? []
  const legal = game.moves({ verbose: true }) as Array<{ from: string; to: string; promotion?: string; piece: string }>
  if (coordinates.length >= 2) return legal.find(move => move.from === coordinates[0] && move.to === coordinates[1]) ?? null
  const target = normalized.find((word, index) => /^[a-h][1-8]$/.test(word) || (index > 0 && /^[a-h]$/.test(word) && /^[1-8]$/.test(normalized[index + 1])))
  const targetSquare = target && /^[a-h][1-8]$/.test(target) ? target : null
  const piece = words.map(word => pieces[word]).find(Boolean) ?? 'p'
  if (!targetSquare) return null
  return legal.find(move => move.to === targetSquare && move.piece === piece) ?? null
}
