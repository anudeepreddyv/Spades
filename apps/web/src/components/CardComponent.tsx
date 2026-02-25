import React from 'react';
import { Card } from '@spades/shared';

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣'
};

// Explicit colors per suit — never rely on Tailwind JIT for these
const SUIT_COLORS: Record<string, string> = {
  spades:   '#1a1a2e',  // near-black navy
  clubs:    '#1a1a2e',  // near-black navy
  hearts:   '#cc1f1f',  // vivid red
  diamonds: '#cc1f1f',  // vivid red
};

const SIZES = {
  sm: { width: 40,  height: 56,  rankSize: 10, suitSize: 16, pad: 3  },
  md: { width: 56,  height: 80,  rankSize: 12, suitSize: 22, pad: 4  },
  lg: { width: 64,  height: 96,  rankSize: 14, suitSize: 26, pad: 5  },
};

interface CardProps {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
}

export function CardComponent({ card, onClick, selected, disabled, size = 'md', faceDown }: CardProps) {
  const symbol = SUIT_SYMBOLS[card.suit];
  const color  = SUIT_COLORS[card.suit];
  const s      = SIZES[size];

  const baseStyle: React.CSSProperties = {
    width: s.width,
    height: s.height,
    minWidth: s.width,
    background: '#faf8f2',
    border: selected ? '2px solid #f5c842' : '1px solid #ddd0b8',
    borderRadius: 7,
    boxShadow: selected
      ? '0 0 0 2px #f5c84266, 0 6px 18px rgba(0,0,0,0.45)'
      : '0 3px 10px rgba(0,0,0,0.38)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: s.pad,
    cursor: onClick && !disabled ? 'pointer' : 'default',
    transform: selected ? 'translateY(-12px)' : 'translateY(0)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    opacity: disabled ? 0.38 : 1,
    filter: disabled ? 'grayscale(60%)' : 'none',
    userSelect: 'none',
    boxSizing: 'border-box',
    flexShrink: 0,
  };

  if (faceDown) {
    return (
      <div style={{
        ...baseStyle,
        background: 'repeating-linear-gradient(45deg, #1a5c30, #1a5c30 2px, #134a25 2px, #134a25 9px)',
        border: '1px solid #0f3a1c',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#f5c842', fontSize: s.suitSize, opacity: 0.5 }}>♠</span>
      </div>
    );
  }

  const cornerStyle: React.CSSProperties = {
    color,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    lineHeight: 1,
    fontSize: s.rankSize,
  };

  return (
    <div
      style={baseStyle}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={e => {
        if (onClick && !disabled && !selected) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.5)';
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 3px 10px rgba(0,0,0,0.38)';
        }
      }}
    >
      {/* Top-left corner */}
      <div style={cornerStyle}>
        <div>{card.rank}</div>
        <div>{symbol}</div>
      </div>

      {/* Center suit */}
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

export function CardBack({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = SIZES[size];
  return (
    <div style={{
      width: s.width, height: s.height, minWidth: s.width,
      borderRadius: 7, border: '1px solid #0f3a1c',
      background: 'repeating-linear-gradient(45deg, #1a5c30, #1a5c30 2px, #134a25 2px, #134a25 9px)',
      boxShadow: '0 3px 10px rgba(0,0,0,0.38)',
      flexShrink: 0,
    }} />
  );
}
