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
      <div className="min-h-screen bg-background py-4 px-4 lg:px-8 text-foreground transition-colors">
        <GameHeader
          darkMode={controller.darkMode}
          isThinking={controller.isThinking}
          status={controller.status}
          soundOn={controller.soundOn}
          side={controller.side}
          preset={controller.preset}
          customSkill={controller.customSkill}
          voice={controller.voice}
          voiceSilenceMs={controller.voiceSilenceMs}
          boardSidebarGap={controller.boardSidebarGap}
          voiceHotkey={controller.voiceHotkey}
          chessboardTheme={controller.chessboardTheme}
          onToggleDarkMode={() =>
            controller.setUiThemeMode(
              controller.uiThemeMode === "dark" ? "light" : "dark",
            )
          }
          onToggleSound={() => controller.setSoundOn(!controller.soundOn)}
          onReset={() => controller.reset()}
          onChangeSide={controller.changeSide}
          onChangePreset={controller.setPreset}
          onChangeCustomSkill={controller.setCustomSkill}
          onChangeVoice={controller.setVoice}
          onChangeVoiceSilenceMs={controller.setVoiceSilenceMs}
          onChangeBoardSidebarGap={controller.setBoardSidebarGap}
          onChangeVoiceHotkey={controller.setVoiceHotkey}
          onChangeChessboardTheme={controller.setChessboardTheme}
        />

        <div
          className="mx-auto grid w-full max-w-[1400px] grid-cols-1 min-[600px]:grid-cols-2"
          style={{ gap: `${controller.boardSidebarGap}px` }}
        >
          <section className="min-w-0">
            <ChessBoard
              game={controller.game}
              orientedBoard={controller.orientedBoard}
              selected={controller.selected}
              lastMove={controller.lastMove}
              playerColor={controller.playerColor}
              pendingPromotion={controller.pendingPromotion}
              illegalFlash={controller.illegalFlash}
              gameOverInfo={controller.gameOverInfo}
              chessboardTheme={controller.chessboardTheme}
              onSquareClick={controller.handleSquare}
              onResolvePromotion={controller.resolvePromotion}
              onCancelPromotion={controller.cancelPromotion}
              onPlayAgain={() => controller.reset()}
            />
          </section>

          <GameSidebar
            transcript={controller.transcript}
            history={controller.history}
            pgn={controller.pgn}
            isThinking={controller.isThinking}
            isListening={controller.isListening}
            supported={controller.supported}
            voiceHotkey={controller.voiceHotkey}
            onToggleListening={controller.toggleListening}
          />
        </div>
      </div>
    </main>
  );
}
