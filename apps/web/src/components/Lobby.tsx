import React, { useState } from 'react';
import { GameConfig, TeamMode } from '@spades/shared';

interface LobbyProps {
  onCreateRoom: (name: string, config: Partial<GameConfig>) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  error: string | null;
  connected: boolean;
}

const SUITS = [
  { symbol: '♠', color: '#c8d8f0', pos: { top: 32, left: 32 } },
  { symbol: '♣', color: '#a8e6c0', pos: { top: 32, right: 32 } },
  { symbol: '♥', color: '#f4a0a0', pos: { bottom: 32, left: 32 } },
  { symbol: '♦', color: '#f5c86a', pos: { bottom: 32, right: 32 } },
];

const C = {
  bg: 'linear-gradient(135deg, #0d1b2a 0%, #1a2a4a 40%, #0f2318 100%)',
  card: 'rgba(15,28,42,0.92)',
  border: 'rgba(255,255,255,0.08)',
  gold: '#f5c842', goldLight: '#fae49a',
  input: 'rgba(8,16,28,0.7)',
  inputBorder: 'rgba(255,255,255,0.12)',
  text: 'rgba(200,225,255,0.85)',
  textMuted: 'rgba(180,210,255,0.45)',
  textLabel: '#f5c842',
  btnGold: '#f5c842', btnText: '#0d1b2a',
  errorBg: 'rgba(180,40,40,0.2)', errorBorder: 'rgba(220,80,80,0.4)', errorText: '#fca5a5',
};

// ── Dynamic team option generator ────────────────────────────────────────────
// For any even N, generate all meaningful ways to split into equal teams.
// Returns options from fewest teams (biggest teams) to most teams (individual).
function getTeamOptions(count: number): { value: string; numTeams: number; teamSize: number; label: string; desc: string }[] {
  if (count < 2) return [];
  const opts: { value: string; numTeams: number; teamSize: number; label: string; desc: string }[] = [];

  if (count % 2 === 0) {
    // Find all divisors of count that give equal teams (both parts >= 2)
    for (let numTeams = 2; numTeams <= count / 2; numTeams++) {
      if (count % numTeams === 0) {
        const teamSize = count / numTeams;
        const desc = Array.from({ length: numTeams }, () => teamSize).join(' vs ');
        opts.push({
          value: numTeams === 2 ? 'two_teams' : 'three_teams',
          numTeams,
          teamSize,
          label: `${numTeams} Teams`,
          desc,
        });
      }
    }
  }

  // Always add individual
  opts.push({
    value: 'individual',
    numTeams: count,
    teamSize: 1,
    label: 'Individual',
    desc: 'Everyone for themselves',
  });

  return opts;
}

