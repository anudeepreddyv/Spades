import React from 'react';
import { PublicGameState, TOTAL_ROUNDS } from '@spades/shared';

interface ScoreBoardProps {
  state: PublicGameState;
  onNextRound?: () => void;
}

const TEAM_COLORS = ['#93c5fd','#fca5a5','#86efac','#fde68a','#c4b5fd','#f9a8d4','#6ee7b7'];

function getPlayerName(state: PublicGameState, ti: number): string {
  return state.players.find(p => p.teamIndex === ti)?.name || `Player ${ti + 1}`;
}

export function ScoreBoard({ state, onNextRound }: ScoreBoardProps) {
  const isFinished = state.phase === 'finished';
  const myTeamIdx = state.players.find(p => p.id === state.myPlayerId)?.teamIndex ?? 0;
  const iAmWinner = state.winner === myTeamIdx;
  const roundsLeft = TOTAL_ROUNDS - state.round;

  // ── FINISHED SCREEN ──────────────────────────────────────────────────────────
  if (isFinished) {
    return (
      <div style={{
        background: '#0d1a10', borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.09)',
        padding: '24px 28px', boxShadow: '0 24px 60px rgba(0,0,0,0.88)',
        width: '100%', maxWidth: 'min(440px, 92vw)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{iAmWinner ? '🏆' : '👏'}</div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#f5c842', margin: '0 0 4px' }}>
            Final Results
          </h3>
          <p style={{ color: 'rgba(160,200,160,0.5)', fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
            All 13 rounds played
          </p>
        </div>

        {/* Winner */}
        {state.winner !== null && (
          <div style={{
            background: iAmWinner ? 'rgba(245,200,66,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${iAmWinner ? 'rgba(245,200,66,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, padding: '12px 16px', marginBottom: 16, textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700,
              color: iAmWinner ? '#f5c842' : TEAM_COLORS[state.winner] }}>
              {getPlayerName(state, state.winner)} Wins!
            </div>
          </div>
        )}

        {/* Final scores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {state.teamScores.map((ts, ti) => {
            const color = TEAM_COLORS[ti % TEAM_COLORS.length];
            const isMe = ti === myTeamIdx;
            return (
              <div key={ti} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: isMe ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${isMe ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
                borderRadius: 10, padding: '10px 16px',
              }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color }}>
                  {getPlayerName(state, ti)}{isMe && <span style={{ color: '#f5c842', fontSize: 10, marginLeft: 6 }}>★ You</span>}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700,
                  color: ts.score < 0 ? '#f87171' : color }}>
                  {ts.score}
                </span>
              </div>
            );
          })}
        </div>

        {/* Round-by-round mini grid */}
        {state.teamScores[0]?.roundScores.length > 0 && (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Sans', sans-serif",
              textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Round by Round</div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {state.teamScores[0].roundScores.map((_, rIdx) => (
                <div key={rIdx} style={{ textAlign: 'center', minWidth: 28 }}>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>
                    R{rIdx + 1}
                  </div>
                  {state.teamScores.map((ts, ti) => (
                    <div key={ti} style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                      color: (ts.roundScores[rIdx] ?? 0) >= 0 ? TEAM_COLORS[ti % TEAM_COLORS.length] : '#f87171' }}>
                      {(ts.roundScores[rIdx] ?? 0) >= 0 ? '+' : ''}{ts.roundScores[rIdx] ?? 0}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', color: 'rgba(160,200,160,0.35)', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
          Thanks for playing! Refresh to start a new game.
        </div>
      </div>
    );
  }

  // ── ROUND COMPLETE SCREEN — minimal, shows only this round ──────────────────
  return (
    <div style={{
      background: '#0d1a10', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)',
      padding: '22px 24px', boxShadow: '0 24px 60px rgba(0,0,0,0.88)',
      width: '100%', maxWidth: 'min(360px, 92vw)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#f5c842', margin: '0 0 4px' }}>
          Round {state.round} Complete
        </h3>
        <p style={{ color: 'rgba(160,200,160,0.4)', fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
          {roundsLeft} round{roundsLeft !== 1 ? 's' : ''} remaining
        </p>
      </div>

      {/* One row per player — name | bid/won | round score */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        {state.teamScores.map((ts, ti) => {
          const color = TEAM_COLORS[ti % TEAM_COLORS.length];
          const isMe = ti === myTeamIdx;

          // Compute THIS round's result purely from bids/tricks — never use cumulative score
          const madeBid = ts.tricks >= ts.bids;
          const bidScore = madeBid ? ts.bids * 10 : -(ts.bids * 10);
          const bagsThisRound = madeBid ? ts.tricks - ts.bids : 0;

          return (
            <div key={ti} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: isMe ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.2)',
              border: `1px solid ${isMe ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.03)'}`,
              borderRadius: 10, padding: '10px 14px',
            }}>
              {/* Name + bid/won */}
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color }}>
                {getPlayerName(state, ti)}
                {isMe && <span style={{ color: '#f5c842', fontSize: 10, marginLeft: 5 }}>★ You</span>}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginTop: 2 }}>
                  Bid {ts.bids} · Won {ts.tricks}
                </div>
              </div>

              {/* This round's score: bid score + bags earned */}
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 800,
                  color: bidScore >= 0 ? '#4ade80' : '#f87171',
                }}>
                  {bidScore >= 0 ? '+' : ''}{bidScore}
                </span>
                {bagsThisRound > 0 && (
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
                    color: 'rgba(251,191,36,0.8)', marginLeft: 4,
                  }}>
                    +{bagsThisRound}B
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Next round button */}
      {onNextRound && (
        <button onClick={onNextRound} style={{
          width: '100%', padding: '13px 0', borderRadius: 10,
          border: 'none', cursor: 'pointer',
          background: '#f5c842', color: '#0d1a10',
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          boxShadow: '0 0 20px rgba(245,200,66,0.28)',
        }}>
          Round {state.round + 1} → Deal {state.round + 1} Cards
        </button>
      )}
    </div>
  );
}
