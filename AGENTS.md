# AGENTS.md

## Purpose
This file gives coding agents quick, repository-specific context for making safe changes in Tal-k-chess.

## Project Snapshot
- App type: Next.js App Router single-page chess experience with voice input/output.
- Language: TypeScript.
- Main UI entry: `app/page.tsx` (thin server entry rendering a client view).
- Main client view: `app/views/game-view.tsx`.
- Main game state hook: `app/hooks/use-game-controller.ts`.
- Chess rules engine: `chess.js`.
- Chess bot engine: in-process `LegalMoveBot` (uses `chess.js` legal-move list directly; no Worker, no UCI protocol).

## Tech Stack
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- lucide-react icons

## Run And Validate
- Install: `npm install`
- Dev: `npm run dev`
- Type-check: `npm run typecheck`
- Build: `npm run build`

## Important File Map
- `app/page.tsx`: Route entry point.
- `app/views/game-view.tsx`: Composes the page from modular client components.
- `app/hooks/use-game-controller.ts`: Central game state, move handling, undo/redo, promotion, illegal-move flash, game-over detection, engine turn flow, and voice integration.
- `app/components/game/chess-board.tsx`: Board grid, promotion picker overlay, illegal-move flash highlight, and checkmate/draw overlay.
- `app/components/game/game-header.tsx`: Top bar with app name, single status indicator, New Game, Mute, dark mode, and a burger-menu dropdown holding engine (side/strength) and voice (accent) settings.
- `app/components/game/game-sidebar.tsx`: Voice control panel and move history only (engine/voice settings moved to the header burger menu).
- `app/components/game/constants.ts`: Shared UI/game constants.
- `lib/chess/legal-move-bot.ts`: In-process bot; picks from `chess.js` legal moves for a given FEN.
- `lib/chess/types.ts`: Shared chess bot types.
- `lib/voice/parse-move.ts`: Spoken-text to legal move parsing.
- `lib/voice/use-voice-input.ts`: Browser speech recognition hook.
- `lib/voice/use-voice-output.ts`: Speech synthesis hook.

## Guardrails For Changes
- Keep browser-only APIs (`window`, `speechSynthesis`, `SpeechRecognition`, `Worker`) in client-side code.
- Do not move voice hooks or the bot adapter into server components.
- Preserve legal move validation against `chess.js` move lists.
- Preserve board orientation behavior for white/black/random side selection.
- Only `reset()` in `use-game-controller.ts` should assign `playerColor` — do not add a second effect/derivation from `side`, this caused a real race condition (random side desyncing board orientation) in the past.
- The bot must always derive moves from a fresh `Chess` instance built from the current FEN — never introduce a persistent/stateful engine process that can desync from game state (this was the root cause of a past bug where a stub worker ignored the FEN entirely).
- Undo/redo (ArrowLeft/ArrowRight) always keep the live game state stopped on the player's turn — never leave the position mid-round (i.e. on the engine's turn) after an undo/redo, or the auto-engine-move effect will immediately react.
- There should be only one status/state indicator in the UI (the pill in `game-header.tsx`); avoid reintroducing duplicate status text elsewhere.

## UI And State Expectations
- `app/hooks/use-game-controller.ts` controls primary game state: position, selected square, history, redo stack, pending promotion, illegal-move flash, game-over info, status text, and turn flow.
- `app/views/game-view.tsx` should remain mostly presentational, wiring hook state/handlers into components.
- Engine should move only when it is the bot turn and the game is not over.
- Voice transcript should map to legal moves; illegal/unknown input should not mutate position.
- Clicking a selected square again (or pressing Escape) deselects it; clicking another own piece re-selects instead of attempting an illegal move.
- An illegal move attempt briefly flashes the from/to squares red (`illegalFlash` state, auto-clears) instead of silently failing.
- Checkmate/draw shows an overlay (win/lose/draw) with a "Play again" button; the overlay is derived from `game.isCheckmate()`/`game.isDraw()`, not separate state.

## Known Constraints
- No dedicated test suite is currently present.
- Prefer type-checking and manual play-through for regressions:
  - move legality
  - engine turn progression
  - voice input parse flow
  - voice output selection

## Agent Workflow Recommendation
When making changes:
1. Read `app/views/game-view.tsx`, `app/hooks/use-game-controller.ts`, and the directly affected module first.
2. Implement minimal, localized edits.
3. Run `npm run typecheck`.
4. If behavior changed, run `npm run dev` and manually verify relevant flows.