// ── Rules popup ───────────────────────────────────────────────────────────────
function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f1e14',
          border: '1px solid rgba(245,200,66,0.25)',
          borderRadius: 20,
          padding: '32px 36px',
          maxWidth: 540,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04) inset',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)', fontSize: 16, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>♠</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#f5c842', margin: 0 }}>
            How to Play Spades
          </h2>
        </div>

        {/* Rules sections */}
        {[
          {
            icon: '🃏',
            title: 'The Basics',
            body: 'Spades is a trick-taking card game. The goal is to accurately predict how many tricks you will win each round. Spades are always the trump suit — they beat every other suit.',
          },
          {
            icon: '📅',
            title: '13 Rounds',
            body: 'The game lasts exactly 13 rounds. In Round 1, each player gets 1 card. In Round 2, each player gets 2 cards — and so on up to Round 13 where everyone gets 13 cards.',
          },
          {
            icon: '🤔',
            title: 'Bidding',
            body: 'Before each round, every player bids the number of tricks they expect to win. You can only bid between 0 and however many cards you hold that round. Your bid is your promise!',
          },
          {
            icon: '🎮',
            title: 'Playing Tricks',
            body: 'The player to the left of the dealer leads. Everyone must follow the led suit if they can. If you can\'t follow suit, you may play any card including a spade. The highest card of the led suit wins — unless someone played a spade, in which case the highest spade wins. Spades cannot be led until they have been "broken" (played on a previous trick).',
          },
          {
            icon: '✅',
            title: 'Making Your Bid',
            body: 'If you win exactly as many tricks as you bid, you score 10 × bid points. If you win fewer tricks than you bid, you lose 10 × bid points. Simple!',
          },
          {
            icon: '👜',
            title: 'Bags (Overtricks)',
            body: 'Winning more tricks than you bid earns you 1 bag point each. But be careful — every 3 bags you collect costs you a 30-point penalty and those bags are reset. Bags add up fast!',
          },
          {
            icon: '🚫',
            title: 'Nil Bid',
            body: 'Feeling bold? Bid Nil (0 tricks) to earn +50 points if you take zero tricks all round. But if you win even one trick, you lose 50 points instead. Blind Nil (bidding before seeing your cards) doubles that to ±100.',
          },
          {
            icon: '🏆',
            title: 'Winning',
            body: 'After all 13 rounds, scores are totalled. The player or team with the highest score wins. In team modes, partners\' scores are combined.',
          },
          {
            icon: '👥',
            title: 'Team Modes',
            body: 'For even numbers of players you can form equal teams. Partners sit across from each other and their bids are tracked together. For odd player counts, everyone plays individually.',
          },
        ].map(({ icon, title, body }) => (
          <div key={title} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <h3 style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700,
                color: '#f5c842', margin: 0, letterSpacing: '0.03em',
              }}>{title}</h3>
            </div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: 'rgba(200,225,200,0.75)', margin: 0, lineHeight: 1.7,
              paddingLeft: 28,
            }}>{body}</p>
          </div>
        ))}

        {/* Quick reference */}
        <div style={{
          marginTop: 22, background: 'rgba(245,200,66,0.06)',
          border: '1px solid rgba(245,200,66,0.18)', borderRadius: 10, padding: '14px 18px',
        }}>
          <div style={{ color: '#f5c842', fontSize: 11, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Quick Reference</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              ['Make your bid', '+10 × bid'],
              ['Miss your bid', '−10 × bid'],
              ['Each overtrick', '+1 bag pt'],
              ['Every 3 bags', '−30 pts'],
              ['Nil (success)', '+50 pts'],
              ['Nil (fail)', '−50 pts'],
              ['Blind Nil (success)', '+100 pts'],
              ['Blind Nil (fail)', '−100 pts'],
            ].map(([rule, pts]) => (
              <div key={rule} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(200,225,200,0.65)' }}>{rule}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: pts.startsWith('+') ? '#4ade80' : '#f87171' }}>{pts}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 22, width: '100%', padding: '12px 0', borderRadius: 10,
            background: '#f5c842', color: '#0d1b2a', border: 'none', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}
        >
          Got it — Let's Play!
        </button>
      </div>
    </div>
  );
}

