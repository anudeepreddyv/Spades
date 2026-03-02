import React from 'react';
import { Card } from '@spades/shared';

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};
const SUIT_COLORS: Record<string, string> = {
  spades: '#12195a', clubs: '#12195a',
  hearts: '#c01010', diamonds: '#c01010',
};

// All sizes now scale via CSS clamp so they adapt to any viewport.
// The 'hand' size uses viewport-relative units to stay visible on small phones.
const SIZES = {
  sm:   { width: 44,  height: 62,  rankSize: 11, suitSize: 18, pad: 3  },
  md:   { width: 54,  height: 78,  rankSize: 13, suitSize: 22, pad: 4  },
  lg:   { width: 68,  height: 100, rankSize: 15, suitSize: 28, pad: 6  },
  hand: { width: 62,  height: 90,  rankSize: 14, suitSize: 26, pad: 5  },
};

interface CardProps {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: keyof typeof SIZES;
  faceDown?: boolean;
}

export function CardComponent({ card, onClick, selected, disabled, size = 'md', faceDown }: CardProps) {
  const symbol = SUIT_SYMBOLS[card.suit];
  const color = disabled
    ? (card.suit === 'hearts' || card.suit === 'diamonds' ? '#d44' : '#445')
    : SUIT_COLORS[card.suit];
  const s = SIZES[size];
  const isClickable = onClick && !disabled;

  const baseStyle: React.CSSProperties = {
    width: s.width,
    height: s.height,
    minWidth: s.width,
    background: 'linear-gradient(155deg, #ffffff 0%, #f0ebe0 100%)',
    border: selected ? '2.5px solid #f5c842' : disabled ? '1.5px solid #bbb0a0' : '1.5px solid #c0ad8a',
    borderRadius: 7,
    boxShadow: selected
      ? '0 0 0 3px rgba(245,200,66,0.45), 0 8px 22px rgba(0,0,0,0.6)'
      : disabled ? '0 2px 5px rgba(0,0,0,0.22)' : '0 3px 12px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: s.pad,
    cursor: isClickable ? 'pointer' : 'default',
    transform: selected ? 'translateY(-14px)' : 'translateY(0)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s',
    opacity: disabled ? 0.52 : 1,
    userSelect: 'none',
    boxSizing: 'border-box',
    flexShrink: 0,
    position: 'relative',
    WebkitTapHighlightColor: 'transparent',
  };

  if (faceDown) {
    return (
      <div style={{ ...baseStyle, background: 'repeating-linear-gradient(45deg,#1a5c30,#1a5c30 2px,#134a25 2px,#134a25 9px)', border: '1.5px solid #0f3a1c', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 }}>
        <span style={{ color: '#f5c842', fontSize: s.suitSize, opacity: 0.55 }}>♠</span>
      </div>
    );
  }

  const cornerStyle: React.CSSProperties = { color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, lineHeight: 1, fontSize: s.rankSize - 1 };
  
  return (
    <div style={baseStyle} onClick={isClickable ? onClick : undefined}
      onMouseEnter={e => { if (isClickable && !selected) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; } }}
      onMouseLeave={e => { if (!selected) { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; } }}
    >
      <div style={cornerStyle}><div>{card.rank}</div><div>{symbol}</div></div>
      <div style={{ textAlign: 'center', color, fontSize: s.suitSize, lineHeight: 1 }}>{symbol}</div>
      <div style={{ ...cornerStyle, transform: 'rotate(180deg)', textAlign: 'left' }}><div>{card.rank}</div><div>{symbol}</div></div>
    </div>
  );
}

export function CardBack({ size = 'md' }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  return (
    <div style={{ width: s.width, height: s.height, minWidth: s.width, borderRadius: 7, border: '1.5px solid rgba(245,200,66,0.3)', background: 'repeating-linear-gradient(45deg,#1e6b38,#1e6b38 2px,#145228 2px,#145228 9px)', boxShadow: '0 3px 10px rgba(0,0,0,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'rgba(245,200,66,0.35)', fontSize: Math.round(s.suitSize * 0.75) }}>♠</span>
    </div>
  );
}
