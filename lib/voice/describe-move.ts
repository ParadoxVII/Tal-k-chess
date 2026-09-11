const pieceNames: Record<string, string> = {
  K: "King",
  Q: "Queen",
  R: "Rook",
  B: "Bishop",
  N: "Knight",
};

/**
 * Converts a chess.js SAN string into a natural-language phrase for speech,
 * e.g. "Qxe4+" -> "Queen takes e4, check", "Nc5" -> "Knight to c5",
 * "O-O" -> "Castles kingside".
 */
export function describeMove(rawSan: string): string {
  const isCheckmate = rawSan.endsWith("#");
  const isCheck = !isCheckmate && rawSan.endsWith("+");
  const san = rawSan.replace(/[+#]$/, "");

  if (san === "O-O" || san === "O-O-O") {
    const parts = [san === "O-O" ? "Castles kingside" : "Castles queenside"];
    if (isCheckmate) parts.push("checkmate");
    else if (isCheck) parts.push("check");
    return parts.join(", ");
  }

  const match = san.match(
    /^([KQRBN])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=([QRBN]))?$/,
  );
  if (!match) return rawSan;
  const [, pieceLetter, fromFile, fromRank, capture, target, promoteTo] = match;

  const parts: string[] = [pieceLetter ? pieceNames[pieceLetter] : "Pawn"];
  if (fromFile) parts.push(fromFile);
  if (fromRank) parts.push(fromRank);
  parts.push(capture ? "takes" : "to");
  parts.push(target);
  if (promoteTo) parts.push("promotes to", pieceNames[promoteTo]);
  if (isCheckmate) parts.push("checkmate");
  else if (isCheck) parts.push("check");
  return parts.join(" ");
}
