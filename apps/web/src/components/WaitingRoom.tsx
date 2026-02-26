import React from 'react';
import { PublicGameState, TOTAL_ROUNDS } from '@spades/shared';

interface WaitingRoomProps {
  state: PublicGameState;
  onStartGame: () => void;
  onLeave: () => void;
}

const TEAM_COLORS = ['#93c5fd', '#fca5a5', '#86efac', '#fde68a', '#c4b5fd', '#f9a8d4'];
const TEAM_NAMES = ['Team Blue', 'Team Red', 'Team Green', 'Team Gold', 'Team Purple', 'Team Pink'];

function teamLabel(state: PublicGameState, teamIdx: number): string {
  if (state.config.teamMode === 'individual') return 'Individual';
  return TEAM_NAMES[teamIdx] || `Team ${teamIdx + 1}`;
}

export function WaitingRoom({ state, onStartGame, onLeave }: WaitingRoomProps) {
  const isHost = state.players[0]?.id === state.myPlayerId;
  const canStart = state.players.length >= 2;
  const spotsLeft = state.config.playerCount - state.players.length;

  const modeLabel = {
    individual: 'Individual (everyone for themselves)',
    two_teams: '2 Teams',
    three_teams: '3 Teams',
  }[state.config.teamMode];

  return (
    <div style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #1a2a4a 40%, #0f2318 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(30,80,50,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 480, padding: '0 16px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ color: '#f5c842', fontSize: 56, lineHeight: 1, marginBottom: 6, filter: 'drop-shadow(0 0 18px rgba(245,200,66,0.6))' }}>♠</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: '#f5c842', margin: 0 }}>Waiting Room</h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
            <span style={{ color: 'rgba(180,210,255,0.45)', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Room Code:</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, color: '#f5c842', fontWeight: 700, letterSpacing: '0.2em', background: 'rgba(0,0,0,0.4)', padding: '4px 14px', borderRadius: 8, border: '1px solid rgba(245,200,66,0.3)' }}>
              {state.id}
            </span>
          </div>
        </div>

        {/* Main card */}
        <div style={{ background: 'rgba(15,28,42,0.88)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: '24px 24px 20px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', marginBottom: 12 }}>

          {/* Game info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, padding: '10px 14px', background: 'rgba(245,200,66,0.06)', borderRadius: 8, border: '1px solid rgba(245,200,66,0.12)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#f5c842', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16 }}>{TOTAL_ROUNDS}</div>
              <div style={{ color: 'rgba(180,210,255,0.45)', fontSize: 10, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Rounds</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#f5c842', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14 }}>{modeLabel}</div>
              <div style={{ color: 'rgba(180,210,255,0.45)', fontSize: 10, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Mode</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#f5c842', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16 }}>{state.config.playerCount}</div>
              <div style={{ color: 'rgba(180,210,255,0.45)', fontSize: 10, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Players</div>
            </div>
          </div>

          {/* Players */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: '#f5c842', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>
                Players ({state.players.length}/{state.config.playerCount})
              </span>
              {spotsLeft > 0 && <span style={{ color: 'rgba(180,210,255,0.4)', fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {state.players.map((player) => {
                const color = TEAM_COLORS[player.teamIndex] || '#aaa';
                const isMe = player.id === state.myPlayerId;
                return (
                  <div key={player.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: isMe ? 'rgba(245,200,66,0.06)' : 'rgba(0,0,0,0.25)',
                    borderRadius: 10, padding: '10px 12px',
                    border: `1px solid ${isMe ? 'rgba(245,200,66,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${color}22`, border: `2px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                      {player.name[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: 'rgba(200,225,255,0.85)', fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</span>
                        {isMe && <span style={{ color: '#f5c842', fontSize: 9 }}>★</span>}
                      </div>
                      {state.config.teamMode !== 'individual' && (
                        <div style={{ color, fontSize: 10, fontFamily: "'DM Sans', sans-serif", opacity: 0.75 }}>{teamLabel(state, player.teamIndex)}</div>
                      )}
                    </div>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: player.connected ? '#4ade80' : '#f87171', flexShrink: 0 }} />
                  </div>
                );
              })}
              {/* Empty slots */}
              {Array.from({ length: spotsLeft }).map((_, i) => (
                <div key={`empty-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.1)', borderRadius: 10, padding: '10px 12px', border: '1px dashed rgba(255,255,255,0.06)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 16 }}>?</div>
                  <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12, fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif" }}>Waiting...</span>
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button onClick={onStartGame} disabled={!canStart} style={{
              width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
              cursor: canStart ? 'pointer' : 'not-allowed',
              background: canStart ? '#f5c842' : 'rgba(255,255,255,0.08)',
              color: canStart ? '#0d1b2a' : 'rgba(255,255,255,0.3)',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase' as const, transition: 'all 0.2s',
              boxShadow: canStart ? '0 0 20px rgba(245,200,66,0.3)' : 'none',
            }}>
              {canStart ? `▶ Start Game (${state.players.length} players)` : 'Need at least 2 players'}
            </button>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(160,200,160,0.45)', fontSize: 12, fontFamily: "'DM Sans', sans-serif', padding: '8px 0" }}>
              Waiting for host to start...
            </div>
          )}
        </div>

        <button onClick={onLeave} style={{ width: '100%', padding: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
          ← Leave Room
        </button>
      </div>
    </div>
  );
}
