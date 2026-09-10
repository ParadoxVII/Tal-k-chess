self.onmessage = function(event) {
  const command = String(event.data || '')
  if (command === 'uci') { self.postMessage('id name Vox Chess Compatible Engine'); self.postMessage('uciok'); return }
  if (command === 'isready') { self.postMessage('readyok'); return }
  if (command.startsWith('go ')) {
    const position = command.match(/position fen (.+)/)
    const moves = ['e7e5','d7d5','c7c5','g8f6','b8c6']
    const seed = position?.[1]?.split(' ')[1]?.charCodeAt(0) ?? 0
    self.setTimeout(() => self.postMessage(`bestmove ${moves[seed % moves.length]}`), Math.min(350, Number(command.match(/movetime (\d+)/)?.[1] ?? 300)))
  }
}
