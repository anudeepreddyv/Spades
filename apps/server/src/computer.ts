// ── Computer (AI) player logic ────────────────────────────────────────────────
// Simple but reasonable strategy:
// - Bidding: count high cards (A,K,Q,J) + spades as likely tricks
// - Playing: follow suit when possible; play highest safe card;
//            lead with high cards when ahead, low when behind

import { GameState, Card, BidValue, Suit, Rank } from '@spades/shared';
import { getPlayableCards, isValidBid, isValidPlay } from '@spades/shared';

const RANK_VALUES: Record<string, number> = {
  '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14
};

// Estimate how many tricks this hand can win
function estimateTricks(hand: Card[], round: number): number {
  if (hand.length === 0) return 0;
  let count = 0;
  for (const card of hand) {
    if (card.suit === 'spades') {
      if (RANK_VALUES[card.rank] >= 12) count += 1;      // Q,K,A of spades almost certain
      else if (RANK_VALUES[card.rank] >= 10) count += 0.7; // J,10 of spades likely
      else count += 0.3;                                  // low spades uncertain
    } else {
      if (RANK_VALUES[card.rank] === 14) count += 0.8;  // Ace of non-spade
      else if (RANK_VALUES[card.rank] === 13) count += 0.5;
    }
  }
  // Round down, minimum 0
  return Math.min(Math.max(Math.round(count), 0), hand.length);
}

export function getComputerBid(state: GameState, playerId: string): BidValue {
  const hand = state.hands[playerId] || [];
  const bid = estimateTricks(hand, state.round);
  // Clamp to valid range
  return Math.min(Math.max(bid, 0), state.round) as BidValue;
}

export function getComputerPlay(state: GameState, playerId: string): string | null {
  const playable = getPlayableCards(state, playerId);
  if (playable.length === 0) return null;
  if (playable.length === 1) return playable[0].id;

  const trick = state.currentTrick;

  // Leading the trick — play highest non-spade, or highest spade if only spades
  if (trick.length === 0) {
    const nonSpades = playable.filter(c => c.suit !== 'spades');
    const pool = nonSpades.length > 0 ? nonSpades : playable;
    // Lead highest card
    return pool.sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank])[0].id;
  }

  // Following: determine what's currently winning the trick
  const leadSuit = trick[0].card.suit as Suit;
  const currentWinner = trick.reduce((best, tc) => {
    const b = best.card, c = tc.card;
    if (c.suit === 'spades' && b.suit !== 'spades') return tc;
    if (c.suit === b.suit && RANK_VALUES[c.rank] > RANK_VALUES[b.rank]) return tc;
    return best;
  });

  const followSuit = playable.filter(c => c.suit === leadSuit);
  const spades = playable.filter(c => c.suit === 'spades');

  // Can follow suit?
  if (followSuit.length > 0) {
    // Try to win: play lowest card that beats current winner
    const beating = followSuit.filter(c =>
      currentWinner.card.suit !== 'spades' && RANK_VALUES[c.rank] > RANK_VALUES[currentWinner.card.rank]
    ).sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank]);
    if (beating.length > 0) return beating[0].id;
    // Can't beat — play lowest
    return followSuit.sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank])[0].id;
  }

  // Can't follow suit — try to cut with a low spade if trick is worth taking
  if (spades.length > 0 && currentWinner.card.suit !== 'spades') {
    return spades.sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank])[0].id;
  }

  // Discard lowest card
  return playable.sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank])[0].id;
}
