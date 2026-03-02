import React, { useState, useEffect, useRef } from 'react';
import { PublicGameState, Card, Player } from '@spades/shared';
import { getPlayableCards } from '@spades/shared';
import { CardComponent, CardBack } from './CardComponent';
import { BiddingPanel } from './BiddingPanel';
import { ScoreBoard } from './ScoreBoard';
import { useScreenSize } from '../hooks/useScreenSize';

interface GameTableProps {
  state: PublicGameState;
  onPlayCard: (cardId: string) => void;
  onBid: (bid: any) => void;
  onNextRound: () => void;
  onLeave: () => void;
}

const TEAM_COLORS = ['#93c5fd','#fca5a5','#86efac','#fde68a','#c4b5fd','#f9a8d4','#6ee7b7'];

type XY = { x: string; y: string; anchor: string };

function opponentSeatXY(i: number): XY {
  const slots: XY[] = [
    { x: '50%',  y: '0%',   anchor: 'translate(-50%, -110%)' },
    { x: '80%',  y: '0%',   anchor: 'translate(-50%, -110%)' },
    { x: '100%', y: '25%',  anchor: 'translate(10%, -50%)'   },
    { x: '100%', y: '50%',  anchor: 'translate(10%, -50%)'   },
    { x: '100%', y: '75%',  anchor: 'translate(10%, -50%)'   },
    { x: '80%',  y: '100%', anchor: 'translate(-50%, 10%)'   },
    { x: '50%',  y: '100%', anchor: 'translate(-50%, 10%)'   },
    { x: '20%',  y: '100%', anchor: 'translate(-50%, 10%)'   },
    { x: '0%',   y: '75%',  anchor: 'translate(-110%, -50%)' },
    { x: '0%',   y: '50%',  anchor: 'translate(-110%, -50%)' },
    { x: '0%',   y: '25%',  anchor: 'translate(-110%, -50%)' },
    { x: '20%',  y: '0%',   anchor: 'translate(-50%, -110%)' },
  ];
  return slots[i % slots.length];
}

function cardZoneXY(i: number): XY {
  const slots: XY[] = [
    { x: '50%', y: '20%', anchor: 'translate(-50%,-50%)' },
    { x: '72%', y: '25%', anchor: 'translate(-50%,-50%)' },
    { x: '78%', y: '40%', anchor: 'translate(-50%,-50%)' },
    { x: '78%', y: '55%', anchor: 'translate(-50%,-50%)' },
    { x: '72%', y: '70%', anchor: 'translate(-50%,-50%)' },
    { x: '60%', y: '78%', anchor: 'translate(-50%,-50%)' },
    { x: '50%', y: '82%', anchor: 'translate(-50%,-50%)' },
    { x: '40%', y: '78%', anchor: 'translate(-50%,-50%)' },
    { x: '28%', y: '70%', anchor: 'translate(-50%,-50%)' },
    { x: '22%', y: '55%', anchor: 'translate(-50%,-50%)' },
    { x: '22%', y: '40%', anchor: 'translate(-50%,-50%)' },
    { x: '28%', y: '25%', anchor: 'translate(-50%,-50%)' },
  ];
  return slots[i % slots.length];
}

const MY_CARD_ZONE: XY = { x: '50%', y: '65%', anchor: 'translate(-50%,-50%)' };

