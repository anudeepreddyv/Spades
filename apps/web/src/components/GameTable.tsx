import React, { useState, useEffect, useRef } from 'react';
import { PublicGameState, Card, Player } from '@spades/shared';
import { getPlayableCards } from '@spades/shared';
import { CardComponent, CardBack } from './CardComponent';
import { BiddingPanel } from './BiddingPanel';
import { ScoreBoard } from './ScoreBoard';

interface GameTableProps {
  state: PublicGameState;
  onPlayCard: (cardId: string) => void;
  onBid: (bid: any) => void;
  onNextRound: () => void;
  onLeave: () => void;
}

const TEAM_COLORS = ['#93c5fd','#fca5a5','#86efac','#fde68a','#c4b5fd','#f9a8d4','#6ee7b7'];

// ─────────────────────────────────────────────────────────────────────────────
// Seat geometry — distribute N players around a square table.
// "Me" is always in the left panel, so opponents (N-1 of them) are arranged
// clockwise around the 4 edges of the square starting from BOTTOM (closest to me).
//
// Positions are percentages of the table container so they scale automatically.
//
//           top-left  top-center  top-right
//    left                                    right
//           bot-left  bot-center  bot-right
//
// We assign seats clockwise: bottom-center first (directly across from me at top),
// then clockwise: top-right, right, bot-right, bot-center, bot-left, left, top-left, top-center, ...
// ─────────────────────────────────────────────────────────────────────────────

type XY = { x: string; y: string; anchor: string };

// Returns CSS position for opponent slot `i` (0 = first opponent clockwise from bottom)
function opponentSeatXY(i: number, total: number): XY {
  // Clockwise positions around the square (percentages of table w/h)
  const slots: XY[] = [
    { x: '50%',  y: '0%',   anchor: 'translate(-50%, -110%)' }, // top-center
    { x: '80%',  y: '0%',   anchor: 'translate(-50%, -110%)' }, // top-right
    { x: '100%', y: '25%',  anchor: 'translate(10%, -50%)'   }, // right-top
    { x: '100%', y: '50%',  anchor: 'translate(10%, -50%)'   }, // right-mid
    { x: '100%', y: '75%',  anchor: 'translate(10%, -50%)'   }, // right-bottom
    { x: '80%',  y: '100%', anchor: 'translate(-50%, 10%)'   }, // bot-right
    { x: '50%',  y: '100%', anchor: 'translate(-50%, 10%)'   }, // bot-center
    { x: '20%',  y: '100%', anchor: 'translate(-50%, 10%)'   }, // bot-left
    { x: '0%',   y: '75%',  anchor: 'translate(-110%, -50%)' }, // left-bottom
    { x: '0%',   y: '50%',  anchor: 'translate(-110%, -50%)' }, // left-mid
    { x: '0%',   y: '25%',  anchor: 'translate(-110%, -50%)' }, // left-top
    { x: '20%',  y: '0%',   anchor: 'translate(-50%, -110%)' }, // top-left
  ];
  return slots[i % slots.length];
}

// Where that player's played card sits INSIDE the table surface
function cardZoneXY(i: number, total: number): XY {
  const slots: XY[] = [
    { x: '50%',  y: '22%',  anchor: 'translate(-50%, -50%)' }, // top-center
    { x: '72%',  y: '25%',  anchor: 'translate(-50%, -50%)' }, // top-right
    { x: '78%',  y: '40%',  anchor: 'translate(-50%, -50%)' }, // right-top
    { x: '78%',  y: '55%',  anchor: 'translate(-50%, -50%)' }, // right-mid
    { x: '78%',  y: '70%',  anchor: 'translate(-50%, -50%)' }, // right-bottom
    { x: '72%',  y: '78%',  anchor: 'translate(-50%, -50%)' }, // bot-right
    { x: '50%',  y: '80%',  anchor: 'translate(-50%, -50%)' }, // bot-center
    { x: '28%',  y: '78%',  anchor: 'translate(-50%, -50%)' }, // bot-left
    { x: '22%',  y: '70%',  anchor: 'translate(-50%, -50%)' }, // left-bottom
    { x: '22%',  y: '55%',  anchor: 'translate(-50%, -50%)' }, // left-mid
    { x: '22%',  y: '40%',  anchor: 'translate(-50%, -50%)' }, // left-top
    { x: '28%',  y: '25%',  anchor: 'translate(-50%, -50%)' }, // top-left
  ];
  return slots[i % slots.length];
}

