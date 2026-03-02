import React from 'react';
import { Card } from '@spades/shared';

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};

const SUIT_COLORS: Record<string, string> = {
  spades:   '#12195a',
  clubs:    '#12195a',
  hearts:   '#c01010',
  diamonds: '#c01010',
};

const SIZES = {
  sm:   { width: 44,  height: 62,  rankSize: 11, suitSize: 18, pad: 3 },
  md:   { width: 58,  height: 84,  rankSize: 13, suitSize: 24, pad: 5 },
  lg:   { width: 70,  height: 102, rankSize: 15, suitSize: 30, pad: 6 },
  hand: { width: 80,  height: 116, rankSize: 16, suitSize: 34, pad: 7 },
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
  // Suit color: slightly muted when disabled, full color when active
  const color = disabled
    ? (card.suit === 'hearts' || card.suit === 'diamonds' ? '#d44' : '#445')
    : SUIT_COLORS[card.suit];
  const s = SIZES[size];
  const isClickable = onClick && !disabled;

  const baseStyle: React.CSSProperties = {
    width: s.width,
    height: s.height,
    minWidth: s.width,
    // Always use a white/cream background — never dark.
    // Disabled cards are just slightly dimmer (opacity 0.55), not dark.
    background: 'linear-gradient(155deg, #ffffff 0%, #f0ebe0 100%)',
    border: selected
      ? '2.5px solid #f5c842'
      : disabled
        ? '1.5px solid #bbb0a0'
        : '1.5px solid #c0ad8a',
    borderRadius: 9,
    boxShadow: selected
      ? '0 0 0 3px rgba(245,200,66,0.45), 0 10px 28px rgba(0,0,0,0.6)'
      : disabled
        ? '0 2px 6px rgba(0,0,0,0.25)'
        : '0 4px 16px rgba(0,0,0,0.45)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: s.pad,
    cursor: isClickable ? 'pointer' : 'default',
    transform: selected ? 'translateY(-18px)' : 'translateY(0)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s',
    // Disabled: slightly transparent so active cards pop by comparison.
    // NOT fully opaque, NOT near-zero — just gently dimmed.
    opacity: disabled ? 0.55 : 1,
    userSelect: 'none',
    boxSizing: 'border-box',
    flexShrink: 0,
    position: 'relative',
  };

  if (faceDown) {
    return (
      <div style={{
        ...baseStyle,
        background: 'repeating-linear-gradient(45deg, #1a5c30, #1a5c30 2px, #134a25 2px, #134a25 9px)',
        border: '1.5px solid #0f3a1c',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 1,
      }}>
        <span style={{ color: '#f5c842', fontSize: s.suitSize, opacity: 0.55 }}>♠</span>
      </div>
    );
  }

  const cornerStyle: React.CSSProperties = {
    color,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 800,
    lineHeight: 1,
    fontSize: s.rankSize,
  };

  return (
    <div
      style={baseStyle}
      onClick={isClickable ? onClick : undefined}
      onMouseEnter={e => {
        if (isClickable && !selected) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-7px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 32px rgba(0,0,0,0.6)';
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = disabled
            ? '0 2px 6px rgba(0,0,0,0.25)'
            : '0 4px 16px rgba(0,0,0,0.45)';
        }
      }}
    >
      {/* Top-left corner */}
      <div style={cornerStyle}>
        <div>{card.rank}</div>
        <div>{symbol}</div>
      </div>

      {/* Center suit symbol */}
      <div style={{ textAlign: 'center', color, fontSize: s.suitSize, lineHeight: 1 }}>
        {symbol}
      </div>

      {/* Bottom-right corner (rotated) */}
      <div style={{ ...cornerStyle, transform: 'rotate(180deg)', textAlign: 'left' }}>
        <div>{card.rank}</div>
        <div>{symbol}</div>
      </div>
    </div>
  );
}

export function CardBack({ size = 'md' }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  return (
    <div style={{
      width: s.width, height: s.height, minWidth: s.width,
      borderRadius: 9,
      border: '1.5px solid rgba(245,200,66,0.3)',
      background: 'repeating-linear-gradient(45deg, #1e6b38, #1e6b38 2px, #145228 2px, #145228 9px)',
      boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
      flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color: 'rgba(245,200,66,0.35)', fontSize: Math.round(s.suitSize * 0.75) }}>♠</span>
    </div>
  );
}
