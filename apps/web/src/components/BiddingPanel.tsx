import React, { useState } from 'react';
import { PublicGameState, BidValue } from '@spades/shared';

interface BiddingPanelProps {
  state: PublicGameState;
  onBid: (bid: BidValue) => void;
}

const C = {
  bg: '#0f1e14',
  border: 'rgba(255,255,255,0.1)',
  gold: '#f5c842',
  goldDim: 'rgba(245,200,66,0.15)',
  text: 'rgba(220,240,220,0.9)',
  textMuted: 'rgba(160,200,160,0.55)',
  textLabel: '#f5c842',
  numBg: 'rgba(255,255,255,0.06)',
  numHover: '#f5c842',
  divider: 'rgba(255,255,255,0.08)',
  rowBg: 'rgba(0,0,0,0.25)',
};

export function BiddingPanel({ state, onBid }: BiddingPanelProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const isMyTurn = state.players[state.currentPlayerIndex]?.id === state.myPlayerId;
  const maxBid = state.round; // can only bid up to cards in hand
  const myBid = state.bids[state.myPlayerId];
  const currentBidder = state.players[state.currentPlayerIndex];

  const numBtn = (n: number) => (
    <button
      key={n}
      onClick={() => onBid(n as BidValue)}
      onMouseEnter={() => setHovered(`n${n}`)}
      onMouseLeave={() => setHovered(null)}
      style={{
        aspectRatio: '1',
        borderRadius: 8,
        border: `1px solid ${hovered === `n${n}` ? C.gold : 'rgba(255,255,255,0.1)'}`,
        background: hovered === `n${n}` ? C.gold : C.numBg,
        color: hovered === `n${n}` ? '#0f1e14' : '#a0d0a0',
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        fontSize: 13,
        cursor: 'pointer',
        transition: 'all 0.15s',
        padding: '6px 0',
      }}
    >
      {n}
    </button>
  );

  return (
    <div style={{
      background: C.bg,
      borderRadius: 18,
      border: `1px solid ${C.border}`,
      padding: '22px 24px 20px',
      boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset',
      width: '100%',
      maxWidth: 360,
      // NO opacity < 1, NO backdrop-filter that causes bleed-through
    }}>
      {/* Title */}
      <h3 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 20,
        fontWeight: 600,
        color: C.gold,
        textAlign: 'center',
        margin: '0 0 4px',
      }}>
        {isMyTurn ? 'Place Your Bid' : 'Bidding Phase'}</h3>
      <div style={{ textAlign: 'center', color: 'rgba(245,200,66,0.6)', fontSize: 11, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Round {state.round} of 13 · {state.round} card{state.round !== 1 ? 's' : ''} dealt</div>
      <h3 style={{ display: 'none' }}
      </h3>

      {/* Subtitle */}
      {!isMyTurn && (
        <p style={{ color: C.textMuted, fontSize: 12, textAlign: 'center', margin: '0 0 16px', fontFamily: "'DM Sans', sans-serif" }}>
          Waiting for{' '}
          <span style={{ color: '#7dd4a0', fontWeight: 600 }}>{currentBidder?.name}</span>
          {' '}to bid...
        </p>
      )}
      {isMyTurn && (
        <p style={{ color: C.textMuted, fontSize: 12, textAlign: 'center', margin: '0 0 16px', fontFamily: "'DM Sans', sans-serif" }}>
          How many tricks will you take?
        </p>
      )}

      {/* Already bid confirmation */}
      {myBid !== null && myBid !== undefined && (
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{ color: C.textMuted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Your bid: </span>
          <span style={{ color: C.gold, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18 }}>
            {myBid === 'nil' ? 'NIL' : myBid === 'blind_nil' ? 'BLIND NIL' : myBid}
          </span>
        </div>
      )}

      {/* Number grid — only shown when it's your turn */}
      {isMyTurn && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 10 }}>
            {Array.from({ length: maxBid + 1 }, (_, n) => n).map(n => numBtn(n))}
          </div>

          {state.config.allowNil && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                onClick={() => onBid('nil')}
                onMouseEnter={() => setHovered('nil')}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding: '10px 0',
                  borderRadius: 8,
                  border: `1px solid ${hovered === 'nil' ? '#a78bfa' : 'rgba(167,139,250,0.3)'}`,
                  background: hovered === 'nil' ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.07)',
                  color: '#c4b5fd',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                NIL
                <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7, marginTop: 2 }}>±100 pts</div>
              </button>

              {state.config.allowBlindNil && (
                <button
                  onClick={() => onBid('blind_nil')}
                  onMouseEnter={() => setHovered('bn')}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    padding: '10px 0',
                    borderRadius: 8,
                    border: `1px solid ${hovered === 'bn' ? '#f87171' : 'rgba(248,113,113,0.3)'}`,
                    background: hovered === 'bn' ? 'rgba(248,113,113,0.2)' : 'rgba(248,113,113,0.07)',
                    color: '#fca5a5',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  BLIND NIL
                  <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7, marginTop: 2 }}>±200 pts</div>
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Bids summary */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.divider}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {state.players.map(p => (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '5px 8px', borderRadius: 6, background: C.rowBg,
            }}>
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                color: p.id === state.myPlayerId ? C.gold : 'rgba(160,210,160,0.7)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80,
              }}>
                {p.name}{p.id === state.myPlayerId ? ' ★' : ''}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, marginLeft: 6 }}>
                {state.bids[p.id] === null || state.bids[p.id] === undefined
                  ? <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                  : state.bids[p.id] === 'nil'
                    ? <span style={{ color: '#a78bfa' }}>NIL</span>
                  : state.bids[p.id] === 'blind_nil'
                    ? <span style={{ color: '#f87171' }}>BN</span>
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
