import React, { useState } from 'react';
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

// Team colors
const TEAM_COLOR = ['#93c5fd', '#fca5a5']; // blue, red

// ── Player card shown in the left "Me" panel ──────────────────────────────────
function MyPanel({ player, state, isMyTurn }: { player: Player; state: PublicGameState; isMyTurn: boolean }) {
  const bid = state.bids[player.id];
  const tricksTaken = state.completedTricks.filter(t => t.winnerId === player.id).length;
  const teamColor = TEAM_COLOR[player.teamIndex];

  return (
    <div style={{
      width: 160,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      padding: '16px 12px',
      background: 'rgba(0,0,0,0.28)',
      borderRight: '1px solid rgba(255,255,255,0.07)',
    }}>
      {/* Avatar */}
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: player.teamIndex === 0 ? 'rgba(59,100,180,0.45)' : 'rgba(180,50,50,0.45)',
        border: `2px solid ${isMyTurn ? '#f5c842' : teamColor}`,
        boxShadow: isMyTurn ? '0 0 16px rgba(245,200,66,0.5)' : `0 0 10px ${teamColor}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, fontWeight: 700, color: teamColor,
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all 0.3s',
      }}>
        {player.name[0].toUpperCase()}
      </div>

      {/* Name */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
          color: '#f5c842', letterSpacing: '0.03em',
        }}>
          {player.name}
        </div>
        <div style={{ fontSize: 10, color: teamColor, opacity: 0.8, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
          {player.teamIndex === 0 ? 'Team Blue' : 'Team Red'} · You
        </div>
      </div>

      {/* Turn indicator */}
      {isMyTurn && (
        <div style={{
          background: 'rgba(245,200,66,0.15)',
          border: '1px solid rgba(245,200,66,0.4)',
          borderRadius: 6, padding: '4px 10px',
          color: '#f5c842', fontSize: 10, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.08em',
          textTransform: 'uppercase',
          animation: 'pulse 1.5s infinite',
        }}>
          Your Turn
        </div>
      )}

      {/* Bid / tricks stats */}
      {bid !== null && bid !== undefined && (
        <div style={{
          background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px 14px',
          border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', width: '100%',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bid</div>
              <div style={{ color: '#f5c842', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16 }}>
                {bid === 'nil' ? 'NIL' : bid === 'blind_nil' ? 'BN' : bid}
              </div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>Won</div>
              <div style={{ color: '#4ade80', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16 }}>
                {tricksTaken}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'DM Sans', sans-serif" }}>Score</div>
        <div style={{ color: teamColor, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18 }}>
          {state.teamScores[player.teamIndex].score}
        </div>
      </div>
    </div>
  );
}

// ── Opponent chip placed around the oval ──────────────────────────────────────
function OpponentSeat({ player, state, style }: { player: Player; state: PublicGameState; style: React.CSSProperties }) {
  const isCurrentPlayer = state.players[state.currentPlayerIndex]?.id === player.id;
  const bid = state.bids[player.id];
  const tricksTaken = state.completedTricks.filter(t => t.winnerId === player.id).length;
  const teamColor = TEAM_COLOR[player.teamIndex];

  return (
    <div style={{
      position: 'absolute',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      ...style,
    }}>
      {/* Face-down cards */}
      <div style={{ display: 'flex', marginBottom: 2 }}>
        {[0,1,2].map(i => <CardBack key={i} size="sm" />)}
      </div>

      {/* Avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: player.teamIndex === 0 ? 'rgba(59,100,180,0.45)' : 'rgba(180,50,50,0.45)',
        border: `2px solid ${isCurrentPlayer ? '#f5c842' : teamColor}`,
        boxShadow: isCurrentPlayer ? '0 0 14px rgba(245,200,66,0.6)' : `0 0 8px ${teamColor}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 700, color: teamColor,
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all 0.3s',
        opacity: player.connected ? 1 : 0.45,
      }}>
        {player.name[0].toUpperCase()}
      </div>

      {/* Name + stats */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
          color: isCurrentPlayer ? '#f5c842' : 'rgba(200,230,200,0.85)',
          whiteSpace: 'nowrap',
        }}>
          {player.name}
          {isCurrentPlayer && <span style={{ color: '#f5c842', marginLeft: 4 }}>●</span>}
        </div>
        {bid !== null && bid !== undefined && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(160,200,160,0.6)', marginTop: 1 }}>
            <span style={{ color: '#f5c842' }}>{bid === 'nil' ? 'NIL' : bid === 'blind_nil' ? 'BN' : bid}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}> | </span>
            <span style={{ color: '#4ade80' }}>{tricksTaken}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Compute positions for opponents around the oval
// Opponents get positions: top-left, top-center, top-right, right — depending on count
function getOpponentPositions(count: number): React.CSSProperties[] {
  // Positions are relative to the oval container (absolute inside it)
  const all: React.CSSProperties[] = [
    { top: -90,  left: '50%',  transform: 'translateX(-50%)' },  // top-center
    { top: '30%', right: -130, transform: 'translateY(-50%)' },  // right
    { bottom: -90, left: '50%', transform: 'translateX(-50%)' }, // bottom-center (rare)
    { top: '30%', left: -130,  transform: 'translateY(-50%)' },  // left (rare)
  ];
  return all.slice(0, count);
}

