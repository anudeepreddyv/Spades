import React, { useState } from 'react';
import { PublicGameState, BidValue } from '@spades/shared';
import { useScreenSize } from '../hooks/useScreenSize';

interface BiddingPanelProps {
  state: PublicGameState;
  onBid: (bid: BidValue) => void;
}

export function BiddingPanel({ state, onBid }: BiddingPanelProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { isMobile } = useScreenSize();
  const isMyTurn = state.players[state.currentPlayerIndex]?.id === state.myPlayerId;
  const maxBid = state.round;
  const myBid = state.bids[state.myPlayerId] as number | null | undefined;
  const currentBidder = state.players[state.currentPlayerIndex];
  const dealer = state.players[state.dealerIndex];

  // Max 4 per row on mobile, 7 on desktop — keeps buttons large enough to tap
  const maxPerRow = isMobile ? 4 : 7;
  const cols = Math.min(maxBid + 1, maxPerRow);

  return (
    <div style={{
      background: '#0d1a10',
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.09)',
      padding: isMobile ? '14px 12px 12px' : '20px 22px 18px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.88)',
      width: '100%',
      maxWidth: isMobile ? '92vw' : 400,
      overflow: 'hidden',
      boxSizing: 'border-box' as const,
    }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 16 : 19, fontWeight: 600, color: '#f5c842', textAlign: 'center', margin: `0 0 ${isMobile ? 2 : 3}px` }}>
        {isMyTurn ? 'Place Your Bid' : 'Bidding Phase'}
      </h3>

      <div style={{ textAlign: 'center', color: 'rgba(245,200,66,0.5)', fontSize: isMobile ? 10 : 11, marginBottom: isMobile ? 8 : 12, fontFamily: "'DM Sans', sans-serif" }}>
        Round {state.round}/13 · {maxBid} card{maxBid !== 1 ? 's' : ''} · Dealer: <span style={{ color: 'rgba(245,200,66,0.8)' }}>{dealer?.name}</span>
      </div>

      {!isMyTurn && (
        <p style={{ color: 'rgba(160,200,160,0.55)', fontSize: isMobile ? 11 : 12, textAlign: 'center', margin: `0 0 ${isMobile ? 8 : 12}px`, fontFamily: "'DM Sans', sans-serif" }}>
          Waiting for <span style={{ color: '#7dd4a0', fontWeight: 600 }}>{currentBidder?.name}</span> to bid…
        </p>
      )}
      {isMyTurn && (
        <p style={{ color: 'rgba(160,200,160,0.5)', fontSize: isMobile ? 11 : 12, textAlign: 'center', margin: `0 0 ${isMobile ? 8 : 12}px`, fontFamily: "'DM Sans', sans-serif" }}>
          How many tricks will you win?
        </p>
      )}

      {myBid !== null && myBid !== undefined && (
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{ color: 'rgba(160,200,160,0.5)', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Your bid: </span>
          <span style={{ color: '#f5c842', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18 }}>{myBid as number}</span>
        </div>
      )}

      {isMyTurn && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 6 : 7, marginBottom: 4 }}>
          {Array.from({ length: maxBid + 1 }, (_, n) => (
            <button key={n} onClick={() => onBid(n as BidValue)}
              onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(null)}
              style={{
                // Min 44px tall for touch targets (Apple/Google accessibility guideline)
                minHeight: isMobile ? 48 : 40,
                aspectRatio: '1',
                borderRadius: 8,
                cursor: 'pointer',
                border: `1px solid ${hovered === n ? '#f5c842' : 'rgba(255,255,255,0.1)'}`,
                background: hovered === n ? '#f5c842' : 'rgba(255,255,255,0.06)',
                color: hovered === n ? '#0d1a10' : '#a8d8a8',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: isMobile ? 17 : 14,
                transition: 'all 0.13s',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >{n}</button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {state.players.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '5px 8px' : '5px 9px', borderRadius: 7, background: 'rgba(0,0,0,0.25)' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 11 : 12, color: p.id === state.myPlayerId ? '#f5c842' : 'rgba(160,210,160,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 68 : 85 }}>
                {p.name}{p.id === state.myPlayerId ? ' ★' : ''}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: isMobile ? 12 : 13, marginLeft: 4 }}>
                {state.bids[p.id] === null || state.bids[p.id] === undefined
                  ? <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>
                  : <span style={{ color: '#f5c842' }}>{state.bids[p.id] as number}</span>
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
