import React from 'react';
import { PublicGameState } from '@spades/shared';

interface ScoreBoardProps {
  state: PublicGameState;
  onNextRound?: () => void;
}

export function ScoreBoard({ state, onNextRound }: ScoreBoardProps) {
  const team0 = state.players.filter(p => p.teamIndex === 0);
  const team1 = state.players.filter(p => p.teamIndex === 1);

  return (
    <div className="bg-felt-800/90 backdrop-blur rounded-2xl border border-felt-600/50 p-5 shadow-2xl w-full max-w-sm">
      <h3 className="text-gold-300 font-display text-center text-lg font-semibold mb-4">Scoreboard</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { players: team0, score: state.teamScores[0], color: 'blue', label: 'Team Blue' },
          { players: team1, score: state.teamScores[1], color: 'red', label: 'Team Red' }
        ].map(({ players, score, color, label }) => (
          <div key={label} className={`bg-${color}-900/30 rounded-xl p-3 border border-${color}-800/30`}>
            <div className={`text-${color}-300 text-xs font-body uppercase tracking-wider mb-2`}>{label}</div>
            <div className="text-white font-mono text-3xl font-bold mb-1">{score.score}</div>
            <div className="text-xs space-y-0.5">
              <div className="flex justify-between text-green-400/60">
                <span>Bags</span><span className="font-mono">{score.bags}</span>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              {players.map(p => (
                <div key={p.id} className={`text-xs ${p.id === state.myPlayerId ? 'text-gold-300' : 'text-green-400/60'}`}>
                  {p.name}
                  {state.bids[p.id] !== null && state.bids[p.id] !== undefined && (
                    <span className="text-green-600 ml-1">
                      (bid: {state.bids[p.id] === 'nil' ? 'NIL' : state.bids[p.id] === 'blind_nil' ? 'BN' : state.bids[p.id]})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {state.phase === 'scoring' && onNextRound && (
        <button onClick={onNextRound}
          className="w-full py-2.5 bg-gold-400 hover:bg-gold-300 text-felt-900 rounded-xl font-bold font-body tracking-wider uppercase text-sm transition-all shadow-glow">
          Next Round →
        </button>
      )}

      {state.phase === 'finished' && (
        <div className="text-center">
          <div className="text-gold-400 text-4xl mb-2">🏆</div>
          <div className="text-gold-300 font-display text-xl font-bold">
            {state.winner === 0 ? 'Team Blue' : 'Team Red'} Wins!
          </div>
        </div>
      )}
    </div>
  );
}