// ── Main Lobby ────────────────────────────────────────────────────────────────
export function Lobby({ onCreateRoom, onJoinRoom, error, connected }: LobbyProps) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerCountStr, setPlayerCountStr] = useState('4');
  const [teamMode, setTeamMode] = useState<TeamMode>('two_teams');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  const playerCount = parseInt(playerCountStr) || 0;
  const isValidCount = playerCount >= 2 && playerCount <= 52;
  const isOdd = isValidCount && playerCount % 2 === 1;
  const teamOptions = isValidCount ? getTeamOptions(playerCount) : [];

  const handlePlayerCountInput = (val: string) => {
    // Only allow numbers
    const cleaned = val.replace(/\D/g, '');
    setPlayerCountStr(cleaned);
    const n = parseInt(cleaned) || 0;
    if (n >= 2) {
      if (n % 2 === 1) setTeamMode('individual');
      else setTeamMode('two_teams');
    }
  };

  const handleCreate = () => {
    if (!name.trim() || !isValidCount) return;
    const selectedOpt = teamOptions.find(o => o.value === teamMode) || teamOptions[teamOptions.length - 1];
    onCreateRoom(name.trim(), { playerCount, teamMode, numTeams: selectedOpt?.numTeams });
  };

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim(), name.trim());
  };

  const inputStyle = (id: string, extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', background: C.input, boxSizing: 'border-box' as const,
    border: `1px solid ${focusedInput === id ? C.gold : C.inputBorder}`,
    borderRadius: 10, padding: '12px 16px', color: C.text,
    fontFamily: "'DM Sans', sans-serif", fontSize: 15, outline: 'none',
    transition: 'border-color 0.2s', ...extra,
  });

  const labelStyle: React.CSSProperties = {
    display: 'block', color: C.textLabel, fontSize: 10, letterSpacing: '0.2em',
    textTransform: 'uppercase' as const, marginBottom: 8,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
  };

  const canCreate = name.trim() && isValidCount && connected;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>

      {/* Background glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(30,80,50,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Corner suit symbols */}
      {SUITS.map(({ symbol, color, pos }) => (
        <div key={symbol} style={{ position: 'absolute', ...pos, color, fontSize: 110, opacity: 0.22, pointerEvents: 'none', lineHeight: 1, filter: 'drop-shadow(0 0 18px currentColor)' }}>
          {symbol}
        </div>
      ))}

      {/* ── Rules button top-right ── */}
      <button
        onClick={() => setShowRules(true)}
        onMouseEnter={() => setHoveredBtn('rules')}
        onMouseLeave={() => setHoveredBtn(null)}
        style={{
          position: 'fixed', top: 20, right: 24, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 7,
          background: hoveredBtn === 'rules' ? 'rgba(245,200,66,0.18)' : 'rgba(245,200,66,0.08)',
          border: '1px solid rgba(245,200,66,0.35)',
          borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: hoveredBtn === 'rules' ? '0 0 16px rgba(245,200,66,0.25)' : 'none',
        }}
      >
        <span style={{ fontSize: 15 }}>📖</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#f5c842', letterSpacing: '0.08em' }}>Rules</span>
      </button>

      {/* Rules modal */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* ── Main form ── */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 460, padding: '0 16px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 6, filter: 'drop-shadow(0 0 24px rgba(245,200,66,0.7))', color: C.gold }}>♠</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, fontWeight: 700, color: C.gold, letterSpacing: '0.08em', margin: 0, textShadow: '0 0 30px rgba(245,200,66,0.4)' }}>SPADES</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: '0.25em', color: C.textMuted, marginTop: 6, textTransform: 'uppercase' }}>13 Rounds · Classic Rules</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#4ade80' : '#f87171', boxShadow: connected ? '0 0 8px #4ade80' : '0 0 8px #f87171' }} />
            <span style={{ fontSize: 11, color: connected ? 'rgba(74,222,128,0.7)' : 'rgba(248,113,113,0.7)', fontFamily: "'DM Sans', sans-serif" }}>
              {connected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: C.card, backdropFilter: 'blur(20px)', borderRadius: 20, border: `1px solid ${C.border}`, padding: '28px 28px 24px', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>

          {/* Name */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Your Name</label>
            <input
              type="text" value={name} maxLength={20}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
              placeholder="Enter your name..."
              onFocus={() => setFocusedInput('name')} onBlur={() => setFocusedInput(null)}
              style={inputStyle('name')}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            {(['create', 'join'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase' as const, transition: 'all 0.2s',
                background: tab === t ? C.btnGold : 'rgba(255,255,255,0.07)',
                color: tab === t ? C.btnText : C.textMuted,
                boxShadow: tab === t ? '0 0 16px rgba(245,200,66,0.3)' : 'none',
              }}>
                {t === 'create' ? 'New Game' : 'Join Game'}
              </button>
            ))}
          </div>

          {/* ── CREATE TAB ── */}
          {tab === 'create' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Player count input */}
              <div>
                <label style={labelStyle}>Number of Players</label>
                <input
                  type="text" inputMode="numeric" value={playerCountStr}
                  onChange={e => handlePlayerCountInput(e.target.value)}
                  placeholder="e.g. 4"
                  onFocus={() => setFocusedInput('count')} onBlur={() => setFocusedInput(null)}
                  style={inputStyle('count', { fontFamily: "'JetBrains Mono', monospace", fontSize: 18 })}
                />

                {/* Feedback message under input */}
                {playerCountStr !== '' && (
                  <div style={{ marginTop: 7, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', ...
                    !isValidCount
                      ? { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }
                      : isOdd
                        ? { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }
                        : { background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.18)', color: '#86efac' }
                  }}>
                    {!isValidCount
                      ? playerCount < 2
                        ? '⚠ Minimum 2 players required'
                        : '⚠ That\'s a lot! Maximum is 52 players'
                      : isOdd
                        ? `ℹ ${playerCount} players — odd number, so everyone plays individually`
                        : `✓ ${playerCount} players — choose a team format below`
                    }
                  </div>
                )}
              </div>

              {/* Team mode — only for valid even counts */}
              {isValidCount && !isOdd && teamOptions.length > 0 && (
                <div>
                  <label style={labelStyle}>Game Mode</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {teamOptions.map(opt => {
                      const isActive = teamMode === opt.value && !(opt.value === 'individual' && teamMode !== 'individual');
                      const isIndividualActive = opt.value === 'individual' && teamMode === 'individual';
                      const active = isActive || isIndividualActive;
                      return (
                        <button key={`${opt.value}-${opt.numTeams}`}
                          onClick={() => setTeamMode(opt.value as TeamMode)}
                          onMouseEnter={() => setHoveredBtn(`tm${opt.numTeams}`)}
                          onMouseLeave={() => setHoveredBtn(null)}
                          style={{
                            padding: '11px 14px', borderRadius: 9,
                            border: `1px solid ${active ? C.gold : hoveredBtn === `tm${opt.numTeams}` ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`,
                            background: active ? 'rgba(245,200,66,0.12)' : hoveredBtn === `tm${opt.numTeams}` ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            transition: 'all 0.15s',
                          }}>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: active ? C.gold : 'rgba(200,225,255,0.8)' }}>
                              {opt.label}
                            </div>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(160,190,220,0.5)', marginTop: 2 }}>
                              {opt.desc}
                            </div>
                          </div>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? C.gold : 'rgba(255,255,255,0.2)'}`, background: active ? C.gold : 'transparent', flexShrink: 0 }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rules strip */}
              <div style={{ background: 'rgba(245,200,66,0.05)', border: '1px solid rgba(245,200,66,0.12)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-around' }}>
                {[['13', 'Rounds'], ['×10', 'Per bid'], ['3 bags', '= −30 pts']].map(([val, lbl]) => (
                  <div key={lbl} style={{ textAlign: 'center' }}>
                    <div style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 15 }}>{val}</div>
                    <div style={{ color: C.textMuted, fontSize: 10, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{lbl}</div>
                  </div>
                ))}
              </div>

              <button onClick={handleCreate} disabled={!canCreate}
                onMouseEnter={() => setHoveredBtn('create')} onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                  cursor: canCreate ? 'pointer' : 'not-allowed',
                  background: hoveredBtn === 'create' && canCreate ? C.goldLight : C.btnGold,
                  color: C.btnText, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.15em', textTransform: 'uppercase' as const, transition: 'all 0.2s',
                  opacity: canCreate ? 1 : 0.4,
                  boxShadow: canCreate ? '0 0 24px rgba(245,200,66,0.35)' : 'none',
                }}>
                Create Room
              </button>
            </div>
          )}

          {/* ── JOIN TAB ── */}
          {tab === 'join' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Room Code</label>
                <input type="text" value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="XXXXX" maxLength={5}
                  onFocus={() => setFocusedInput('code')} onBlur={() => setFocusedInput(null)}
                  style={inputStyle('code', { fontFamily: "'JetBrains Mono', monospace", fontSize: 26, textAlign: 'center', letterSpacing: '0.3em' })}
                />
              </div>
              <button onClick={handleJoin} disabled={!name.trim() || !roomCode.trim() || !connected}
                onMouseEnter={() => setHoveredBtn('join')} onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                  cursor: name.trim() && roomCode.trim() && connected ? 'pointer' : 'not-allowed',
                  background: hoveredBtn === 'join' && name.trim() && roomCode.trim() ? C.goldLight : C.btnGold,
                  color: C.btnText, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.15em', textTransform: 'uppercase' as const, transition: 'all 0.2s',
                  opacity: name.trim() && roomCode.trim() && connected ? 1 : 0.4,
                  boxShadow: name.trim() && roomCode.trim() && connected ? '0 0 24px rgba(245,200,66,0.35)' : 'none',
                }}>
                Join Room
              </button>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: 8, color: C.errorText, fontSize: 13, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
              {error}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 11, marginTop: 18, fontFamily: "'DM Sans', sans-serif" }}>
          Share the room code with friends · Click <span style={{ color: 'rgba(245,200,66,0.5)' }}>Rules</span> to learn how to play
        </p>
      </div>
    </div>
  );
}
