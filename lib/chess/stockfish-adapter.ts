import type { BotOptions, ChessBotAdapter } from "./types";

type PendingRequest = {
  resolve: (move: string) => void;
  reject: (error: Error) => void;
  timeout: number;
  id: number;
};

type PendingReady = {
  resolve: () => void;
  reject: (error: Error) => void;
  timeout: number;
};

export class StockfishAdapter implements ChessBotAdapter {
  id = "stockfish";
  name = "Stockfish";
  private worker: Worker | null = null;
  private options: BotOptions = {};
  private pending: PendingRequest | null = null;
  private pendingReady: PendingReady | null = null;
  private requestId = 0;
  private readonly debug =
    typeof window !== "undefined" &&
    window.localStorage?.getItem("voxchess:engine-debug") === "1";

  constructor() {
    if (typeof Worker !== "undefined") {
      this.worker = new Worker("/stockfish.js");
      this.worker.onerror = () => {
        this.log("worker error event");
        this.rejectPending(new Error("Stockfish worker error"));
      };
      this.worker.onmessageerror = () => {
        this.log("worker message error event");
        this.rejectPending(new Error("Stockfish worker message error"));
      };
      this.worker.onmessage = (event) => {
        const line = String(event.data);
        this.log("<", line);
        if (line === "readyok" && this.pendingReady) {
          const pendingReady = this.pendingReady;
          window.clearTimeout(pendingReady.timeout);
          this.pendingReady = null;
          pendingReady.resolve();
          return;
        }
        const match = line.match(/^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
        if (match && this.pending) {
          const request = this.pending;
          window.clearTimeout(request.timeout);
          this.pending = null;
          this.log(`resolved request #${request.id} with`, match[1]);
          request.resolve(match[1]);
        }
      };
      this.post("uci");
    }
  }

  private log(...parts: Array<string>) {
    if (!this.debug) return;
    console.debug("[stockfish-adapter]", ...parts);
  }

  private post(command: string) {
    this.log(">", command);
    this.worker?.postMessage(command);
  }

  private rejectPending(error: Error) {
    if (this.pending) {
      window.clearTimeout(this.pending.timeout);
      const request = this.pending;
      this.pending = null;
      request.reject(error);
    }
    if (this.pendingReady) {
      window.clearTimeout(this.pendingReady.timeout);
      const ready = this.pendingReady;
      this.pendingReady = null;
      ready.reject(error);
    }
  }

  private waitUntilReady(): Promise<void> {
    if (!this.worker)
      return Promise.reject(new Error("Stockfish worker is unavailable"));
    if (this.pendingReady) {
      window.clearTimeout(this.pendingReady.timeout);
      this.pendingReady.reject(new Error("Engine ready check superseded"));
      this.pendingReady = null;
    }
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        if (this.pendingReady?.resolve === resolve) {
          this.pendingReady = null;
          reject(new Error("Engine ready check timed out"));
        }
      }, 5000);
      this.pendingReady = { resolve, reject, timeout };
      this.post("isready");
    });
  }

  setOptions(options: BotOptions) {
    this.options = { ...this.options, ...options };
  }

  async getBestMove(fen: string, options: BotOptions = {}): Promise<string> {
    this.setOptions(options);
    if (!this.worker)
      return Promise.reject(new Error("Stockfish worker is unavailable"));
    if (this.pending) {
      window.clearTimeout(this.pending.timeout);
      this.pending.reject(new Error("Engine request superseded"));
      this.pending = null;
    }
    const skill = Math.max(0, Math.min(20, this.options.skillLevel ?? 10));
    const depth = Math.max(1, this.options.depth ?? 6);
    const time = Math.max(100, this.options.timeLimitMs ?? 1200);
    await this.waitUntilReady();
    const requestId = ++this.requestId;
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        if (this.pending?.resolve === resolve) {
          this.pending = null;
          reject(new Error("Engine timed out"));
        }
      }, time + 5000);
      this.pending = { resolve, reject, timeout, id: requestId };
      this.log(`starting request #${requestId}`);
      this.post(`setoption name Skill Level value ${skill}`);
      this.post(`position fen ${fen}`);
      this.post(`go depth ${depth} movetime ${time}`);
    });
  }

  dispose() {
    this.rejectPending(new Error("Engine disposed"));
    this.worker?.terminate();
    this.worker = null;
  }
}
