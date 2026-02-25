import React, { useState } from 'react';
import { PublicGameState, Card } from '@spades/shared';
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

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣'
};

// Positions for each player seat relative to "me" (bottom)
function getPlayerPositions(playerCount: number, myIndex: number) {
  // Returns [top, right, bottom-right, top, left, bottom-left] adjusted
  const positions = [
    { style: 'bottom-0 left-1/2 -translate-x-1/2', label: 'bottom' },
    { style: 'left-0 top-1/2 -translate-y-1/2', label: 'left' },
    { style: 'top-0 left-1/2 -translate-x-1/2', label: 'top' },
    { style: 'right-0 top-1/2 -translate-y-1/2', label: 'right' },
  ];
  // For 4 players: me=bottom, left, top, right
  const rotated = [];
  for (let i = 0; i < playerCount; i++) {
    rotated.push(positions[i % 4]);
  }
  return rotated;
}

function PlayerSeat({ player, state, position }: {
  player: any; state: PublicGameState; position: string;
}) {
  const isCurrentPlayer = state.players[state.currentPlayerIndex]?.id === player.id;
  const bid = state.bids[player.id];
  const tricksTaken = state.completedTricks.filter(t => t.winnerId === player.id).length;

  return (
    <div className={`absolute ${position} flex flex-col items-center gap-1`}
      style={{ minWidth: 80 }}>
      <div className={`flex flex-col items-center ${isCurrentPlayer ? 'active-player' : ''}`}>
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
          ${player.teamIndex === 0 ? 'bg-blue-900/60 border-blue-500/50 text-blue-300' : 'bg-red-900/60 border-red-500/50 text-red-300'}
          ${isCurrentPlayer ? 'border-gold-400 ring-2 ring-gold-400/30' : ''}
          ${!player.connected ? 'opacity-40' : ''}`}>
          {player.name[0].toUpperCase()}
        </div>
        <div className="text-xs text-center mt-0.5">
          <div className={`font-medium ${player.id === state.myPlayerId ? 'text-gold-300' : 'text-green-300'}`}>
            {player.name}{player.id === state.myPlayerId ? ' (You)' : ''}
          </div>
          {bid !== null && bid !== undefined && (
            <div className="text-green-500/60 font-mono text-xs">
              Bid: <span className="text-gold-400">{bid === 'nil' ? 'NIL' : bid === 'blind_nil' ? 'BN' : bid}</span>
              {' '}| Won: <span className="text-green-400">{tricksTaken}</span>
            </div>
          )}
        </div>
      </div>
      {/* Face-down cards indicator for opponents */}
      {player.id !== state.myPlayerId && (
        <div className="flex -space-x-2 mt-1">
          {Array.from({ length: Math.min(3, 13) }).map((_, i) => (
            <CardBack key={i} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}

export function GameTable({ state, onPlayCard, onBid, onNextRound, onLeave }: GameTableProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showScore, setShowScore] = useState(false);

  const myPlayer = state.players.find(p => p.id === state.myPlayerId);
  const isMyTurn = state.players[state.currentPlayerIndex]?.id === state.myPlayerId;

  // Get playable cards - fake a minimal state shape for the pure function
  const playableIds = new Set<string>();
  if (isMyTurn && state.phase === 'playing') {
    const fakeState = {
      hands: { [state.myPlayerId]: state.myHand },
      currentTrick: state.currentTrick,
      spadesBroken: state.spadesBroken,
    } as any;
    getPlayableCards(fakeState, state.myPlayerId).forEach(c => playableIds.add(c.id));
  }

  const handleCardClick = (card: Card) => {
    if (!isMyTurn || state.phase !== 'playing') return;
    if (!playableIds.has(card.id)) return;

    if (selectedCard === card.id) {
      onPlayCard(card.id);
      setSelectedCard(null);
    } else {
      setSelectedCard(card.id);
    }
  };

  // Sort hand: by suit then rank
  const suitOrder = ['spades', 'hearts', 'diamonds', 'clubs'];
  const rankOrder = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const sortedHand = [...state.myHand].sort((a, b) => {
    const si = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    if (si !== 0) return si;
    return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
  });

  const positions = [
    'bottom-28 left-1/2 -translate-x-1/2',
    'left-8 top-1/2 -translate-y-1/2',
    'top-8 left-1/2 -translate-x-1/2',
    'right-8 top-1/2 -translate-y-1/2',
  ];

  return (
    <div style={{ background: 'radial-gradient(ellipse at center, #145228 0%, #0a2614 70%)', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>
      {/* ── Top Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.45)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        {/* Left: Spades badge + room info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Brand badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg, #1a3a28, #0f2318)',
            border: '1px solid rgba(245,200,66,0.35)',
            borderRadius: 8,
            padding: '5px 12px',
            boxShadow: '0 0 12px rgba(245,200,66,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>
            <span style={{ color: '#f5c842', fontSize: 16, lineHeight: 1, filter: 'drop-shadow(0 0 6px rgba(245,200,66,0.6))' }}>♠</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#f5c842', letterSpacing: '0.08em' }}>SPADES</span>
          </div>
          {/* Room + round */}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.3)', borderRadius: 5, padding: '3px 7px', border: '1px solid rgba(255,255,255,0.07)' }}>
            #{state.id}
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(120,200,140,0.7)', letterSpacing: '0.05em' }}>
            Round {state.round}
          </span>
        </div>

        {/* Right: score + toggle + leave */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Score display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
            <span style={{ color: '#93c5fd', fontWeight: 700 }}>{state.teamScores[0].score}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>vs</span>
            <span style={{ color: '#fca5a5', fontWeight: 700 }}>{state.teamScores[1].score}</span>
          </div>

          {/* Score toggle */}
          <button
            onClick={() => setShowScore(s => !s)}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500,
              color: showScore ? '#f5c842' : 'rgba(200,230,200,0.55)',
              background: showScore ? 'rgba(245,200,66,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showScore ? 'rgba(245,200,66,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 6, padding: '4px 10px', cursor: 'pointer', transition: 'all 0.2s',
              letterSpacing: '0.05em',
            }}
          >
            {showScore ? 'Hide Score' : 'Score'}
          </button>

          {/* Leave button */}
          <button
            onClick={onLeave}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
              color: '#fca5a5',
              background: 'rgba(220,50,50,0.12)',
              border: '1px solid rgba(220,80,80,0.35)',
              borderRadius: 6, padding: '4px 12px', cursor: 'pointer', transition: 'all 0.2s',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(220,50,50,0.28)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,80,80,0.65)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(220,50,50,0.12)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220,80,80,0.35)';
            }}
          >
            ✕ Leave
          </button>
        </div>
      </div>

      {/* Main table area */}
      <div className="flex-1 relative flex items-center justify-center">

        {/* Player seats */}
        {state.players.map((player, i) => (
          <PlayerSeat key={player.id} player={player} state={state}
            position={positions[i] || positions[i % 4]} />
        ))}

        {/* Center trick area */}
        <div className="relative w-64 h-48 flex items-center justify-center">
          {/* Oval table surface */}
          <div className="absolute inset-0 rounded-full bg-felt-700/30 border border-felt-600/20" style={{ borderRadius: '50%' }}></div>

          {state.currentTrick.length > 0 ? (
            <div className="relative z-10 flex flex-wrap gap-2 justify-center items-center p-4">
              {state.currentTrick.map((tc, i) => {
                const player = state.players.find(p => p.id === tc.playerId);
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <CardComponent card={tc.card} size="md" />
                    <span className="text-xs text-green-400/50">{player?.name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="relative z-10 text-center">
              {state.phase === 'playing' && (
                <div className="text-felt-600 text-sm font-body italic">
                  {isMyTurn ? 'Your lead' : `${state.players[state.currentPlayerIndex]?.name}'s turn`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bidding overlay */}
        {state.phase === 'bidding' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5, 18, 10, 0.82)',
            zIndex: 20,
          }}>
            <BiddingPanel state={state} onBid={onBid} />
          </div>
        )}

        {/* Scoring overlay */}
        {(state.phase === 'scoring' || state.phase === 'finished') && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5, 18, 10, 0.82)',
            zIndex: 20,
          }}>
            <ScoreBoard state={state} onNextRound={state.phase === 'scoring' ? onNextRound : undefined} />
          </div>
        )}

        {/* Score panel (toggle) */}
        {showScore && state.phase === 'playing' && (
          <div className="absolute top-4 right-4 z-30">
            <ScoreBoard state={state} />
          </div>
        )}
      </div>

      {/* My hand */}
      <div className="pb-4 pt-2">
        {myPlayer && (
          <div className="text-center mb-2">
            <span className="text-xs text-green-400/60 font-body">
              {isMyTurn && state.phase === 'playing'
                ? '✨ Your turn — click once to select, again to play'
                : state.phase === 'playing'
                ? `Waiting for ${state.players[state.currentPlayerIndex]?.name}...`
                : ''}
            </span>
          </div>
        )}
        <div className="flex justify-center items-end gap-1 flex-wrap px-4"
          style={{ minHeight: 96 }}>
          {sortedHand.map((card, i) => (
            <div key={card.id} className="card-enter" style={{ animationDelay: `${i * 30}ms` }}>
              <CardComponent
                card={card}
                size="md"
                selected={selectedCard === card.id}
                disabled={isMyTurn && state.phase === 'playing' ? !playableIds.has(card.id) : state.phase !== 'playing' || !isMyTurn}
                onClick={() => handleCardClick(card)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
