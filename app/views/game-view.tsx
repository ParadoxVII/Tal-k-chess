"use client";

import { ChessBoard } from "@/app/components/game/chess-board";
import { GameHeader } from "@/app/components/game/game-header";
import { GameSidebar } from "@/app/components/game/game-sidebar";
import { useGameController } from "@/app/hooks/use-game-controller";

export function GameView() {
  const controller = useGameController();

  return (
    <main
      className={controller.darkMode ? "dark min-h-screen" : "min-h-screen"}
    >
      <div className="min-h-screen bg-background px-5 py-6 text-foreground transition-colors md:px-10 lg:px-16">
        <GameHeader
          darkMode={controller.darkMode}
          isThinking={controller.isThinking}
          status={controller.status}
          onToggleDarkMode={() => controller.setDarkMode(!controller.darkMode)}
        />

        <div className="mx-auto grid max-w-[1400px] gap-8 xl:grid-cols-[minmax(540px,1fr)_360px]">
          <section className="min-w-0">
            <ChessBoard
              game={controller.game}
              orientedBoard={controller.orientedBoard}
              selected={controller.selected}
              lastMove={controller.lastMove}
              isThinking={controller.isThinking}
              voiceReady={controller.voiceReady}
              supported={controller.supported}
              soundOn={controller.soundOn}
              onSquareClick={controller.handleSquare}
              onReset={controller.reset}
              onToggleSound={() => controller.setSoundOn(!controller.soundOn)}
            />
          </section>

          <GameSidebar
            side={controller.side}
            preset={controller.preset}
            customSkill={controller.customSkill}
            options={controller.options}
            voice={controller.voice}
            transcript={controller.transcript}
            history={controller.history}
            pgn={controller.pgn}
            isThinking={controller.isThinking}
            isListening={controller.isListening}
            supported={controller.supported}
            onChangeSide={controller.changeSide}
            onChangePreset={controller.setPreset}
            onChangeCustomSkill={controller.setCustomSkill}
            onChangeVoice={controller.setVoice}
            onToggleListening={controller.toggleListening}
          />
        </div>
      </div>
    </main>
  );
}
