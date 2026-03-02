import React, { useState } from 'react';
import { GameConfig, TeamMode } from '@spades/shared';

interface LobbyProps {
  onCreateRoom: (name: string, config: Partial<GameConfig> & { vsComputer?: boolean }) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  error: string | null;
  connected: boolean;
}

const SUITS = [
  { symbol: '♠', color: '#c8d8f0', pos: { top: 24, left: 24 } },
  { symbol: '♣', color: '#a8e6c0', pos: { top: 24, right: 24 } },
  { symbol: '♥', color: '#f4a0a0', pos: { bottom: 24, left: 24 } },
  { symbol: '♦', color: '#f5c86a', pos: { bottom: 24, right: 24 } },
];

const C = {
  bg: 'linear-gradient(135deg,#0d1b2a 0%,#1a2a4a 40%,#0f2318 100%)',
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

function getTeamOptions(count: number): { value: string; numTeams: number; teamSize: number; label: string; desc: string }[] {
  if (count < 2) return [];
  const opts: { value: string; numTeams: number; teamSize: number; label: string; desc: string }[] = [];
  for (let numTeams = 2; numTeams <= Math.floor(count / 2); numTeams++) {
    if (count % numTeams === 0) {
      const teamSize = count / numTeams;
      if (teamSize >= 2) {
        const desc = Array.from({ length: numTeams }, () => teamSize).join(' vs ');
        opts.push({ value: numTeams === 2 ? 'two_teams' : 'three_teams', numTeams, teamSize, label: `${numTeams} Teams of ${teamSize}`, desc });
      }
    }
  }
  opts.push({ value: 'individual', numTeams: count, teamSize: 1, label: 'Individual', desc: 'Everyone for themselves' });
  return opts;
}

function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0f1e14', border: '1px solid rgba(245,200,66,0.25)', borderRadius: 18, padding: 'clamp(16px,4vw,30px)', maxWidth: 520, width: '100%', maxHeight: '88dvh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.9)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>✕</button>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>♠</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(18px,5vw,24px)', fontWeight: 700, color: '#f5c842', margin: 0 }}>How to Play Spades</h2>
        </div>
        {[
          { icon: '🃏', title: 'The Basics', body: 'Spades is a trick-taking card game. Predict how many tricks you will win each round. Spades are always trump — they beat every other suit.' },
          { icon: '📅', title: '13 Rounds', body: 'Round 1: 1 card each. Round 2: 2 cards each. Up to Round 13: 13 cards each.' },
          { icon: '🤔', title: 'Bidding', body: 'Before each round, bid how many tricks you expect to win. You can bid 0 up to how many cards you hold.' },
          { icon: '🎮', title: 'Playing', body: 'Follow the led suit if you can. If you can\'t, play any card including a spade. Highest of the led suit wins — unless a spade was played, in which case the highest spade wins. Spades can\'t be led until broken.' },
          { icon: '✅', title: 'Scoring', body: 'Make your bid → +10 × bid. Miss your bid → −10 × bid.' },
          { icon: '👜', title: 'Bags', body: 'Winning more tricks than you bid earns a bag. Every 3 bags = −30 pts penalty, bags reset.' },
          { icon: '🏆', title: 'Winning', body: 'Highest score after 13 rounds wins.' },
        ].map(({ icon, title, body }) => (
          <div key={title} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#f5c842', margin: 0 }}>{title}</h3>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(200,225,200,0.75)', margin: 0, lineHeight: 1.6, paddingLeft: 24 }}>{body}</p>
          </div>
        ))}
        <div style={{ marginTop: 18, background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.18)', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ color: '#f5c842', fontSize: 10, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Quick Reference</div>
          {[
            ['Make your bid', '+10 × bid', true],
            ['Miss your bid', '−10 × bid', false],
            ['Each overtrick', '+1 bag', true],
            ['Every 3 bags', '−30 pts (bags reset)', false],
          ].map(([rule, pts, pos]) => (
            <div key={rule as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(200,225,200,0.65)' }}>{rule}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: pos ? '#4ade80' : '#f87171' }}>{pts}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop: 18, width: '100%', padding: '13px 0', borderRadius: 10, background: '#f5c842', color: '#0d1b2a', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', touchAction: 'manipulation' }}>
          Got it — Let's Play!
        </button>
      </div>
    </div>
  );
}

export function Lobby({ onCreateRoom, onJoinRoom, error, connected }: LobbyProps) {
  const [name, setName]                 = useState('');
  const [roomCode, setRoomCode]         = useState('');
  const [tab, setTab]                   = useState<'create' | 'join' | 'cpu'>('create');
  const [playerCountStr, setPlayerCountStr] = useState('4');
  const [teamMode, setTeamMode]         = useState<TeamMode>('two_teams');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn]     = useState<string | null>(null);
  const [showRules, setShowRules]       = useState(false);

  const playerCount  = parseInt(playerCountStr) || 0;
  const isValidCount = playerCount >= 2 && playerCount <= 52;
  const teamOptions  = isValidCount ? getTeamOptions(playerCount) : [];
  const hasTeamOptions = teamOptions.filter(o => o.value !== 'individual').length > 0;

  const handlePlayerCountInput = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setPlayerCountStr(cleaned);
    const n = parseInt(cleaned) || 0;
    if (n >= 2) {
      const opts = getTeamOptions(n);
      const first = opts.find(o => o.value !== 'individual');
      setTeamMode(first ? (first.value as TeamMode) : 'individual');
    }
  };

  const handleCreate = () => {
    if (!name.trim() || !isValidCount) return;
    const opt = teamOptions.find(o => o.value === teamMode) || teamOptions[teamOptions.length - 1];
    onCreateRoom(name.trim(), { playerCount, teamMode, numTeams: opt?.numTeams });
  };

  const handleVsComputer = () => {
    if (!name.trim()) return;
    onCreateRoom(name.trim(), { vsComputer: true, playerCount: 2, teamMode: 'individual' });
  };

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim(), name.trim());
  };

  const inputStyle = (id: string, extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', background: C.input, boxSizing: 'border-box' as const,
    border: `1px solid ${focusedInput === id ? C.gold : C.inputBorder}`,
    borderRadius: 10, padding: '12px 14px', color: C.text,
    fontFamily: "'DM Sans', sans-serif", fontSize: 15, outline: 'none',
    transition: 'border-color 0.2s', WebkitAppearance: 'none' as any, ...extra,
  });

  const labelStyle: React.CSSProperties = {
    display: 'block', color: C.textLabel, fontSize: 10, letterSpacing: '0.2em',
    textTransform: 'uppercase' as const, marginBottom: 7,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
  };

  const btnPrimary = (active: boolean, hovered: boolean): React.CSSProperties => ({
    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
    cursor: active ? 'pointer' : 'not-allowed',
    background: hovered && active ? C.goldLight : C.btnGold,
    color: C.btnText, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase' as const, transition: 'all 0.2s',
    opacity: active ? 1 : 0.4,
    boxShadow: active ? '0 0 22px rgba(245,200,66,0.35)' : 'none',
    touchAction: 'manipulation',
    // Ensure min touch target
    minHeight: 48,
  });

  const canCreate = !!(name.trim() && isValidCount && connected);

  return (
    <div style={{ background: C.bg, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '16px 0' }}>
      <style>{`* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; } input, button { touch-action: manipulation; }`}</style>

      {/* Background glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(30,80,50,0.25) 0%,transparent 70%)', pointerEvents: 'none' }} />

      {/* Corner suit symbols */}
      {SUITS.map(({ symbol, color, pos }) => (
        <div key={symbol} style={{ position: 'absolute', ...pos, color, fontSize: 'clamp(42px,10vw,90px)', opacity: 0.18, pointerEvents: 'none', lineHeight: 1 }}>{symbol}</div>
      ))}

      {/* Rules button */}
      <button onClick={() => setShowRules(true)} style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.35)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', touchAction: 'manipulation', minHeight: 40 }}>
        <span style={{ fontSize: 14 }}>📖</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#f5c842' }}>Rules</span>
      </button>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* Main form */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440, padding: '0 14px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(14px,4vw,28px)' }}>
          <div style={{ fontSize: 'clamp(40px,12vw,68px)', lineHeight: 1, marginBottom: 4, filter: 'drop-shadow(0 0 20px rgba(245,200,66,0.7))', color: C.gold }}>♠</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,9vw,50px)', fontWeight: 700, color: C.gold, letterSpacing: '0.08em', margin: 0, textShadow: '0 0 28px rgba(245,200,66,0.4)' }}>SPADES</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: '0.22em', color: C.textMuted, marginTop: 5, textTransform: 'uppercase' }}>13 Rounds · Classic Rules</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#4ade80' : '#f87171', boxShadow: connected ? '0 0 8px #4ade80' : '0 0 8px #f87171' }} />
            <span style={{ fontSize: 11, color: connected ? 'rgba(74,222,128,0.7)' : 'rgba(248,113,113,0.7)', fontFamily: "'DM Sans', sans-serif" }}>{connected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: C.card, backdropFilter: 'blur(20px)', borderRadius: 18, border: `1px solid ${C.border}`, padding: 'clamp(14px,4vw,26px)', boxShadow: '0 28px 70px rgba(0,0,0,0.6)' }}>

          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Your Name</label>
            <input type="text" value={name} maxLength={20}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
              placeholder="Enter your name..."
              onFocus={() => setFocusedInput('name')} onBlur={() => setFocusedInput(null)}
              style={inputStyle('name')}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {(['create', 'join', 'cpu'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px 0', minHeight: 42, borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, transition: 'all 0.2s', background: tab === t ? C.btnGold : 'rgba(255,255,255,0.07)', color: tab === t ? C.btnText : C.textMuted, boxShadow: tab === t ? '0 0 14px rgba(245,200,66,0.3)' : 'none', touchAction: 'manipulation' }}>
                {t === 'create' ? 'New' : t === 'join' ? 'Join' : '🤖 CPU'}
              </button>
            ))}
          </div>

          {/* CREATE */}
          {tab === 'create' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Number of Players</label>
                <input type="text" inputMode="numeric" value={playerCountStr}
                  onChange={e => handlePlayerCountInput(e.target.value)}
                  placeholder="e.g. 4"
                  onFocus={() => setFocusedInput('count')} onBlur={() => setFocusedInput(null)}
                  style={inputStyle('count', { fontFamily: "'JetBrains Mono', monospace", fontSize: 18 })}
                />
                {playerCountStr !== '' && (
                  <div style={{ marginTop: 6, padding: '7px 11px', borderRadius: 8, fontSize: 11, fontFamily: "'DM Sans', sans-serif", ...(!isValidCount ? { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' } : !hasTeamOptions ? { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' } : { background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.18)', color: '#86efac' }) }}>
                    {!isValidCount ? (playerCount < 2 ? '⚠ Minimum 2 players' : '⚠ Maximum 52 players') : !hasTeamOptions ? `ℹ ${playerCount} players — individual only` : `✓ ${playerCount} players — choose format below`}
                  </div>
                )}
              </div>

              {isValidCount && teamOptions.length > 0 && (
                <div>
                  <label style={labelStyle}>Game Mode</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {teamOptions.map(opt => {
                      const active = teamMode === opt.value && !(opt.value !== 'individual' && teamMode === 'individual');
                      const indActive = opt.value === 'individual' && teamMode === 'individual';
                      const isActive = active || indActive;
                      return (
                        <button key={`${opt.value}-${opt.numTeams}`} onClick={() => setTeamMode(opt.value as TeamMode)} style={{ padding: '10px 13px', minHeight: 44, borderRadius: 9, border: `1px solid ${isActive ? C.gold : 'rgba(255,255,255,0.08)'}`, background: isActive ? 'rgba(245,200,66,0.12)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', touchAction: 'manipulation' }}>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: isActive ? C.gold : 'rgba(200,225,255,0.8)' }}>{opt.label}</div>
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'rgba(160,190,220,0.5)', marginTop: 1 }}>{opt.desc}</div>
                          </div>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${isActive ? C.gold : 'rgba(255,255,255,0.2)'}`, background: isActive ? C.gold : 'transparent', flexShrink: 0 }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(245,200,66,0.05)', border: '1px solid rgba(245,200,66,0.12)', borderRadius: 8, padding: '9px 12px', display: 'flex', justifyContent: 'space-around' }}>
                {[['13', 'Rounds'], ['×10', 'Per bid'], ['Bags', 'Tracked']].map(([val, lbl]) => (
                  <div key={lbl} style={{ textAlign: 'center' }}>
                    <div style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14 }}>{val}</div>
                    <div style={{ color: C.textMuted, fontSize: 9, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>{lbl}</div>
                  </div>
                ))}
              </div>

              <button onClick={handleCreate} disabled={!canCreate} onMouseEnter={() => setHoveredBtn('create')} onMouseLeave={() => setHoveredBtn(null)} style={btnPrimary(canCreate, hoveredBtn === 'create')}>
                Create Room
              </button>
            </div>
          )}

          {/* JOIN */}
          {tab === 'join' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Room Code</label>
                <input type="text" value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="XXXXX" maxLength={5}
                  onFocus={() => setFocusedInput('code')} onBlur={() => setFocusedInput(null)}
                  style={inputStyle('code', { fontFamily: "'JetBrains Mono', monospace", fontSize: 24, textAlign: 'center', letterSpacing: '0.28em' })}
                />
              </div>
              <button onClick={handleJoin} disabled={!name.trim() || !roomCode.trim() || !connected} onMouseEnter={() => setHoveredBtn('join')} onMouseLeave={() => setHoveredBtn(null)} style={btnPrimary(!!(name.trim() && roomCode.trim() && connected), hoveredBtn === 'join')}>
                Join Room
              </button>
            </div>
          )}

          {/* CPU */}
          {tab === 'cpu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'rgba(147,197,253,0.06)', border: '1px solid rgba(147,197,253,0.18)', borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🤖</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#93c5fd', marginBottom: 6 }}>Play vs Computer</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(180,210,255,0.6)', lineHeight: 1.6 }}>1-on-1 match · Full 13 rounds · All rules apply</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '11px 14px' }}>
                <span style={{ fontSize: 18 }}>🎯</span>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(200,225,255,0.85)' }}>Smart AI Opponent</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'rgba(160,190,220,0.5)', marginTop: 2 }}>Bids based on hand strength · Plays strategically</div>
                </div>
              </div>
              <button onClick={handleVsComputer} disabled={!name.trim() || !connected} onMouseEnter={() => setHoveredBtn('cpu')} onMouseLeave={() => setHoveredBtn(null)} style={{ ...btnPrimary(!!(name.trim() && connected), hoveredBtn === 'cpu'), background: name.trim() && connected ? (hoveredBtn === 'cpu' ? 'linear-gradient(135deg,#60a5fa,#818cf8)' : 'linear-gradient(135deg,#3b82f6,#6366f1)') : 'rgba(100,100,120,0.3)', color: '#fff', boxShadow: name.trim() && connected ? '0 0 22px rgba(99,102,241,0.4)' : 'none' }}>
                🤖 Start vs CPU
              </button>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: 8, color: C.errorText, fontSize: 12, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>{error}</div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 10, marginTop: 14, fontFamily: "'DM Sans', sans-serif" }}>
          Share the room code with friends · Tap <span style={{ color: 'rgba(245,200,66,0.5)' }}>Rules</span> to learn how to play
        </p>
      </div>
    </div>
  );
}