export function GameTable({ state, onPlayCard, onBid, onNextRound, onLeave }: GameTableProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showScore, setShowScore] = useState(false);

  const myPlayer = state.players.find(p => p.id === state.myPlayerId);
  const opponents = state.players.filter(p => p.id !== state.myPlayerId);
  const isMyTurn = state.players[state.currentPlayerIndex]?.id === state.myPlayerId;

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

  const suitOrder = ['spades', 'hearts', 'diamonds', 'clubs'];
  const rankOrder = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const sortedHand = [...state.myHand].sort((a, b) => {
    const si = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    if (si !== 0) return si;
    return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
  });

  const opponentPositions = getOpponentPositions(opponents.length);

  return (
    <div style={{
      background: 'radial-gradient(ellipse at center, #145228 0%, #0a2614 70%)',
      height: '100vh', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', userSelect: 'none',
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.45)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg, #1a3a28, #0f2318)',
            border: '1px solid rgba(245,200,66,0.35)',
            borderRadius: 8, padding: '5px 12px',
            boxShadow: '0 0 12px rgba(245,200,66,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>
            <span style={{ color: '#f5c842', fontSize: 16, lineHeight: 1, filter: 'drop-shadow(0 0 6px rgba(245,200,66,0.6))' }}>♠</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#f5c842', letterSpacing: '0.08em' }}>SPADES</span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.3)', borderRadius: 5, padding: '3px 7px', border: '1px solid rgba(255,255,255,0.07)' }}>
            #{state.id}
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(120,200,140,0.7)' }}>
            Round {state.round}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
            <span style={{ color: '#93c5fd', fontWeight: 700 }}>{state.teamScores[0].score}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>vs</span>
            <span style={{ color: '#fca5a5', fontWeight: 700 }}>{state.teamScores[1].score}</span>
          </div>
          <button onClick={() => setShowScore(s => !s)} style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500,
            color: showScore ? '#f5c842' : 'rgba(200,230,200,0.55)',
            background: showScore ? 'rgba(245,200,66,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showScore ? 'rgba(245,200,66,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 6, padding: '4px 10px', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {showScore ? 'Hide Score' : 'Score'}
          </button>
          <button onClick={onLeave}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
              color: '#fca5a5', background: 'rgba(220,50,50,0.12)',
              border: '1px solid rgba(220,80,80,0.35)',
              borderRadius: 6, padding: '4px 12px', cursor: 'pointer', transition: 'all 0.2s',
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,50,50,0.28)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,50,50,0.12)'; }}
          >
            ✕ Leave
          </button>
        </div>
      </div>

      {/* ── Main body: left panel + table ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left: My panel */}
        {myPlayer && (
          <MyPanel player={myPlayer} state={state} isMyTurn={isMyTurn} />
        )}

        {/* Right: Table + hand */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

          {/* Table area */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Oval felt surface */}
            <div style={{
              position: 'relative',
              width: 320, height: 200,
              borderRadius: '50%',
              background: 'rgba(20,82,40,0.35)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>

              {/* Opponents around the oval */}
              {opponents.map((player, i) => (
                <OpponentSeat
                  key={player.id}
                  player={player}
                  state={state}
                  style={opponentPositions[i] || opponentPositions[0]}
                />
              ))}

              {/* Center trick area */}
              {state.currentTrick.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center', padding: 12, zIndex: 2 }}>
                  {state.currentTrick.map((tc, i) => {
                    const p = state.players.find(pl => pl.id === tc.playerId);
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <CardComponent card={tc.card} size="md" />
                        <span style={{ fontSize: 9, color: 'rgba(160,200,160,0.6)', fontFamily: "'DM Sans', sans-serif" }}>{p?.name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                state.phase === 'playing' && (
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif", textAlign: 'center' }}>
                    {isMyTurn ? '← Your lead' : `${state.players[state.currentPlayerIndex]?.name}'s turn`}
                  </div>
                )
              )}
            </div>

            {/* Overlays */}
            {state.phase === 'bidding' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,18,10,0.82)', zIndex: 20 }}>
                <BiddingPanel state={state} onBid={onBid} />
              </div>
            )}
            {(state.phase === 'scoring' || state.phase === 'finished') && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,18,10,0.82)', zIndex: 20 }}>
                <ScoreBoard state={state} onNextRound={state.phase === 'scoring' ? onNextRound : undefined} />
              </div>
            )}
            {showScore && state.phase === 'playing' && (
              <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 30 }}>
                <ScoreBoard state={state} />
              </div>
            )}
          </div>

          {/* ── My Hand ── */}
          <div style={{ flexShrink: 0, paddingBottom: 12, paddingTop: 6, background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign: 'center', marginBottom: 6, height: 16 }}>
              <span style={{ fontSize: 11, color: isMyTurn && state.phase === 'playing' ? '#f5c842' : 'rgba(160,200,160,0.45)', fontFamily: "'DM Sans', sans-serif" }}>
                {isMyTurn && state.phase === 'playing'
                  ? '✨ Click once to select · click again to play'
                  : state.phase === 'playing'
                  ? `Waiting for ${state.players[state.currentPlayerIndex]?.name}...`
                  : ''}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 3, flexWrap: 'wrap', padding: '0 12px', minHeight: 88 }}>
              {sortedHand.map((card, i) => (
                <div key={card.id} className="card-enter" style={{ animationDelay: `${i * 25}ms` }}>
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
      </div>
    </div>
  );
}
