import React, { useState } from 'react';
import { GameConfig } from '@spades/shared';

interface LobbyProps {
  onCreateRoom: (name: string, config: Partial<GameConfig>) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  error: string | null;
  connected: boolean;
}

// Suit config: symbol + color
const SUITS = [
  { symbol: '♠', color: '#c8d8f0', label: 'Spades', pos: 'top-8 left-8' },
  { symbol: '♣', color: '#a8e6c0', label: 'Clubs',  pos: 'top-8 right-8' },
  { symbol: '♥', color: '#f4a0a0', label: 'Hearts', pos: 'bottom-8 left-8' },
  { symbol: '♦', color: '#f5c86a', label: 'Diamonds', pos: 'bottom-8 right-8' },
];

const C = {
  bg: 'linear-gradient(135deg, #0d1b2a 0%, #1a2a4a 40%, #0f2318 100%)',
  card: 'rgba(15, 28, 42, 0.85)',
  border: 'rgba(255,255,255,0.08)',
  gold: '#f5c842',
  goldLight: '#fae49a',
  input: 'rgba(8,16,28,0.7)',
  inputBorder: 'rgba(255,255,255,0.12)',
  inputFocus: '#f5c842',
  tabActive: '#f5c842',
  tabInactive: 'rgba(255,255,255,0.07)',
  textMuted: 'rgba(180,210,255,0.45)',
  textLabel: '#f5c842',
  textBody: 'rgba(200,225,255,0.85)',
  btnGold: '#f5c842',
  btnGoldHover: '#fae49a',
  btnText: '#0d1b2a',
  errorBg: 'rgba(180,40,40,0.2)',
  errorBorder: 'rgba(220,80,80,0.4)',
  errorText: '#fca5a5',
};

export function Lobby({ onCreateRoom, onJoinRoom, error, connected }: LobbyProps) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [targetScore, setTargetScore] = useState(500);
  const [playerCount, setPlayerCount] = useState<2 | 4 | 6>(4);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleCreate = () => { if (name.trim()) onCreateRoom(name.trim(), { targetScore, playerCount }); };
  const handleJoin = () => { if (name.trim() && roomCode.trim()) onJoinRoom(roomCode.trim(), name.trim()); };

  const inputStyle = (id: string): React.CSSProperties => ({
    width: '100%',
    background: C.input,
    border: `1px solid ${focusedInput === id ? C.gold : C.inputBorder}`,
    borderRadius: 10,
    padding: '12px 16px',
    color: C.textBody,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  });

  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      
      {/* Subtle radial glow in center */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(30,80,50,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Corner suit symbols */}
      {SUITS.map(({ symbol, color, pos }) => (
        <div key={symbol} className={`absolute ${pos}`} style={{ color, fontSize: 110, opacity: 0.22, pointerEvents: 'none', lineHeight: 1, filter: 'drop-shadow(0 0 18px currentColor)' }}>
          {symbol}
        </div>
      ))}

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440, padding: '0 16px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 6, filter: 'drop-shadow(0 0 24px rgba(245,200,66,0.7))', color: C.gold }}>♠</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, fontWeight: 700, color: C.gold, letterSpacing: '0.08em', margin: 0, textShadow: '0 0 30px rgba(245,200,66,0.4)' }}>SPADES</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: '0.25em', color: C.textMuted, marginTop: 6, textTransform: 'uppercase' }}>The Classic Card Game</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#4ade80' : '#f87171', boxShadow: connected ? '0 0 8px #4ade80' : '0 0 8px #f87171' }} />
            <span style={{ fontSize: 11, color: connected ? 'rgba(74,222,128,0.7)' : 'rgba(248,113,113,0.7)', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.1em' }}>
              {connected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Main card */}
        <div style={{ background: C.card, backdropFilter: 'blur(20px)', borderRadius: 20, border: `1px solid ${C.border}`, padding: '32px 32px 28px', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset' }}>
          
          {/* Name input */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: C.textLabel, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
              placeholder="Enter your name..."
              maxLength={20}
              onFocus={() => setFocusedInput('name')}
              onBlur={() => setFocusedInput(null)}
              style={{ ...inputStyle('name'), '::placeholder': { color: 'rgba(255,255,255,0.2)' } } as any}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {(['create', 'join'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                  letterSpacing: '0.12em', textTransform: 'uppercase', transition: 'all 0.2s',
                  background: tab === t ? C.tabActive : C.tabInactive,
                  color: tab === t ? C.btnText : C.textMuted,
                  boxShadow: tab === t ? '0 0 16px rgba(245,200,66,0.3)' : 'none',
                }}>
                {t === 'create' ? 'New Game' : 'Join Game'}
              </button>
            ))}
          </div>

          {/* Create */}
          {tab === 'create' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', color: C.textLabel, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Players</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([2, 4, 6] as const).map(n => (
                    <button key={n} onClick={() => setPlayerCount(n)}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 8, border: `1px solid ${playerCount === n ? C.gold : 'rgba(255,255,255,0.1)'}`,
                        cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
                        background: playerCount === n ? 'rgba(245,200,66,0.15)' : 'rgba(255,255,255,0.04)',
                        color: playerCount === n ? C.gold : C.textMuted,
                        transition: 'all 0.2s',
                      }}>
                      {n}P
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: C.textLabel, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                  Target Score: <span style={{ color: C.goldLight }}>{targetScore}</span>
                </label>
                <input type="range" min={200} max={1000} step={50} value={targetScore}
                  onChange={e => setTargetScore(Number(e.target.value))}
                  style={{ width: '100%', accentColor: C.gold, cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textMuted, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                  <span>200</span><span>500</span><span>1000</span>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!name.trim() || !connected}
                onMouseEnter={() => setHoveredBtn('create')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: name.trim() && connected ? 'pointer' : 'not-allowed',
                  background: hoveredBtn === 'create' && name.trim() && connected ? C.btnGoldHover : C.btnGold,
                  color: C.btnText, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.15em', textTransform: 'uppercase', transition: 'all 0.2s',
                  opacity: name.trim() && connected ? 1 : 0.4,
                  boxShadow: name.trim() && connected ? '0 0 24px rgba(245,200,66,0.35), 0 4px 16px rgba(0,0,0,0.4)' : 'none',
                }}>
                Create Room
              </button>
            </div>
          )}

          {/* Join */}
          {tab === 'join' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', color: C.textLabel, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="XXXXX"
                  maxLength={5}
                  onFocus={() => setFocusedInput('code')}
                  onBlur={() => setFocusedInput(null)}
                  style={{ ...inputStyle('code'), fontFamily: "'JetBrains Mono', monospace", fontSize: 24, textAlign: 'center', letterSpacing: '0.3em' }}
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={!name.trim() || !roomCode.trim() || !connected}
                onMouseEnter={() => setHoveredBtn('join')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                  cursor: name.trim() && roomCode.trim() && connected ? 'pointer' : 'not-allowed',
                  background: hoveredBtn === 'join' && name.trim() && roomCode.trim() ? C.btnGoldHover : C.btnGold,
                  color: C.btnText, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.15em', textTransform: 'uppercase', transition: 'all 0.2s',
                  opacity: name.trim() && roomCode.trim() && connected ? 1 : 0.4,
                  boxShadow: name.trim() && roomCode.trim() && connected ? '0 0 24px rgba(245,200,66,0.35), 0 4px 16px rgba(0,0,0,0.4)' : 'none',
                }}>
                Join Room
              </button>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: 8, color: C.errorText, fontSize: 13, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
              {error}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 11, marginTop: 20, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.08em' }}>
          Share the room code with friends to play together
        </p>
      </div>
    </div>
  );
}
