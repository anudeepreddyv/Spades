import React from 'react';
import { PublicGameState, TOTAL_ROUNDS } from '@spades/shared';

interface ScoreBoardProps {
  state: PublicGameState;
  onNextRound?: () => void;
}

const TEAM_COLORS = ['#93c5fd','#fca5a5','#86efac','#fde68a','#c4b5fd','#f9a8d4','#6ee7b7'];
const TEAM_NAMES = ['Team Blue','Team Red','Team Green','Team Gold','Team Purple','Team Pink','Team Teal'];

function getDisplayName(state: PublicGameState, ti: number): string {
  if (state.config.teamMode === 'individual') {
    return state.players.find(p => p.teamIndex === ti)?.name || `Player ${ti + 1}`;
  }
  return TEAM_NAMES[ti] || `Team ${ti + 1}`;
}

// Format score as "120 + 3B" (bags shown separately)
function formatScore(score: number, bags: number, isGameOver: boolean): React.ReactNode {
  if (isGameOver) {
    // At game end, bags already folded into score — just show final number
    return (
      <span style={{ color: score >= 0 ? 'inherit' : '#f87171' }}>
        {score}
      </span>
    );
  }
  return (
    <span>
      <span style={{ color: score >= 0 ? 'inherit' : '#f87171' }}>{score}</span>
      {bags > 0 && (
        <span style={{ fontSize: '0.6em', color: 'rgba(251,191,36,0.75)', marginLeft: 4, fontWeight: 600 }}>
          +{bags}B
        </span>
      )}
    </span>
  );
}

