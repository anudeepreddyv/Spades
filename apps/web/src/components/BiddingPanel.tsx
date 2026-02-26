import React, { useState } from 'react';
import { PublicGameState, BidValue } from '@spades/shared';

interface BiddingPanelProps {
  state: PublicGameState;
  onBid: (bid: BidValue) => void;
}

const C = {
  bg: '#0d1a10',
  border: 'rgba(255,255,255,0.09)',
  gold: '#f5c842',
  numBg: 'rgba(255,255,255,0.06)',
  divider: 'rgba(255,255,255,0.07)',
  rowBg: 'rgba(0,0,0,0.25)',
};

export function BiddingPanel({ state, onBid }: BiddingPanelProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const isMyTurn = state.players[state.currentPlayerIndex]?.id === state.myPlayerId;
  const maxBid = state.round;
  const myBid = state.bids[state.myPlayerId] as number | null | undefined;
  const currentBidder = state.players[state.currentPlayerIndex];
  const dealer = state.players[state.dealerIndex];

  // Grid columns: up to 7 per row
  const cols = Math.min(maxBid + 1, 7);

  return (
    <div style={{
      background: C.bg,
      borderRadius: 18,
      border: `1px solid ${C.border}`,
      padding: '22px 24px 20px',
      boxShadow: '0 24px 60px rgba(0,0,0,0.88)',
      width: '100%',
      maxWidth: 360,
    }}>
      {/* Title */}
      <h3 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 20, fontWeight: 600, color: C.gold,
        textAlign: 'center', margin: '0 0 4px',
      }}>
        {isMyTurn ? 'Place Your Bid' : 'Bidding Phase'}
      </h3>

      {/* Context line */}
      <div style={{
        textAlign: 'center', color: 'rgba(245,200,66,0.5)',
        fontSize: 11, marginBottom: 14,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Round {state.round}/13 · {maxBid} card{maxBid !== 1 ? 's' : ''} · Dealer: <span style={{ color: 'rgba(245,200,66,0.8)' }}>{dealer?.name}</span>
      </div>

      {/* Waiting message */}
      {!isMyTurn && (
        <p style={{
          color: 'rgba(160,200,160,0.55)', fontSize: 12,
          textAlign: 'center', margin: '0 0 14px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Waiting for <span style={{ color: '#7dd4a0', fontWeight: 600 }}>{currentBidder?.name}</span> to bid…
        </p>
      )}
      {isMyTurn && (
        <p style={{
          color: 'rgba(160,200,160,0.5)', fontSize: 12,
          textAlign: 'center', margin: '0 0 14px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          How many tricks will you win?
        </p>
      )}

      {/* My bid confirmation */}
      {myBid !== null && myBid !== undefined && (
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <span style={{ color: 'rgba(160,200,160,0.5)', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Your bid: </span>
          <span style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 20 }}>
            {myBid as number}
          </span>
        </div>
      )}

      {/* Bid number grid — only shown when it's your turn */}
      {isMyTurn && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 7,
          marginBottom: 4,
        }}>
          {Array.from({ length: maxBid + 1 }, (_, n) => (
            <button
              key={n}
              onClick={() => onBid(n as BidValue)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(null)}
              style={{
                aspectRatio: '1',
                borderRadius: 9,
                cursor: 'pointer',
                border: `1px solid ${hovered === n ? C.gold : 'rgba(255,255,255,0.1)'}`,
                background: hovered === n ? C.gold : C.numBg,
                color: hovered === n ? '#0d1a10' : '#a8d8a8',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 14,
                transition: 'all 0.13s',
                padding: '7px 0',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* All players' bids summary */}
      <div style={{
        marginTop: 16, paddingTop: 14,
        borderTop: `1px solid ${C.divider}`,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {state.players.map(p => (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '5px 9px', borderRadius: 7, background: C.rowBg,
            }}>
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                color: p.id === state.myPlayerId ? C.gold : 'rgba(160,210,160,0.7)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 85,
              }}>
                {p.name}{p.id === state.myPlayerId ? ' ★' : ''}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, marginLeft: 6 }}>
                {state.bids[p.id] === null || state.bids[p.id] === undefined
                  ? <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>
                  : <span style={{ color: C.gold }}>{state.bids[p.id] as number}</span>
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