// ─── Dealer Splash ───────────────────────────────────────────────────────────
function DealerSplash({ dealer, round, onDone }: { dealer?: Player; round: number; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'radial-gradient(ellipse at center,#0f2e18 0%,#060e08 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <style>{`
        @keyframes cardDrop { 0%{transform:scale(0.15) rotate(-30deg) translateY(-60px);opacity:0} 55%{transform:scale(1.14) rotate(5deg) translateY(-5px);opacity:1} 80%{transform:scale(0.97) rotate(-1deg) translateY(2px);opacity:1} 100%{transform:scale(1) rotate(0deg) translateY(0);opacity:1} }
        @keyframes dealerTextIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div style={{ animation: 'cardDrop 0.65s cubic-bezier(0.175,0.885,0.32,1.275) forwards', marginBottom: 24, filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.8))' }}>
        <CardBack size="lg" />
      </div>
      <div style={{ animation: 'dealerTextIn 0.4s 0.5s ease both', textAlign: 'center' }}>
        <div style={{ color: '#f5c842', fontFamily: "'Playfair Display', serif", fontSize: 'clamp(18px,5vw,26px)', fontWeight: 700, textShadow: '0 0 30px rgba(245,200,66,0.5)', marginBottom: 10 }}>
          Round {round} of 13
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.3)', borderRadius: 12, padding: '10px 18px' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(245,200,66,0.2)', border: '2px solid rgba(245,200,66,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#f5c842', fontFamily: "'DM Sans', sans-serif" }}>
            {dealer?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#f5c842', fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(12px,3.5vw,15px)', fontWeight: 700 }}>{dealer?.name ?? 'Dealer'} deals</div>
            <div style={{ color: 'rgba(245,200,66,0.55)', fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(10px,2.5vw,12px)' }}>{round} card{round !== 1 ? 's' : ''} each</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Table card ───────────────────────────────────────────────────────────────
function TableCard({ card, animKey }: { card: Card; animKey: string }) {
  return (
    <div key={animKey} style={{ animation: 'cardPlay 0.32s cubic-bezier(0.175,0.885,0.32,1.275) forwards' }}>
      <CardComponent card={card} size="sm" />
    </div>
  );
}

// ─── Opponent seat ────────────────────────────────────────────────────────────
function OpponentSeat({ player, state, xy, compact }: { player: Player; state: PublicGameState; xy: XY; compact: boolean }) {
  const isActive = state.players[state.currentPlayerIndex]?.id === player.id;
  const isDealer = state.players[state.dealerIndex]?.id === player.id;
  const bid = state.bids[player.id];
  const won = state.completedTricks.filter(t => t.winnerId === player.id).length;
  const color = TEAM_COLORS[player.teamIndex % TEAM_COLORS.length];
  const cardsLeft = state.round - state.completedTricks.length;
  const av = compact ? 26 : 38;

  return (
    <div style={{ position: 'absolute', left: xy.x, top: xy.y, transform: xy.anchor, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 1 : 3, zIndex: 5 }}>
      {/* Card fan — skip on very compact */}
      {!compact && (
        <div style={{ position: 'relative', height: 26, width: Math.max(16, Math.min(cardsLeft, 5) * 6 + 12), marginBottom: 1 }}>
          {Array.from({ length: Math.min(Math.max(cardsLeft, 0), 5) }).map((_, i, arr) => (
            <div key={i} style={{ position: 'absolute', left: i * 6, top: 0, transform: `rotate(${(i - (arr.length - 1) / 2) * 5}deg)`, transformOrigin: 'bottom center' }}>
              <CardBack size="sm" />
            </div>
          ))}
        </div>
      )}
      {/* Avatar */}
      <div style={{ width: av, height: av, borderRadius: '50%', background: `${color}28`, border: `2px solid ${isActive ? '#f5c842' : color + '99'}`, boxShadow: isActive ? '0 0 10px rgba(245,200,66,0.7)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: compact ? 11 : 14, fontWeight: 700, color, fontFamily: "'DM Sans', sans-serif", position: 'relative', flexShrink: 0 }}>
        {player.name[0].toUpperCase()}
        {isDealer && <div style={{ position: 'absolute', top: -3, right: -3, background: '#f5c842', color: '#0d1b2a', borderRadius: '50%', width: compact ? 10 : 13, height: compact ? 10 : 13, fontSize: compact ? 5 : 7, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>D</div>}
      </div>
      {/* Name + bid */}
      <div style={{ background: 'rgba(0,0,0,0.65)', borderRadius: 5, padding: compact ? '1px 4px' : '2px 7px', border: `1px solid ${isActive ? 'rgba(245,200,66,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: compact ? 8 : 10, fontWeight: 600, color: isActive ? '#f5c842' : 'rgba(220,240,220,0.9)', whiteSpace: 'nowrap' }}>
          {player.name.length > (compact ? 4 : 8) ? player.name.slice(0, compact ? 3 : 7) + '…' : player.name}{isActive ? ' ●' : ''}
        </div>
        {!compact && bid !== null && bid !== undefined && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, textAlign: 'center' }}>
            <span style={{ color: '#f5c842' }}>{bid}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <span style={{ color: '#4ade80' }}>{won}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── My panel ─────────────────────────────────────────────────────────────────
function MyPanel({ player, state, isMyTurn, isMobile }: { player: Player; state: PublicGameState; isMyTurn: boolean; isMobile: boolean }) {
  const bid = state.bids[player.id];
  const won = state.completedTricks.filter(t => t.winnerId === player.id).length;
  const isDealer = state.players[state.dealerIndex]?.id === player.id;
  const color = TEAM_COLORS[player.teamIndex % TEAM_COLORS.length];
  const score = state.teamScores[player.teamIndex]?.score ?? 0;
  const bags = state.teamScores[player.teamIndex]?.bags ?? 0;

  if (isMobile) {
    // Slim vertical strip on mobile
    return (
      <div style={{ width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 3px', background: 'rgba(0,0,0,0.36)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Avatar */}
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${color}28`, border: `2px solid ${isMyTurn ? '#f5c842' : color}`, boxShadow: isMyTurn ? '0 0 10px rgba(245,200,66,0.55)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color, fontFamily: "'DM Sans', sans-serif", position: 'relative', flexShrink: 0 }}>
          {player.name[0].toUpperCase()}
          {isDealer && <div style={{ position: 'absolute', top: -3, right: -3, background: '#f5c842', color: '#0d1b2a', borderRadius: '50%', width: 11, height: 11, fontSize: 6, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>D</div>}
        </div>
        {/* Name */}
        <div style={{ fontSize: 8, color: '#f5c842', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, textAlign: 'center', wordBreak: 'break-all', lineHeight: 1.2, maxWidth: 46 }}>
          {player.name.length > 5 ? player.name.slice(0, 4) + '…' : player.name}
        </div>
        {/* Turn dot */}
        {isMyTurn && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f5c842', boxShadow: '0 0 6px rgba(245,200,66,0.8)', animation: 'myTurnPulse 1.4s ease-in-out infinite', flexShrink: 0 }} />}
        {/* Score */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, fontFamily: "'DM Sans', sans-serif" }}>Score</div>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: score < 0 ? '#f87171' : color, lineHeight: 1 }}>{score}</div>
          {bags > 0 && <div style={{ fontSize: 7, color: 'rgba(251,191,36,0.75)' }}>+{bags}B</div>}
        </div>
        {/* Bid/Won */}
        {bid !== null && bid !== undefined && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif" }}>B/W</div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, lineHeight: 1 }}>
              <span style={{ color: '#f5c842' }}>{bid as number}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
              <span style={{ color: '#4ade80' }}>{won}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full sidebar on desktop/tablet
  return (
    <div style={{ width: 140, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 10px', background: 'rgba(0,0,0,0.32)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${color}28`, border: `2px solid ${isMyTurn ? '#f5c842' : color}`, boxShadow: isMyTurn ? '0 0 18px rgba(245,200,66,0.55)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 700, color, fontFamily: "'DM Sans', sans-serif", position: 'relative', flexShrink: 0 }}>
        {player.name[0].toUpperCase()}
        {isDealer && <div style={{ position: 'absolute', top: -5, right: -5, background: '#f5c842', color: '#0d1b2a', borderRadius: '50%', width: 15, height: 15, fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>D</div>}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#f5c842' }}>{player.name}</div>
        <div style={{ fontSize: 10, color: `${color}cc`, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
          {state.config.teamMode === 'individual' ? 'Individual' : `Team ${player.teamIndex + 1}`} · You
        </div>
      </div>
      {isMyTurn && (
        <div style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.45)', borderRadius: 6, padding: '4px 10px', color: '#f5c842', fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' as const, animation: 'myTurnPulse 1.4s ease-in-out infinite' }}>
          Your Turn ▶
        </div>
      )}
      {bid !== null && bid !== undefined && (
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.07)', width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase' as const }}>Bid</div>
              <div style={{ color: '#f5c842', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16 }}>{bid as number}</div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase' as const }}>Won</div>
              <div style={{ color: '#4ade80', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16 }}>{won}</div>
            </div>
          </div>
        </div>
      )}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, textTransform: 'uppercase' as const, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.1em' }}>Score</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 19 }}>
          <span style={{ color: score < 0 ? '#f87171' : color }}>{score}</span>
          {bags > 0 && <span style={{ fontSize: 10, color: 'rgba(251,191,36,0.75)', marginLeft: 3 }}>+{bags}B</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Main GameTable ───────────────────────────────────────────────────────────
export function GameTable({ state, onPlayCard, onBid, onNextRound, onLeave }: GameTableProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showScore, setShowScore]       = useState(false);
  const [showDealing, setShowDealing]   = useState(false);
  const { w, h, isMobile, isTablet }    = useScreenSize();

  const [cpuBidToast, setCpuBidToast]   = useState<{ name: string; bid: number } | null>(null);
  const [frozenTrick, setFrozenTrick]   = useState<Record<string, Card> | null>(null);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFrozen = frozenTrick !== null;

  const prevPhase   = useRef(state.phase);
  const prevRound   = useRef(state.round);
  const prevBids    = useRef<Record<string, any>>(Object.fromEntries(state.players.map(p => [p.id, state.bids[p.id]])));

  // Bid toast
  useEffect(() => {
    for (const player of state.players) {
      if (player.id === state.myPlayerId) continue;
      const prevBid = prevBids.current[player.id];
      const currBid = state.bids[player.id];
      if ((prevBid === null || prevBid === undefined) && currBid !== null && currBid !== undefined) {
        setCpuBidToast({ name: player.name, bid: currBid as number });
        const t = setTimeout(() => setCpuBidToast(null), 3000);
        prevBids.current = Object.fromEntries(state.players.map(p => [p.id, state.bids[p.id]]));
        return () => clearTimeout(t);
      }
    }
    prevBids.current = Object.fromEntries(state.players.map(p => [p.id, state.bids[p.id]]));
  }, [JSON.stringify(state.bids)]);

  // Trick freeze
  const completedTricksCount = state.completedTricks.length;
  const prevCompletedCount   = useRef(state.completedTricks.length);
  useEffect(() => {
    const prev = prevCompletedCount.current;
    prevCompletedCount.current = completedTricksCount;
    if (prev === completedTricksCount) return;
    if (completedTricksCount > prev) {
      const done = state.completedTricks[completedTricksCount - 1];
      if (done?.cards.length > 0) {
        const m: Record<string, Card> = {};
        done.cards.forEach(tc => { m[tc.playerId] = tc.card; });
        if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
        setFrozenTrick(m);
        freezeTimerRef.current = setTimeout(() => setFrozenTrick(null), 3000);
      }
    }
  }, [completedTricksCount]);

  // Clear freeze when new trick starts
  useEffect(() => {
    if (state.currentTrick.length > 0 && frozenTrick !== null) {
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
      setFrozenTrick(null);
    }
  }, [state.currentTrick.length]);

  // Dealer splash
  useEffect(() => {
    const phaseChanged = prevPhase.current !== state.phase;
    const roundChanged = prevRound.current !== state.round;
    if (state.phase === 'bidding' && (roundChanged || (phaseChanged && prevPhase.current === 'waiting'))) {
      setShowDealing(true);
      setFrozenTrick(null);
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
    }
    prevPhase.current = state.phase;
    prevRound.current = state.round;
  }, [state.phase, state.round]);

  const myPlayer   = state.players.find(p => p.id === state.myPlayerId)!;
  const opponents  = state.players.filter(p => p.id !== state.myPlayerId);
  const isMyTurnServer = state.players[state.currentPlayerIndex]?.id === state.myPlayerId;
  const isMyTurn       = isMyTurnServer && !isFrozen;

  // Playable cards
  const playableIds = new Set<string>();
  if (isMyTurnServer && state.phase === 'playing') {
    const fakeState = { hands: { [state.myPlayerId]: state.myHand }, currentTrick: state.currentTrick, spadesBroken: state.spadesBroken } as any;
    getPlayableCards(fakeState, state.myPlayerId).forEach(c => playableIds.add(c.id));
  }

  const handleCardClick = (card: Card) => {
    if (!isMyTurn || state.phase !== 'playing') return;
    if (!playableIds.has(card.id)) return;
    if (selectedCard === card.id) { onPlayCard(card.id); setSelectedCard(null); }
    else setSelectedCard(card.id);
  };

  const suitOrder = ['spades','hearts','diamonds','clubs'];
  const rankOrder = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const sortedHand = [...state.myHand].sort((a, b) => {
    const si = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    return si !== 0 ? si : rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
  });

  const displayCardMap: Record<string, Card> = {};
  if (isFrozen && frozenTrick) Object.entries(frozenTrick).forEach(([pid, card]) => { displayCardMap[pid] = card as Card; });
  else state.currentTrick.forEach(tc => { displayCardMap[tc.playerId] = tc.card; });

  const prevTrickMap = useRef<Record<string, Card>>({});
  useEffect(() => { prevTrickMap.current = { ...displayCardMap }; });

  // ── Responsive sizing ──────────────────────────────────────────────────────
  const panelW     = isMobile ? 52 : 140;
  const topBarH    = isMobile ? 38 : 44;
  // Hand area: card height + hint text + padding
  const cardH      = isMobile ? 90 : 100;
  const handAreaH  = cardH + (isMobile ? 22 : 28);
  // Table: square that fills available space
  const availW     = w - panelW - (isMobile ? 4 : 32);
  const availH     = h - topBarH - handAreaH - (isMobile ? 4 : 24);
  const tableSize  = Math.max(160, Math.min(availW, availH, isMobile ? 300 : 520));
  // On mobile, opponents are shown compact (no card fan, smaller chips)
  const compactOpponents = isMobile;

  return (
    <div style={{ background: 'radial-gradient(ellipse at 60% 40%,#163d22 0%,#0a2614 65%)', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>
      <style>{`
        @keyframes cardPlay { 0%{transform:translateY(-28px) scale(0.6) rotate(-10deg);opacity:0} 65%{transform:translateY(2px) scale(1.05) rotate(1deg);opacity:1} 100%{transform:translateY(0) scale(1) rotate(0);opacity:1} }
        @keyframes handDeal { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes myTurnPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes toastIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        button { touch-action: manipulation; }
      `}</style>

      {/* CPU Bid toast */}
      {cpuBidToast && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(13,26,16,0.94)', border: '1px solid rgba(245,200,66,0.4)', borderRadius: 16, padding: isMobile ? '16px 24px' : '24px 40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', animation: 'toastIn 0.3s ease' }}>
            <div style={{ fontSize: isMobile ? 28 : 36, marginBottom: 6 }}>🤖</div>
            <div style={{ color: 'rgba(160,210,160,0.7)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginBottom: 4 }}>{cpuBidToast.name} bids</div>
            <div style={{ color: '#f5c842', fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 48 : 64, fontWeight: 900, lineHeight: 1 }}>{cpuBidToast.bid}</div>
          </div>
        </div>
      )}

      {/* Trick freeze banner */}
      {isFrozen && (
        <div style={{ position: 'fixed', bottom: isMobile ? 80 : 160, left: '50%', transform: 'translateX(-50%)', zIndex: 150, pointerEvents: 'none', background: 'rgba(13,26,16,0.92)', border: '1px solid rgba(147,197,253,0.35)', borderRadius: 10, padding: '7px 18px', backdropFilter: 'blur(6px)', whiteSpace: 'nowrap', animation: 'toastIn 0.25s ease' }}>
          <div style={{ color: 'rgba(147,197,253,0.85)', fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 10 : 12 }}>⏳ Next trick starting soon…</div>
        </div>
      )}

      {showDealing && <DealerSplash dealer={state.players[state.dealerIndex]} round={state.round} onDone={() => setShowDealing(false)} />}

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 8px' : '0 14px', height: topBarH, flexShrink: 0, background: 'rgba(0,0,0,0.52)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 9, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'linear-gradient(135deg,#1a3a28,#0f2318)', border: '1px solid rgba(245,200,66,0.35)', borderRadius: 7, padding: isMobile ? '3px 7px' : '4px 10px', flexShrink: 0 }}>
            <span style={{ color: '#f5c842', fontSize: isMobile ? 12 : 14 }}>♠</span>
            {!isMobile && <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: '#f5c842' }}>SPADES</span>}
          </div>
          <span style={{ fontSize: isMobile ? 10 : 11, color: 'rgba(130,210,150,0.75)', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
            {isMobile ? `R${state.round}/13` : `Round ${state.round}/13`}
          </span>
          {!isMobile && (
            <span style={{ fontSize: 11, color: 'rgba(180,210,180,0.45)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Dealer: {state.players[state.dealerIndex]?.name}
            </span>
          )}
        </div>
        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 11 : 12, alignItems: 'center' }}>
            {state.teamScores.map((ts, i) => (
              <span key={i} style={{ fontWeight: 700 }}>
                <span style={{ color: ts.score < 0 ? '#f87171' : TEAM_COLORS[i % TEAM_COLORS.length] }}>{ts.score}</span>
                {ts.bags > 0 && <span style={{ fontSize: 8, color: 'rgba(251,191,36,0.75)', marginLeft: 1 }}>+{ts.bags}B</span>}
              </span>
            ))}
          </div>
          {!isMobile && (
            <button onClick={() => setShowScore(s => !s)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: showScore ? '#f5c842' : 'rgba(200,230,200,0.5)', background: showScore ? 'rgba(245,200,66,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showScore ? 'rgba(245,200,66,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
              {showScore ? 'Hide' : 'Score'}
            </button>
          )}
          <button onClick={onLeave} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 10 : 11, fontWeight: 600, color: '#fca5a5', background: 'rgba(220,50,50,0.12)', border: '1px solid rgba(220,80,80,0.35)', borderRadius: 6, padding: isMobile ? '5px 8px' : '4px 11px', cursor: 'pointer', minHeight: 28, touchAction: 'manipulation' }}>
            ✕ {!isMobile && 'Leave'}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {myPlayer && <MyPanel player={myPlayer} state={state} isMyTurn={isMyTurn} isMobile={isMobile} />}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Table area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0, overflow: 'hidden', padding: isMobile ? 2 : 12 }}>

            {/* Felt table — fixed pixel size calculated from available space */}
            <div style={{ position: 'relative', width: tableSize, height: tableSize, flexShrink: 0, background: 'radial-gradient(ellipse at 40% 40%,#1e6b38 0%,#124a24 55%,#0c3318 100%)', border: '3px solid rgba(255,255,255,0.09)', borderRadius: isMobile ? 12 : 18, boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5),0 10px 40px rgba(0,0,0,0.65)' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', opacity: 0.04, backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }} />

              {opponents.map((player, i) => (
                <OpponentSeat key={player.id} player={player} state={state} xy={opponentSeatXY(i)} compact={compactOpponents} />
              ))}
              {opponents.map((player, i) => {
                const card = displayCardMap[player.id];
                if (!card) return null;
                const xy = cardZoneXY(i);
                return (
                  <div key={player.id} style={{ position: 'absolute', left: xy.x, top: xy.y, transform: xy.anchor, zIndex: 4 }}>
                    <TableCard card={card} animKey={`${player.id}-${card.id}`} />
                  </div>
                );
              })}
              {(() => {
                const card = displayCardMap[state.myPlayerId];
                if (!card) return null;
                return (
                  <div style={{ position: 'absolute', left: MY_CARD_ZONE.x, top: MY_CARD_ZONE.y, transform: MY_CARD_ZONE.anchor, zIndex: 4 }}>
                    <TableCard card={card} animKey={`me-${card.id}`} />
                  </div>
                );
              })()}
              {state.phase === 'playing' && Object.keys(displayCardMap).length === 0 && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 2 }}>
                  <div style={{ color: 'rgba(255,255,255,0.18)', fontSize: isMobile ? 10 : 13, fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif" }}>
                    {isMyTurn ? 'Play a card' : `${state.players[state.currentPlayerIndex]?.name}'s turn`}
                  </div>
                </div>
              )}
            </div>

            {/* Bidding overlay */}
            {state.phase === 'bidding' && !showDealing && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,18,10,0.85)', zIndex: 20, padding: isMobile ? 6 : 16, overflowY: 'auto' }}>
                <BiddingPanel state={state} onBid={onBid} />
              </div>
            )}

            {/* Scoring overlay */}
            {(state.phase === 'scoring' || state.phase === 'finished') && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,18,10,0.86)', zIndex: 20, padding: isMobile ? 6 : 16, overflowY: 'auto' }}>
                <ScoreBoard state={state} onNextRound={state.phase === 'scoring' ? onNextRound : undefined} />
              </div>
            )}

            {showScore && state.phase === 'playing' && (
              <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 30, maxHeight: '90%', overflowY: 'auto' }}>
                <ScoreBoard state={state} />
              </div>
            )}
          </div>

          {/* ── My Hand ── */}
          <div style={{ flexShrink: 0, paddingBottom: isMobile ? 4 : 8, paddingTop: isMobile ? 3 : 5, background: 'rgba(0,0,0,0.28)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign: 'center', height: isMobile ? 14 : 16, marginBottom: isMobile ? 2 : 4 }}>
              <span style={{ fontSize: isMobile ? 9 : 11, fontFamily: "'DM Sans', sans-serif", color: isMyTurn && state.phase === 'playing' ? '#f5c842' : 'rgba(160,200,160,0.4)' }}>
                {isMyTurn && state.phase === 'playing'
                  ? (isMobile ? 'Tap · tap again to play' : '✨ Click once to select · click again to play')
                  : state.phase === 'playing'
                    ? `Waiting for ${state.players[state.currentPlayerIndex]?.name}…`
                    : ''}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: isMobile ? 1 : 2, overflowX: 'auto', padding: `0 ${isMobile ? 3 : 10}px ${isMobile ? 2 : 4}px`, minHeight: cardH, scrollbarWidth: 'none' }}>
              {sortedHand.map((card, i) => {
                const isDisabled = state.phase === 'playing' ? (isMyTurnServer ? !playableIds.has(card.id) : true) : false;
                return (
                  <div key={card.id} style={{ flexShrink: 0, animation: `handDeal 0.25s ${i * 18}ms ease both` }}>
                    <CardComponent card={card} size="hand" selected={selectedCard === card.id} disabled={isDisabled} onClick={() => handleCardClick(card)} />
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