export function ScoreBoard({ state, onNextRound }: ScoreBoardProps) {
  const isFinished = state.phase === 'finished';
  const teamCount = state.teamScores.length;
  const myTeamIdx = state.players.find(p => p.id === state.myPlayerId)?.teamIndex ?? 0;
  const iAmWinner = state.winner === myTeamIdx;
  const roundsLeft = TOTAL_ROUNDS - state.round;

  return (
    <div style={{
      background: '#0d1a10',
      borderRadius: 18,
      border: '1px solid rgba(255,255,255,0.09)',
      padding: '22px 24px',
      boxShadow: '0 24px 60px rgba(0,0,0,0.88)',
      width: '100%',
      maxWidth: isFinished ? 500 : 400,
    }}>
      {/* Title */}
      <h3 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 20, fontWeight: 600, color: '#f5c842',
        textAlign: 'center', margin: '0 0 4px',
      }}>
        {isFinished ? '🏆 Final Results' : `Round ${state.round} Complete`}
      </h3>
      <p style={{
        textAlign: 'center', color: 'rgba(160,200,160,0.45)',
        fontSize: 11, fontFamily: "'DM Sans', sans-serif", margin: '0 0 16px',
      }}>
        {isFinished
          ? 'All 13 rounds played — bags cashed in'
          : `${roundsLeft} round${roundsLeft !== 1 ? 's' : ''} remaining · B = bags (count, not score yet)`}
      </p>

      {/* Winner banner */}
      {isFinished && state.winner !== null && (
        <div style={{
          background: iAmWinner ? 'rgba(245,200,66,0.14)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${iAmWinner ? 'rgba(245,200,66,0.45)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 12, padding: '12px 16px',
          marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: iAmWinner ? 34 : 26, marginBottom: 4 }}>{iAmWinner ? '🎉' : '👏'}</div>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700,
            color: iAmWinner ? '#f5c842' : TEAM_COLORS[state.winner],
          }}>
            {getDisplayName(state, state.winner)} Wins!
          </div>
          {iAmWinner && (
            <div style={{ color: 'rgba(245,200,66,0.65)', fontSize: 12, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
              Congratulations! 🥳
            </div>
          )}
        </div>
      )}

      {/* Score cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {state.teamScores.map((ts, ti) => {
          const color = TEAM_COLORS[ti % TEAM_COLORS.length];
          const isMe = ti === myTeamIdx;
          const isWinner = isFinished && state.winner === ti;
          const members = state.players.filter(p => p.teamIndex === ti);
          const lastDelta = ts.roundScores[ts.roundScores.length - 1];

          return (
            <div key={ti} style={{
              background: isWinner ? 'rgba(245,200,66,0.08)' : isMe ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.22)',
              border: `1px solid ${isWinner ? 'rgba(245,200,66,0.3)' : isMe ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)'}`,
              borderRadius: 10, padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Left: name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isWinner && <span style={{ fontSize: 16 }}>🏆</span>}
                  <div>
                    <div style={{
                      color, fontSize: 13, fontWeight: 700,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {getDisplayName(state, ti)}
                      {isMe && <span style={{ color: '#f5c842', fontSize: 10, marginLeft: 6 }}>★ You</span>}
                    </div>
                    {state.config.teamMode !== 'individual' && (
                      <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
                        {members.map(p => p.name).join(' & ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: score */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 24, fontWeight: 700, color,
                    letterSpacing: '-0.02em',
                  }}>
                    {formatScore(ts.score, ts.bags, isFinished)}
                  </div>
                  {!isFinished && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
                      Bid {ts.bids} · Won {ts.tricks}
                    </div>
                  )}
                </div>
              </div>

              {/* This round delta */}
              {!isFinished && lastDelta !== undefined && (
                <div style={{
                  marginTop: 6, paddingTop: 6,
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                  color: 'rgba(160,200,160,0.45)',
                }}>
                  This round:{' '}
                  <span style={{ color: lastDelta >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                    {lastDelta >= 0 ? '+' : ''}{lastDelta}
                  </span>
                  {ts.tricks > ts.bids && (
                    <span style={{ color: 'rgba(251,191,36,0.65)', marginLeft: 6 }}>
                      +{ts.tricks - ts.bids}B (total {ts.bags}B)
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bag explanation strip */}
      {!isFinished && (
        <div style={{
          background: 'rgba(251,191,36,0.05)',
          border: '1px solid rgba(251,191,36,0.12)',
          borderRadius: 8, padding: '8px 12px',
          marginBottom: 14,
          fontSize: 11, color: 'rgba(251,191,36,0.55)',
          fontFamily: "'DM Sans', sans-serif",
          textAlign: 'center',
        }}>
          💼 Bags don't count until the end of Round 13 (1 pt each)
        </div>
      )}

      {/* Round history on finished screen */}
      {isFinished && state.teamScores[0]?.roundScores.length > 0 && (
        <div style={{
          marginBottom: 16, background: 'rgba(0,0,0,0.2)',
          borderRadius: 8, padding: '10px 12px',
        }}>
          <div style={{
            fontSize: 10, color: 'rgba(255,255,255,0.28)',
            fontFamily: "'DM Sans', sans-serif",
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
          }}>
            Round-by-round
          </div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {state.teamScores[0].roundScores.map((_, rIdx) => (
              <div key={rIdx} style={{ textAlign: 'center', minWidth: 30 }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>R{rIdx + 1}</div>
                {state.teamScores.map((ts, ti) => (
                  <div key={ti} style={{
                    fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                    color: (ts.roundScores[rIdx] ?? 0) >= 0 ? TEAM_COLORS[ti % TEAM_COLORS.length] : '#f87171',
                  }}>
                    {(ts.roundScores[rIdx] ?? 0) >= 0 ? '+' : ''}{ts.roundScores[rIdx] ?? 0}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next round button */}
      {!isFinished && onNextRound && (
        <button onClick={onNextRound} style={{
          width: '100%', padding: '12px 0', borderRadius: 10,
          border: 'none', cursor: 'pointer',
          background: '#f5c842', color: '#0d1a10',
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          boxShadow: '0 0 20px rgba(245,200,66,0.28)',
        }}>
          Round {state.round + 1} → Deal {state.round + 1} Cards
        </button>
      )}

      {isFinished && (
        <div style={{
          textAlign: 'center', color: 'rgba(160,200,160,0.35)',
          fontSize: 11, fontFamily: "'DM Sans', sans-serif",
        }}>
          Thanks for playing! Refresh to start a new game.
        </div>
      )}
    </div>
  );
}
