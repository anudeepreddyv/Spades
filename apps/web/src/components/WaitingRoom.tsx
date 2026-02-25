import React from 'react';
import { PublicGameState } from '@spades/shared';

interface WaitingRoomProps {
  state: PublicGameState;
  onStartGame: () => void;
  onLeave: () => void;
}

const TEAM_COLORS = ['text-blue-300', 'text-red-300'];
const TEAM_NAMES = ['Team Blue', 'Team Red'];

export function WaitingRoom({ state, onStartGame, onLeave }: WaitingRoomProps) {
  const isHost = state.players[0]?.id === state.myPlayerId;
  const canStart = state.players.length >= 2;

  return (
    <div className="felt-texture min-h-screen flex items-center justify-center">
      <div className="relative z-10 w-full max-w-lg px-4">
        <div className="text-center mb-8">
          <div className="text-gold-400 text-6xl mb-2">♠</div>
          <h1 className="font-display text-4xl text-gold-300 font-bold">Waiting Room</h1>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-green-400/60 text-sm">Room Code:</span>
            <span className="font-mono text-2xl text-gold-400 font-bold tracking-widest bg-felt-900/60 px-4 py-1 rounded-lg border border-felt-600">
              {state.id}
            </span>
          </div>
          <p className="text-green-400/40 text-xs mt-2">Share this code with friends</p>
        </div>

        <div className="bg-felt-800/80 backdrop-blur rounded-2xl border border-felt-600/50 p-6 shadow-2xl mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-gold-300 font-body font-medium tracking-wider uppercase text-sm">
              Players ({state.players.length}/{state.config.playerCount})
            </h2>
            <span className="text-green-400/60 text-xs font-mono">
              Target: {state.config.targetScore} pts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {state.players.map((player, i) => (
              <div key={player.id}
                className={`flex items-center gap-3 bg-felt-900/60 rounded-xl p-3 border ${player.id === state.myPlayerId ? 'border-gold-400/50' : 'border-felt-600/30'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${player.teamIndex === 0 ? 'bg-blue-900/60 text-blue-300' : 'bg-red-900/60 text-red-300'}`}>
                  {player.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-green-100 text-sm font-medium truncate">{player.name}</span>
                    {player.id === state.myPlayerId && <span className="text-gold-400 text-xs">(You)</span>}
                  </div>
                  <span className={`text-xs ${TEAM_COLORS[player.teamIndex]}`}>{TEAM_NAMES[player.teamIndex]}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${player.connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: state.config.playerCount - state.players.length }).map((_, i) => (
              <div key={`empty-${i}`}
                className="flex items-center gap-3 bg-felt-900/30 rounded-xl p-3 border border-dashed border-felt-600/30">
                <div className="w-8 h-8 rounded-full bg-felt-700/30 flex items-center justify-center">
                  <span className="text-felt-600 text-lg">?</span>
                </div>
                <span className="text-felt-600 text-sm italic">Waiting...</span>
              </div>
            ))}
          </div>

          {isHost && (
            <button onClick={onStartGame} disabled={!canStart}
              className="w-full mt-6 py-3 bg-gold-400 hover:bg-gold-300 text-felt-900 rounded-xl font-bold font-body tracking-widest uppercase text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-glow">
              {canStart ? '▶ Start Game' : `Need at least 2 players`}
            </button>
          )}
          {!isHost && (
            <div className="mt-6 text-center text-green-400/40 text-sm animate-pulse">
              Waiting for host to start...
            </div>
          )}
        </div>

        <button onClick={onLeave} className="w-full py-2 text-green-900 hover:text-green-700 text-sm transition-colors">
          ← Leave Room
        </button>
      </div>
    </div>
  );
}
