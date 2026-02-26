import React from 'react';
import { PublicGameState, TeamMode, TOTAL_ROUNDS } from '@spades/shared';

interface ScoreBoardProps {
  state: PublicGameState;
  onNextRound?: () => void;
}

const TEAM_COLORS = ['#93c5fd', '#fca5a5', '#86efac', '#fde68a', '#c4b5fd', '#f9a8d4', '#6ee7b7'];
const TEAM_NAMES = ['Team Blue', 'Team Red', 'Team Green', 'Team Gold', 'Team Purple', 'Team Pink', 'Team Teal'];

function getTeamName(state: PublicGameState, teamIdx: number): string {
  if (state.config.teamMode === 'individual') {
    const p = state.players.find(p => p.teamIndex === teamIdx);
    return p?.name || `Player ${teamIdx + 1}`;
  }
  return TEAM_NAMES[teamIdx] || `Team ${teamIdx + 1}`;
}

function getTeamPlayers(state: PublicGameState, teamIdx: number) {
  return state.players.filter(p => p.teamIndex === teamIdx);
}

export function ScoreBoard({ state, onNextRound }: ScoreBoardProps) {
  const isFinished = state.phase === 'finished';
  const teamCount = state.teamScores.length;
  const myTeamIdx = state.players.find(p => p.id === state.myPlayerId)?.teamIndex ?? 0;
  const iAmWinner = state.winner === myTeamIdx;

  return (
    <div style={{
      background: '#0f1e14',
      borderRadius: 18,
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '22px 24px',
      boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
      width: '100%',
      maxWidth: isFinished ? 480 : 380,
    }}>

      {/* Title */}
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: '#f5c842', textAlign: 'center', margin: '0 0 4px' }}>
        {isFinished ? '🏆 Final Results' : `Round ${state.round} Complete`}
      </h3>
      <p style={{ textAlign: 'center', color: 'rgba(160,200,160,0.5)', fontSize: 11, fontFamily: "'DM Sans', sans-serif", margin: '0 0 18px' }}>
        {isFinished ? 'Game over — all 13 rounds played' : `${TOTAL_ROUNDS - state.round} rounds remaining`}
      </p>

      {/* Winner banner */}
      {isFinished && state.winner !== null && (
        <div style={{
          background: iAmWinner ? 'rgba(245,200,66,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${iAmWinner ? 'rgba(245,200,66,0.5)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 12, padding: '12px 16px', marginBottom: 18, textAlign: 'center',
        }}>
          <div style={{ fontSize: iAmWinner ? 32 : 24, marginBottom: 4 }}>{iAmWinner ? '🎉' : '👏'}</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: iAmWinner ? '#f5c842' : TEAM_COLORS[state.winner] }}>
            {getTeamName(state, state.winner)} Wins!
          </div>
          {iAmWinner && <div style={{ color: 'rgba(245,200,66,0.7)', fontSize: 12, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>Congratulations! 🥳</div>}
        </div>
      )}

      {/* Score table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        {state.teamScores.map((ts, i) => {
          const color = TEAM_COLORS[i] || '#aaa';
          const isMe = i === myTeamIdx;
          const isWinner = isFinished && state.winner === i;
          const players = getTeamPlayers(state, i);

          return (
            <div key={i} style={{
              background: isWinner ? 'rgba(245,200,66,0.08)' : isMe ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.25)',
              border: `1px solid ${isWinner ? 'rgba(245,200,66,0.3)' : isMe ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 10, padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isWinner && <span>🏆</span>}
                  <div>
                    <div style={{ color, fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
                      {getTeamName(state, i)}
                      {isMe && <span style={{ color: '#f5c842', fontSize: 10, marginLeft: 6 }}>★ You</span>}
                    </div>
                    {state.config.teamMode !== 'individual' && (
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
                        {players.map(p => p.name).join(' & ')}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: ts.score >= 0 ? color : '#f87171' }}>
                    {ts.score}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif" }}>
                    {ts.bags} bag{ts.bags !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* This round summary */}
              {!isFinished && ts.roundScores.length > 0 && (
                <div style={{ fontSize: 10, color: 'rgba(160,200,160,0.5)', fontFamily: "'JetBrains Mono', monospace", borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 4, marginTop: 4 }}>
                  This round: <span style={{ color: (ts.roundScores[ts.roundScores.length - 1] ?? 0) >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                    {(ts.roundScores[ts.roundScores.length - 1] ?? 0) >= 0 ? '+' : ''}{ts.roundScores[ts.roundScores.length - 1] ?? 0}
                  </span>
                  {' · '}Bid: {ts.bids} | Won: {ts.tricks}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Round history (compact) */}
      {isFinished && state.teamScores[0]?.roundScores.length > 0 && (
        <div style={{ marginBottom: 18, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Round-by-round</div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {state.teamScores[0].roundScores.map((_, rIdx) => (
              <div key={rIdx} style={{ textAlign: 'center', minWidth: 28 }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>R{rIdx + 1}</div>
                {state.teamScores.map((ts, ti) => (
                  <div key={ti} style={{
                    fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                    color: (ts.roundScores[rIdx] ?? 0) >= 0 ? TEAM_COLORS[ti] : '#f87171',
                  }}>
                    {(ts.roundScores[rIdx] ?? 0) >= 0 ? '+' : ''}{ts.roundScores[rIdx] ?? 0}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action button */}
      {!isFinished && onNextRound && (
        <button onClick={onNextRound} style={{
          width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: '#f5c842', color: '#0f1e14',
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase' as const,
          boxShadow: '0 0 20px rgba(245,200,66,0.3)',
        }}>
          Round {state.round + 1} → Deal {state.round + 1} Cards
        </button>
      )}

      {isFinished && (
        <div style={{ textAlign: 'center', color: 'rgba(160,200,160,0.4)', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
          Thanks for playing! Refresh to start a new game.
        </div>
      )}
    </div>
  );
}
