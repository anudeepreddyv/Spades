import React, { useState } from 'react';
import { PublicGameState, BidValue } from '@spades/shared';

interface BiddingPanelProps {
  state: PublicGameState;
  onBid: (bid: BidValue) => void;
}

const C = {
  bg: '#0d1a10', border: 'rgba(255,255,255,0.09)',
  gold: '#f5c842', numBg: 'rgba(255,255,255,0.06)',
  divider: 'rgba(255,255,255,0.07)', rowBg: 'rgba(0,0,0,0.25)',
};

export function BiddingPanel({ state, onBid }: BiddingPanelProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const isMyTurn = state.players[state.currentPlayerIndex]?.id === state.myPlayerId;
  const maxBid = state.round;
  const myBid = state.bids[state.myPlayerId];
  const currentBidder = state.players[state.currentPlayerIndex];
  const dealer = state.players[state.dealerIndex];

  return (
    <div style={{
      background: C.bg, borderRadius: 18,
      border: `1px solid ${C.border}`, padding: '22px 24px 20px',
      boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
      width: '100%', maxWidth: 360,
    }}>
      {/* Title */}
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: C.gold, textAlign: 'center', margin: '0 0 3px' }}>
        {isMyTurn ? 'Place Your Bid' : 'Bidding Phase'}
      </h3>

      {/* Round + dealer context */}
      <div style={{ textAlign: 'center', color: 'rgba(245,200,66,0.55)', fontSize: 11, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>
        Round {state.round}/13 · {maxBid} card{maxBid !== 1 ? 's' : ''} · Dealer: {dealer?.name}
      </div>

      {/* Who's bidding */}
      {!isMyTurn && (
        <p style={{ color: 'rgba(160,200,160,0.55)', fontSize: 12, textAlign: 'center', margin: '0 0 14px', fontFamily: "'DM Sans', sans-serif" }}>
          Waiting for <span style={{ color: '#7dd4a0', fontWeight: 600 }}>{currentBidder?.name}</span> to bid...
        </p>
      )}
      {isMyTurn && (
        <p style={{ color: 'rgba(160,200,160,0.5)', fontSize: 12, textAlign: 'center', margin: '0 0 14px', fontFamily: "'DM Sans', sans-serif" }}>
          How many tricks will you take?
        </p>
      )}

      {/* My bid confirmation */}
      {myBid !== null && myBid !== undefined && (
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <span style={{ color: 'rgba(160,200,160,0.5)', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Your bid: </span>
          <span style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18 }}>
            {myBid === 'nil' ? 'NIL' : myBid as number}
          </span>
        </div>
      )}

      {/* Bid buttons — only when it's your turn */}
      {isMyTurn && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 10 }}>
            {Array.from({ length: maxBid + 1 }, (_, n) => (
              <button key={n} onClick={() => onBid(n as BidValue)}
                onMouseEnter={() => setHovered(`n${n}`)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  aspectRatio: '1', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${hovered === `n${n}` ? C.gold : 'rgba(255,255,255,0.09)'}`,
                  background: hovered === `n${n}` ? C.gold : C.numBg,
                  color: hovered === `n${n}` ? '#0d1a10' : '#a0d0a0',
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13,
                  transition: 'all 0.13s', padding: '6px 0',
                }}>
                {n}
              </button>
            ))}
          </div>

          {/* Nil — only from round 2 onwards */}
          {state.config.allowNil && state.round >= 2 && (
            <button onClick={() => onBid('nil')}
              onMouseEnter={() => setHovered('nil')}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${hovered === 'nil' ? '#a78bfa' : 'rgba(167,139,250,0.3)'}`,
                background: hovered === 'nil' ? 'rgba(167,139,250,0.22)' : 'rgba(167,139,250,0.07)',
                color: '#c4b5fd', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13,
                transition: 'all 0.13s',
              }}>
              NIL <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.65 }}>±50 pts</span>
            </button>
          )}
        </>
      )}

      {/* Players bid summary */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.divider}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {state.players.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: 6, background: C.rowBg }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: p.id === state.myPlayerId ? C.gold : 'rgba(160,210,160,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>
                {p.name}{p.id === state.myPlayerId ? ' ★' : ''}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, marginLeft: 6 }}>
                {state.bids[p.id] === null || state.bids[p.id] === undefined
                  ? <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>
                  : state.bids[p.id] === 'nil'
                    ? <span style={{ color: '#a78bfa' }}>NIL</span>
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
