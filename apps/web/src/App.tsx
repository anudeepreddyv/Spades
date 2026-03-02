import React, { useEffect } from 'react';
import { useGame } from './hooks/useGame';
import { Lobby } from './components/Lobby';
import { WaitingRoom } from './components/WaitingRoom';
import { GameTable } from './components/GameTable';

export default function App() {
  const { session, createRoom, joinRoom, startGame, placeBid, playCard, nextRound, leaveGame } = useGame();
  const { gameState, error, connected } = session;

  // Auto-start when vs CPU: both players are present and game is waiting
  useEffect(() => {
    if (
      gameState?.phase === 'waiting' &&
      gameState.players.length === 2 &&
      gameState.players.some(p => p.name === 'CPU')
    ) {
      startGame();
    }
  }, [gameState?.phase, gameState?.players.length]);

  if (!gameState) {
    return (
      <Lobby
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        error={error}
        connected={connected}
      />
    );
  }

  if (gameState.phase === 'waiting') {
    return (
      <WaitingRoom
        state={gameState}
        onStartGame={startGame}
        onLeave={leaveGame}
      />
    );
  }

  return (
    <GameTable
      state={gameState}
      onPlayCard={playCard}
      onBid={placeBid}
      onNextRound={nextRound}
      onLeave={leaveGame}
    />
  );
}