// My played card — always bottom-center of the table
const MY_CARD_ZONE: XY = { x: '50%', y: '78%', anchor: 'translate(-50%, -50%)' };

// ─────────────────────────────────────────────────────────────────────────────
// Dealer splash — FULL SCREEN, shown for 2 seconds before each round
// ─────────────────────────────────────────────────────────────────────────────
function DealerSplash({ dealer, round, onDone }: { dealer?: Player; round: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(4,12,6,0.93)',
      animation: 'splashFade 2s ease forwards',
      backdropFilter: 'blur(6px)',
    }}>
      <style>{`
        @keyframes splashFade {
          0%   { opacity: 0; }
          12%  { opacity: 1; }
          78%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes cardDrop {
          0%   { transform: scale(0.15) rotate(-30deg) translateY(-60px); opacity: 0; }
          55%  { transform: scale(1.14) rotate(5deg)  translateY(-5px);  opacity: 1; }
          80%  { transform: scale(0.97) rotate(-1deg) translateY(2px);   opacity: 1; }
          100% { transform: scale(1)   rotate(0deg)  translateY(0);      opacity: 1; }
        }
        @keyframes dealerTextIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardFly1 {
          0%   { transform: translate(0,0) rotate(0deg); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translate(-120px,-80px) rotate(-25deg); opacity: 0.15; }
        }
        @keyframes cardFly2 {
          0%   { transform: translate(0,0) rotate(0deg); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translate(120px,-80px) rotate(25deg); opacity: 0.15; }
        }
        @keyframes cardFly3 {
          0%   { transform: translate(0,0) rotate(0deg); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translate(0,-120px) rotate(10deg); opacity: 0.15; }
        }
      `}</style>

      {/* Flying background cards (decorative) */}
      <div style={{ position: 'absolute', animation: 'cardFly1 1.8s 0.1s ease forwards', opacity: 0 }}><CardBack size="md" /></div>
      <div style={{ position: 'absolute', animation: 'cardFly2 1.8s 0.15s ease forwards', opacity: 0 }}><CardBack size="md" /></div>
      <div style={{ position: 'absolute', animation: 'cardFly3 1.8s 0.2s ease forwards', opacity: 0 }}><CardBack size="md" /></div>

      {/* Main card */}
      <div style={{ animation: 'cardDrop 0.65s cubic-bezier(0.175,0.885,0.32,1.275) forwards', marginBottom: 28, filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.8))' }}>
        <CardBack size="lg" />
      </div>

      {/* Text */}
      <div style={{ animation: 'dealerTextIn 0.4s 0.5s ease both', textAlign: 'center' }}>
        <div style={{
          color: '#f5c842',
          fontFamily: "'Playfair Display', serif",
          fontSize: 28, fontWeight: 700,
          textShadow: '0 0 30px rgba(245,200,66,0.5)',
          marginBottom: 10,
        }}>
          Round {round} of 13
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'rgba(245,200,66,0.1)',
          border: '1px solid rgba(245,200,66,0.3)',
          borderRadius: 12, padding: '10px 22px',
          marginBottom: 8,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(245,200,66,0.2)', border: '2px solid rgba(245,200,66,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#f5c842',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {dealer?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#f5c842', fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700 }}>
              {dealer?.name ?? 'Dealer'} deals
            </div>
            <div style={{ color: 'rgba(245,200,66,0.55)', fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}>
              {round} card{round !== 1 ? 's' : ''} each · dealer leads first trick
            </div>
          </div>
        </div>

        <div style={{ color: 'rgba(200,230,200,0.35)', fontFamily: "'DM Sans', sans-serif", fontSize: 11, marginTop: 4 }}>
          Bidding starts in a moment…
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Played card on the table — stacks new on top, animates in
// ─────────────────────────────────────────────────────────────────────────────
function TableCard({ card, animKey }: { card: Card; animKey: string }) {
  return (
    <div key={animKey} style={{ animation: 'cardPlay 0.32s cubic-bezier(0.175,0.885,0.32,1.275) forwards' }}>
      <CardComponent card={card} size="sm" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Opponent seat chip
// ─────────────────────────────────────────────────────────────────────────────
function OpponentSeat({ player, state, xy }: { player: Player; state: PublicGameState; xy: XY }) {
  const isActive = state.players[state.currentPlayerIndex]?.id === player.id;
  const isDealer = state.players[state.dealerIndex]?.id === player.id;
  const bid = state.bids[player.id];
  const won = state.completedTricks.filter(t => t.winnerId === player.id).length;
  const color = TEAM_COLORS[player.teamIndex % TEAM_COLORS.length];
  const cardsLeft = state.round - state.completedTricks.length;

  return (
    <div style={{
      position: 'absolute',
      left: xy.x, top: xy.y,
      transform: xy.anchor,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      zIndex: 5,
    }}>
      {/* Fan of face-down cards */}
      <div style={{ position: 'relative', height: 30, width: Math.max(20, Math.min(cardsLeft, 6) * 7 + 14), marginBottom: 2 }}>
        {Array.from({ length: Math.min(Math.max(cardsLeft, 0), 6) }).map((_, i, arr) => (
          <div key={i} style={{
            position: 'absolute',
            left: i * 7,
            top: 0,
            transform: `rotate(${(i - (arr.length - 1) / 2) * 5}deg)`,
            transformOrigin: 'bottom center',
            transition: 'all 0.3s',
          }}>
            <CardBack size="sm" />
          </div>
        ))}
      </div>

      {/* Avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: `${color}28`,
        border: `2px solid ${isActive ? '#f5c842' : color + '99'}`,
        boxShadow: isActive ? '0 0 16px rgba(245,200,66,0.7)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 700, color,
        fontFamily: "'DM Sans', sans-serif",
        opacity: player.connected ? 1 : 0.4,
        transition: 'border-color 0.3s, box-shadow 0.3s',
        position: 'relative',
      }}>
        {player.name[0].toUpperCase()}
        {isDealer && (
          <div style={{
            position: 'absolute', top: -5, right: -5,
            background: '#f5c842', color: '#0d1b2a',
            borderRadius: '50%', width: 14, height: 14,
            fontSize: 8, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>D</div>
        )}
      </div>

      {/* Name badge */}
      <div style={{
        background: 'rgba(0,0,0,0.6)', borderRadius: 6,
        padding: '2px 8px', backdropFilter: 'blur(4px)',
        border: `1px solid ${isActive ? 'rgba(245,200,66,0.4)' : 'rgba(255,255,255,0.06)'}`,
      }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: isActive ? '#f5c842' : 'rgba(220,240,220,0.9)', whiteSpace: 'nowrap' }}>
          {player.name === 'CPU' ? '🤖 CPU' : player.name}{isActive ? ' ●' : ''}
        </div>
        {bid !== null && bid !== undefined && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, textAlign: 'center' }}>
            <span style={{ color: '#f5c842' }}>{bid}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}> | </span>
            <span style={{ color: '#4ade80' }}>{won}w</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// My panel (left sidebar)
// ─────────────────────────────────────────────────────────────────────────────
function MyPanel({ player, state, isMyTurn }: { player: Player; state: PublicGameState; isMyTurn: boolean }) {
  const bid = state.bids[player.id];
  const won = state.completedTricks.filter(t => t.winnerId === player.id).length;
  const isDealer = state.players[state.dealerIndex]?.id === player.id;
  const color = TEAM_COLORS[player.teamIndex % TEAM_COLORS.length];

  return (
    <div style={{
      width: 150, flexShrink: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 10, padding: '14px 10px',
      background: 'rgba(0,0,0,0.32)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Avatar */}
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: `${color}28`,
        border: `2px solid ${isMyTurn ? '#f5c842' : color}`,
        boxShadow: isMyTurn ? '0 0 20px rgba(245,200,66,0.55)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, fontWeight: 700, color,
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all 0.3s',
        position: 'relative',
      }}>
        {player.name[0].toUpperCase()}
        {isDealer && (
          <div style={{ position: 'absolute', top: -5, right: -5, background: '#f5c842', color: '#0d1b2a', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>D</div>
        )}
      </div>

      {/* Name */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#f5c842' }}>{player.name}</div>
        <div style={{ fontSize: 10, color: `${color}cc`, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
          {state.config.teamMode === 'individual' ? 'Individual' : `Team ${player.teamIndex + 1}`} · You
        </div>
      </div>

      {/* Turn badge */}
      {isMyTurn && (
        <div style={{
          background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.45)',
          borderRadius: 6, padding: '4px 10px',
          color: '#f5c842', fontSize: 10, fontWeight: 700,
          fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          animation: 'myTurnPulse 1.4s ease-in-out infinite',
        }}>
          Your Turn ▶
        </div>
      )}

      {/* Bid / Won stats */}
      {bid !== null && bid !== undefined && (
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px 14px', border: '1px solid rgba(255,255,255,0.07)', width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase' as const }}>Bid</div>
              <div style={{ color: '#f5c842', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 17 }}>
                {bid as number}
              </div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase' as const }}>Won</div>
              <div style={{ color: '#4ade80', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 17 }}>{won}</div>
            </div>
          </div>
        </div>
      )}

      {/* Score */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, textTransform: 'uppercase' as const, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.1em' }}>Score</div>
        <div style={{ color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 20 }}>
          <span style={{ color: (state.teamScores[player.teamIndex]?.score ?? 0) < 0 ? '#f87171' : color }}>
            {state.teamScores[player.teamIndex]?.score ?? 0}
          </span>
          {(state.teamScores[player.teamIndex]?.bags ?? 0) > 0 && (
            <span style={{ fontSize: 11, color: 'rgba(251,191,36,0.75)', marginLeft: 3 }}>
              +{state.teamScores[player.teamIndex].bags}B
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main GameTable
// ─────────────────────────────────────────────────────────────────────────────
export function GameTable({ state, onPlayCard, onBid, onNextRound, onLeave }: GameTableProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showScore, setShowScore] = useState(false);
  const [showDealing, setShowDealing] = useState(false);

  // CPU bid announcement: show what CPU bid for 3 seconds
  const [cpuBidToast, setCpuBidToast] = useState<{ name: string; bid: number } | null>(null);

  // Trick freeze: when a trick completes, freeze the cards on table for 3s
  // so the player can always see what was played before the table clears
  const [frozenTrick, setFrozenTrick] = useState<Record<string, Card> | null>(null);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // isFrozen: trick cards are shown on table and player can't play during this window
  const isFrozen = frozenTrick !== null;

  const prevPhase = useRef(state.phase);
  const prevRound = useRef(state.round);
  const prevBids = useRef<Record<string, any>>(
    Object.fromEntries(state.players.map(p => [p.id, state.bids[p.id]]))
  );
  const myPlayerId = state.myPlayerId;

  // Detect when a non-human player just placed a bid → show toast for 3s
  useEffect(() => {
    const bids = state.bids;
    for (const player of state.players) {
      if (player.id === myPlayerId) continue;
      const prevBid = prevBids.current[player.id];
      const currBid = bids[player.id];
      if ((prevBid === null || prevBid === undefined) && currBid !== null && currBid !== undefined) {
        setCpuBidToast({ name: player.name, bid: currBid as number });
        const t = setTimeout(() => setCpuBidToast(null), 3000);
        prevBids.current = Object.fromEntries(state.players.map(p => [p.id, bids[p.id]]));
        return () => clearTimeout(t);
      }
    }
    prevBids.current = Object.fromEntries(state.players.map(p => [p.id, bids[p.id]]));
  }, [JSON.stringify(state.bids)]);

  // Detect trick completion → freeze all cards on table for 3s
  // We track the number of completed tricks — each time it increases, freeze the last trick
  const completedTricksCount = state.completedTricks.length;
  const prevCompletedCount = useRef(state.completedTricks.length); // init to current so first render doesn't trigger

  useEffect(() => {
    const prev = prevCompletedCount.current;
    prevCompletedCount.current = completedTricksCount;

    // Skip the very first render (prev === completedTricksCount means we just initialized)
    if (prev === completedTricksCount) return;

    // A new trick just completed
    if (completedTricksCount > prev) {
      const justCompletedTrick = state.completedTricks[completedTricksCount - 1];
      if (justCompletedTrick && justCompletedTrick.cards.length > 0) {
        const trickCards: Record<string, Card> = {};
        justCompletedTrick.cards.forEach(tc => { trickCards[tc.playerId] = tc.card; });

        if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
        setFrozenTrick(trickCards);
        freezeTimerRef.current = setTimeout(() => {
          setFrozenTrick(null);
        }, 3000);
      }
    }
  }, [completedTricksCount]);

  // Clear freeze as soon as a new trick starts (first card appears in currentTrick)
  // This ensures freeze never blocks the player from following CPU's lead
  useEffect(() => {
    if (state.currentTrick.length > 0 && frozenTrick !== null) {
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
      setFrozenTrick(null);
    }
  }, [state.currentTrick.length]);
  useEffect(() => {
    const phaseChanged = prevPhase.current !== state.phase;
    const roundChanged = prevRound.current !== state.round;
    if (state.phase === 'bidding' && (roundChanged || (phaseChanged && prevPhase.current === 'waiting'))) {
      setShowDealing(true);
      // Clear any frozen trick when new round starts
      setFrozenTrick(null);
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
    }
    prevPhase.current = state.phase;
    prevRound.current = state.round;
  }, [state.phase, state.round]);

  const myPlayer = state.players.find(p => p.id === state.myPlayerId)!;
  const opponents = state.players.filter(p => p.id !== state.myPlayerId);

  // isMyTurn based purely on server state — never affected by local freeze
  const isMyTurnServer = state.players[state.currentPlayerIndex]?.id === state.myPlayerId;

  // Always compute playable cards from server state so disabled styling is always correct
  const playableIds = new Set<string>();
  if (isMyTurnServer && state.phase === 'playing') {
    const fakeState = {
      hands: { [state.myPlayerId]: state.myHand },
      currentTrick: state.currentTrick,
      spadesBroken: state.spadesBroken,
    } as any;
    getPlayableCards(fakeState, state.myPlayerId).forEach(c => playableIds.add(c.id));
  }

  // isMyTurn for UI purposes (controls hint text etc) — freeze only delays interaction
  const isMyTurn = isMyTurnServer && !isFrozen;

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

  // Show current trick cards, OR frozen trick cards (3s after trick completes)
  const displayCardMap: Record<string, Card> = {};
  if (isFrozen && frozenTrick) {
    // Show the completed trick frozen on the table so player can see all cards
    Object.entries(frozenTrick).forEach(([pid, card]) => { displayCardMap[pid] = card as Card; });
  } else {
    state.currentTrick.forEach(tc => { displayCardMap[tc.playerId] = tc.card; });
  }
  const trickCardMap = displayCardMap;

  // Track which cards are newly played this render for animation
  const prevTrickMap = useRef<Record<string, Card>>({});
  const newlyPlayed = new Set<string>(
    Object.keys(trickCardMap).filter(pid => !prevTrickMap.current[pid])
  );
  useEffect(() => { prevTrickMap.current = { ...trickCardMap }; });

  return (
    <div style={{ background: 'radial-gradient(ellipse at 60% 40%, #163d22 0%, #0a2614 65%)', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>
      <style>{`
        @keyframes cardPlay {
          0%  { transform: translateY(-32px) scale(0.65) rotate(-12deg); opacity:0; }
          65% { transform: translateY(3px) scale(1.06) rotate(1.5deg); opacity:1; }
          100%{ transform: translateY(0) scale(1) rotate(0deg); opacity:1; }
        }
        @keyframes handDeal {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes myTurnPulse {
          0%,100% { opacity:1; } 50% { opacity:0.55; }
        }
      `}</style>

      {/* ── CPU Bid Toast (full-screen, 3s) ── */}
      {cpuBidToast && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 190,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(13,26,16,0.94)',
            border: '1px solid rgba(245,200,66,0.4)',
            borderRadius: 18,
            padding: '28px 44px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            animation: 'cpuToastIn 0.3s ease',
          }}>
            <style>{`@keyframes cpuToastIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }`}</style>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🤖</div>
            <div style={{ color: 'rgba(160,210,160,0.7)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginBottom: 6 }}>
              {cpuBidToast.name} bids
            </div>
            <div style={{
              color: '#f5c842',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 64, fontWeight: 900,
              lineHeight: 1,
              textShadow: '0 0 40px rgba(245,200,66,0.6)',
            }}>
              {cpuBidToast.bid}
            </div>
          </div>
        </div>
      )}

      {/* ── Trick freeze banner — shows all played cards + 3s pause before next trick ── */}
      {isFrozen && (
        <div style={{
          position: 'fixed', bottom: 180, left: '50%', transform: 'translateX(-50%)',
          zIndex: 150, pointerEvents: 'none',
          background: 'rgba(13,26,16,0.92)',
          border: '1px solid rgba(147,197,253,0.35)',
          borderRadius: 12, padding: '10px 24px',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          animation: 'cpuToastIn 0.25s ease',
          whiteSpace: 'nowrap',
        }}>
          <div style={{ color: 'rgba(147,197,253,0.85)', fontFamily: "'DM Sans', sans-serif", fontSize: 12, textAlign: 'center' }}>
            ⏳ Next trick starting soon…
          </div>
        </div>
      )}

      {/* ── Dealer splash (full-screen, above everything) ── */}
      {showDealing && (
        <DealerSplash
          dealer={state.players[state.dealerIndex]}
          round={state.round}
          onDone={() => setShowDealing(false)}
        />
      )}

      {/* ── Top Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 16px', background: 'rgba(0,0,0,0.52)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#1a3a28,#0f2318)', border: '1px solid rgba(245,200,66,0.35)', borderRadius: 8, padding: '5px 12px', boxShadow: '0 0 12px rgba(245,200,66,0.12)' }}>
            <span style={{ color: '#f5c842', fontSize: 14, filter: 'drop-shadow(0 0 5px rgba(245,200,66,0.5))' }}>♠</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: '#f5c842' }}>SPADES</span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.22)', background: 'rgba(0,0,0,0.3)', borderRadius: 4, padding: '2px 6px', border: '1px solid rgba(255,255,255,0.06)' }}>#{state.id}</span>
          <span style={{ fontSize: 11, color: 'rgba(130,210,150,0.7)', fontFamily: "'DM Sans', sans-serif" }}>Round {state.round}/13</span>
          <span style={{ fontSize: 11, color: 'rgba(180,210,180,0.45)', fontFamily: "'DM Sans', sans-serif" }}>Dealer: {state.players[state.dealerIndex]?.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, alignItems: 'center' }}>
            {state.teamScores.map((ts, i) => (
              <span key={i} style={{ color: TEAM_COLORS[i % TEAM_COLORS.length], fontWeight: 700 }}>
                <span style={{ color: ts.score < 0 ? '#f87171' : TEAM_COLORS[i % TEAM_COLORS.length] }}>{ts.score}</span>
                {ts.bags > 0 && <span style={{ fontSize: 9, color: 'rgba(251,191,36,0.75)', marginLeft: 2, fontWeight: 600 }}>+{ts.bags}B</span>}
              </span>
            ))}
          </div>
          <button onClick={() => setShowScore(s => !s)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: showScore ? '#f5c842' : 'rgba(200,230,200,0.5)', background: showScore ? 'rgba(245,200,66,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showScore ? 'rgba(245,200,66,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', transition: 'all 0.2s' }}>
            {showScore ? 'Hide' : 'Score'}
          </button>
          <button onClick={onLeave}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,50,50,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(220,50,50,0.12)')}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: '#fca5a5', background: 'rgba(220,50,50,0.12)', border: '1px solid rgba(220,80,80,0.35)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
            ✕ Leave
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* My panel */}
        {myPlayer && <MyPanel player={myPlayer} state={state} isMyTurn={isMyTurn} />}

        {/* Table + hand */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Table area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `${Math.max(20, 60 - state.players.length * 4)}px ${Math.max(24, 80 - state.players.length * 4)}px`, position: 'relative', minHeight: 0 }}>

            {/* Square felt table — grows with player count */}
            {/* 2 players: ~380px, 4 players: ~460px, 8 players: ~560px, 12+ players: ~640px */}
            <div style={{
              position: 'relative',
              width: `min(calc(100vh - ${Math.max(140, 320 - state.players.length * 12)}px), calc(100vw - ${Math.max(180, 360 - state.players.length * 12)}px))`,
              aspectRatio: '1 / 1',
              background: 'radial-gradient(ellipse at 40% 40%, #1e6b38 0%, #124a24 55%, #0c3318 100%)',
              border: '3px solid rgba(255,255,255,0.09)',
              borderRadius: 20,
              boxShadow: 'inset 0 0 70px rgba(0,0,0,0.55), 0 12px 50px rgba(0,0,0,0.7)',
            }}>

              {/* Subtle grid pattern on felt */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: 18, opacity: 0.04,
                backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }} />

              {/* Opponent seats around table */}
              {opponents.map((player, i) => (
                <OpponentSeat key={player.id} player={player} state={state} xy={opponentSeatXY(i, opponents.length)} />
              ))}

              {/* Opponent played cards */}
              {opponents.map((player, i) => {
                const card = displayCardMap[player.id];
                if (!card) return null;
                const xy = cardZoneXY(i, opponents.length);
                return (
                  <div key={player.id} style={{ position: 'absolute', left: xy.x, top: xy.y, transform: xy.anchor, zIndex: 4 }}>
                    <TableCard card={card} animKey={`${player.id}-${card.id}`} />
                  </div>
                );
              })}

              {/* My played card */}
              {(() => {
                const card = displayCardMap[state.myPlayerId];
                if (!card) return null;
                return (
                  <div style={{ position: 'absolute', left: MY_CARD_ZONE.x, top: MY_CARD_ZONE.y, transform: MY_CARD_ZONE.anchor, zIndex: 4 }}>
                    <TableCard card={card} animKey={`me-${card.id}`} />
                  </div>
                );
              })()}

              {/* Center label when table is empty */}
              {state.phase === 'playing' && Object.keys(displayCardMap).length === 0 && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 2 }}>
                  <div style={{ color: 'rgba(255,255,255,0.18)', fontSize: 13, fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif" }}>
                    {isMyTurn ? '← Play a card' : `${state.players[state.currentPlayerIndex]?.name}'s turn`}
                  </div>
                </div>
              )}

              {/* Dealer splash rendered at full-screen level below */}
            </div>

            {/* Bidding overlay (outside table, full area) */}
            {state.phase === 'bidding' && !showDealing && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,18,10,0.8)', zIndex: 20 }}>
                <BiddingPanel state={state} onBid={onBid} />
              </div>
            )}

            {/* Scoring overlay */}
            {(state.phase === 'scoring' || state.phase === 'finished') && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,18,10,0.84)', zIndex: 20 }}>
                <ScoreBoard state={state} onNextRound={state.phase === 'scoring' ? onNextRound : undefined} />
              </div>
            )}

            {/* Score panel toggle */}
            {showScore && state.phase === 'playing' && (
              <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 30 }}>
                <ScoreBoard state={state} />
              </div>
            )}
          </div>

          {/* ── My Hand ── */}
          <div style={{ flexShrink: 0, paddingBottom: 10, paddingTop: 6, background: 'rgba(0,0,0,0.28)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign: 'center', height: 18, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", transition: 'color 0.3s', color: isMyTurn && state.phase === 'playing' ? '#f5c842' : 'rgba(160,200,160,0.4)' }}>
                {isMyTurn && state.phase === 'playing'
                  ? '✨ Click once to select · click again to play'
                  : state.phase === 'playing'
                  ? `Waiting for ${state.players[state.currentPlayerIndex]?.name}...`
                  : ''}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 2, overflowX: 'auto', padding: '0 12px 4px', minHeight: 132 }}>
              {sortedHand.map((card, i) => {
                // During bidding: all cards fully visible
                // During playing + server says my turn: dim unplayable cards only
                // During playing + not my turn (server): dim all cards
                const isDisabled = state.phase === 'playing'
                  ? (isMyTurnServer ? !playableIds.has(card.id) : true)
                  : false;

                return (
                  <div key={card.id} style={{ flexShrink: 0, animation: `handDeal 0.28s ${i * 22}ms ease both` }}>
                    <CardComponent
                      card={card}
                      size="hand"
                      selected={selectedCard === card.id}
                      disabled={isDisabled}
                      onClick={() => handleCardClick(card)}
                    />
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
