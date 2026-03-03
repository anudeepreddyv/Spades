import React from 'react';
import { PublicGameState, TOTAL_ROUNDS } from '@spades/shared';
import { useScreenSize } from '../hooks/useScreenSize';

interface ScoreBoardProps {
  state: PublicGameState;
  onNextRound?: () => void;
}

const TEAM_COLORS = ['#93c5fd', '#fca5a5', '#86efac', '#fde68a', '#c4b5fd', '#f9a8d4', '#6ee7b7'];

function getPlayerName(state: PublicGameState, ti: number): string {
  return state.players.find(p => p.teamIndex === ti)?.name || `Player ${ti + 1}`;
}

function getShortName(name: string, max: number): string {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

// ── Round History Table ───────────────────────────────────────────────────────
function RoundHistoryTable({ state, compact }: { state: PublicGameState; compact: boolean }) {
  const teamCount = state.teamScores.length;
  const roundCount = state.teamScores[0]?.roundHistory?.length ?? 0;
  const myTeamIdx = state.players.find(p => p.id === state.myPlayerId)?.teamIndex ?? 0;

  if (roundCount === 0) return null;

  const cellPad = compact ? '3px 4px' : '5px 8px';
  const fontSize = compact ? 9 : 11;
  const headFontSize = compact ? 8 : 10;

  const thStyle: React.CSSProperties = {
    padding: cellPad,
    fontSize: headFontSize,
    fontFamily: "'DM Sans', sans-serif",
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    whiteSpace: 'nowrap',
    fontWeight: 600,
    textAlign: 'center',
  };

  const tdStyle: React.CSSProperties = {
    padding: cellPad,
    fontSize,
    fontFamily: "'JetBrains Mono', monospace",
    textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{
      overflowX: 'auto',
      overflowY: 'auto',
      maxHeight: compact ? 200 : 320,
      borderRadius: 8,
      background: 'rgba(0,0,0,0.2)',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255,255,255,0.1) transparent',
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: teamCount > 2 ? 320 : 'auto',
      }}>
        <thead>
          <tr style={{ position: 'sticky', top: 0, background: '#0d1a10', zIndex: 2 }}>
            <th style={{ ...thStyle, textAlign: 'left', position: 'sticky', left: 0, background: '#0d1a10', zIndex: 3 }}>R#</th>
            {state.teamScores.map((_, ti) => {
              const color = TEAM_COLORS[ti % TEAM_COLORS.length];
              const isMe = ti === myTeamIdx;
              const name = compact ? getShortName(getPlayerName(state, ti), 4) : getShortName(getPlayerName(state, ti), 8);
              return (
                <React.Fragment key={ti}>
                  <th style={{ ...thStyle, color: isMe ? '#f5c842' : color }}>{name}<br />B/W</th>
                  <th style={{ ...thStyle, color: isMe ? '#f5c842' : color }}>Score</th>
                </React.Fragment>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: roundCount }, (_, rIdx) => (
            <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
              <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 700, color: 'rgba(255,255,255,0.3)', position: 'sticky', left: 0, background: rIdx % 2 === 0 ? '#0e1c12' : '#0d1a10', zIndex: 1 }}>
                {rIdx + 1}
              </td>
              {state.teamScores.map((ts, ti) => {
                const h = ts.roundHistory[rIdx];
                if (!h) return <React.Fragment key={ti}><td style={tdStyle}>-</td><td style={tdStyle}>-</td></React.Fragment>;
                const color = TEAM_COLORS[ti % TEAM_COLORS.length];
                const isMe = ti === myTeamIdx;
                return (
                  <React.Fragment key={ti}>
                    <td style={tdStyle}>
                      <span style={{ color: isMe ? '#f5c842' : color, fontWeight: 600 }}>{h.bids}</span>
                      <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
                      <span style={{ color: h.tricks >= h.bids ? '#4ade80' : '#f87171', fontWeight: 600 }}>{h.tricks}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        color: h.scoreDelta >= 0 ? '#4ade80' : '#f87171',
                        fontWeight: 700,
                      }}>
                        {h.scoreDelta >= 0 ? '+' : ''}{h.scoreDelta}
                      </span>
                      {h.bags > 0 && (
                        <span style={{ fontSize: compact ? 7 : 8, color: 'rgba(251,191,36,0.7)', marginLeft: 2 }}>
                          +{h.bags}B
                        </span>
                      )}
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
          {/* Totals row */}
          <tr style={{ background: 'rgba(245,200,66,0.06)', borderTop: '2px solid rgba(245,200,66,0.2)' }}>
            <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 800, color: '#f5c842', position: 'sticky', left: 0, background: '#141f11', zIndex: 1, borderBottom: 'none' }}>
              ∑
            </td>
            {state.teamScores.map((ts, ti) => {
              const color = TEAM_COLORS[ti % TEAM_COLORS.length];
              const isMe = ti === myTeamIdx;
              return (
                <React.Fragment key={ti}>
                  <td style={{ ...tdStyle, borderBottom: 'none' }}>
                    {ts.bags > 0 && (
                      <span style={{ fontSize: compact ? 8 : 9, color: 'rgba(251,191,36,0.75)' }}>{ts.bags}B</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 800, fontSize: compact ? 12 : 14, color: ts.score < 0 ? '#f87171' : (isMe ? '#f5c842' : color), borderBottom: 'none' }}>
                    {ts.score}
                  </td>
                </React.Fragment>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ScoreBoard({ state, onNextRound }: ScoreBoardProps) {
  const isFinished = state.phase === 'finished';
  const myTeamIdx = state.players.find(p => p.id === state.myPlayerId)?.teamIndex ?? 0;
  const iAmWinner = state.winner === myTeamIdx;
  const roundsLeft = TOTAL_ROUNDS - state.round;
  const { isMobile } = useScreenSize();
  const compact = isMobile;

  // ── FINISHED SCREEN ──────────────────────────────────────────────────────────
  if (isFinished) {
    return (
      <div style={{
        background: '#0d1a10', borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.09)',
        padding: compact ? '16px 12px' : '24px 28px', boxShadow: '0 24px 60px rgba(0,0,0,0.88)',
        width: '100%', maxWidth: 'min(520px, 94vw)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{iAmWinner ? '🏆' : '👏'}</div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: compact ? 18 : 22, fontWeight: 700, color: '#f5c842', margin: '0 0 4px' }}>
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
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700,
              color: iAmWinner ? '#f5c842' : TEAM_COLORS[state.winner]
            }}>
              {getPlayerName(state, state.winner)} Wins!
            </div>
          </div>
        )}

        {/* Full round history table */}
        <div style={{ marginBottom: 16 }}>
          <RoundHistoryTable state={state} compact={compact} />
        </div>

        <div style={{ textAlign: 'center', color: 'rgba(160,200,160,0.35)', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
          Thanks for playing! Refresh to start a new game.
        </div>
      </div>
    );
  }

  // ── ROUND COMPLETE SCREEN — with history table ──────────────────────────────
  // If no onNextRound, this is the inline score popup during gameplay
  const isInlinePopup = !onNextRound && state.phase === 'playing';

  return (
    <div style={{
      background: '#0d1a10', borderRadius: isInlinePopup ? 12 : 16,
      border: '1px solid rgba(255,255,255,0.08)',
      padding: compact ? '14px 10px' : '22px 24px', boxShadow: '0 24px 60px rgba(0,0,0,0.88)',
      width: '100%', maxWidth: isInlinePopup ? 'min(480px, 90vw)' : 'min(520px, 94vw)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: compact ? 10 : 16 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: compact ? 16 : 20, fontWeight: 700, color: '#f5c842', margin: '0 0 4px' }}>
          {isInlinePopup ? 'Score History' : `Round ${state.round} Complete`}
        </h3>
        {!isInlinePopup && (
          <p style={{ color: 'rgba(160,200,160,0.4)', fontSize: 12, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
            {roundsLeft} round{roundsLeft !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>

      {/* Current round result (only for round-complete overlay) */}
      {!isInlinePopup && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: compact ? 10 : 14 }}>
          {state.teamScores.map((ts, ti) => {
            const color = TEAM_COLORS[ti % TEAM_COLORS.length];
            const isMe = ti === myTeamIdx;

            const madeBid = ts.tricks >= ts.bids;
            const bidScore = madeBid ? ts.bids * 10 : -(ts.bids * 10);
            const bagsThisRound = madeBid ? ts.tricks - ts.bids : 0;

            return (
              <div key={ti} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: isMe ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${isMe ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.03)'}`,
                borderRadius: 10, padding: compact ? '7px 10px' : '10px 14px',
              }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: compact ? 12 : 13, fontWeight: 700, color }}>
                  {getPlayerName(state, ti)}
                  {isMe && <span style={{ color: '#f5c842', fontSize: 10, marginLeft: 5 }}>★ You</span>}
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginTop: 2 }}>
                    Bid {ts.bids} · Won {ts.tricks}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: compact ? 18 : 22, fontWeight: 800,
                    color: bidScore >= 0 ? '#4ade80' : '#f87171',
                  }}>
                    {bidScore >= 0 ? '+' : ''}{bidScore}
                  </span>
                  {bagsThisRound > 0 && (
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
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
      )}

      {/* Full round history table */}
      <RoundHistoryTable state={state} compact={compact} />

      {/* Next round button */}
      {onNextRound && (
        <button onClick={onNextRound} style={{
          width: '100%', padding: '13px 0', borderRadius: 10,
          border: 'none', cursor: 'pointer',
          background: '#f5c842', color: '#0d1a10',
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          boxShadow: '0 0 20px rgba(245,200,66,0.28)',
          marginTop: compact ? 10 : 16,
        }}>
          Round {state.round + 1} → Deal {state.round + 1} Cards
        </button>
      )}
    </div>
  );
}
