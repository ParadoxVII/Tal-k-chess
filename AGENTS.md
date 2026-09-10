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
- `app/hooks/use-game-controller.ts`: Central game state, move handling, engine turn flow, and voice integration.
- `app/components/game/chess-board.tsx`: Board grid and board-level actions.
- `app/components/game/game-header.tsx`: Header and top status controls.
- `app/components/game/game-sidebar.tsx`: Side panel controls and move history.
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
- The bot must always derive moves from a fresh `Chess` instance built from the current FEN — never introduce a persistent/stateful engine process that can desync from game state (this was the root cause of a past bug where a stub worker ignored the FEN entirely).

## UI And State Expectations
- `app/hooks/use-game-controller.ts` controls primary game state: position, selected square, history, status text, and turn flow.
- `app/views/game-view.tsx` should remain mostly presentational, wiring hook state/handlers into components.
- Engine should move only when it is the bot turn and the game is not over.
- Voice transcript should map to legal moves; illegal/unknown input should not mutate position.

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
