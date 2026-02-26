import { Card, Suit, Rank, GameState, GameConfig, Player, TrickCard, BidValue, TeamScore, TeamMode } from './types';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const RANK_VALUES: Record<Rank, number> = {
  '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14
};

export const TOTAL_ROUNDS = 13;

// ── Deck ──────────────────────────────────────────────────────────────────────

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ suit, rank, id: `${rank}-${suit}` });
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nextSeat(current: number, total: number): number {
  return (current + 1) % total;
}

export function getTeamCount(mode: TeamMode, playerCount: number, numTeams?: number): number {
  if (mode === 'individual') return playerCount;
  if (numTeams && numTeams > 0) return numTeams;
  if (mode === 'two_teams') return 2;
  return 3;
}

function makeTeamScores(count: number): TeamScore[] {
  return Array.from({ length: count }, () => ({
    score: 0, bags: 0, bids: 0, tricks: 0, roundScores: [],
  }));
}

export function assignTeams(players: Player[], mode: TeamMode, playerCount: number, numTeams?: number): Player[] {
  const teamCount = getTeamCount(mode, playerCount, numTeams);
  return players.map((p, i) => ({
    ...p,
    teamIndex: mode === 'individual' ? i : i % teamCount,
  }));
}

// ── Bidding order (clockwise from left of dealer) ─────────────────────────────
//
// Dealer index D, N players, seats 0..N-1
//
// DEAL:    Cards dealt clockwise starting from seat D+1
// BID:     Clockwise from D+1  →  D+2  →  …  →  D  (dealer bids last)
// LEAD:    First trick led by D+1 (same player who bid first)
//
// 2-player example: A=seat0 deals, B=seat1 bids, A bids, B leads first trick
// 5-player example: A=dealer, B bids, C bids, D bids, E bids, A bids, B leads

function firstBidder(dealerIndex: number, n: number): number {
  return nextSeat(dealerIndex, n);
}

// ── Deal ──────────────────────────────────────────────────────────────────────
// Round N → N cards per player, dealt one at a time clockwise

export function dealCards(state: GameState): GameState {
  const n = state.players.length;
  const cardsPerPlayer = state.round;
  const deck = shuffleDeck(createDeck());

  const hands: Record<string, Card[]> = Object.fromEntries(
    state.players.map(p => [p.id, []])
  );
  let idx = 0;
  for (let pass = 0; pass < cardsPerPlayer; pass++) {
    for (let offset = 1; offset <= n; offset++) {
      const player = state.players[(state.dealerIndex + offset) % n];
      hands[player.id].push(deck[idx++]);
    }
  }

  return {
    ...state,
    hands,
    phase: 'bidding',
    bids: Object.fromEntries(state.players.map(p => [p.id, null])),
    currentTrick: [],
    completedTricks: [],
    spadesBroken: false,
    lastTrickCards: {},
    currentPlayerIndex: firstBidder(state.dealerIndex, n),
  };
}

// ── Bidding ───────────────────────────────────────────────────────────────────
// No nil, no blind nil. Only numeric bids 0..round.

export function isValidBid(state: GameState, playerId: string, bid: BidValue): boolean {
  if (state.phase !== 'bidding') return false;
  const idx = state.players.findIndex(p => p.id === playerId);
  if (idx !== state.currentPlayerIndex) return false;
  // Only numeric bids
  if (typeof bid !== 'number') return false;
  // Cannot bid more tricks than cards in hand
  if (bid < 0 || bid > state.round) return false;
  return true;
}

export function placeBid(state: GameState, playerId: string, bid: BidValue): GameState {
  const newBids = { ...state.bids, [playerId]: bid };
  const n = state.players.length;
  const allBid = state.players.every(p => newBids[p.id] !== null);

  if (allBid) {
    // Play (first trick lead) starts from the DEALER
    // e.g. A deals → B bids → A bids → A leads first trick
    return {
      ...state,
      bids: newBids,
      phase: 'playing',
      currentPlayerIndex: state.dealerIndex,
    };
  }

  return {
    ...state,
    bids: newBids,
    currentPlayerIndex: nextSeat(state.currentPlayerIndex, n),
  };
}

// ── Playing ───────────────────────────────────────────────────────────────────

export function getPlayableCards(state: GameState, playerId: string): Card[] {
  const hand = state.hands[playerId] || [];
  if (state.currentTrick.length === 0) {
    if (!state.spadesBroken) {
      const nonSpades = hand.filter(c => c.suit !== 'spades');
      return nonSpades.length > 0 ? nonSpades : hand;
    }
    return hand;
  }
  const leadSuit = state.currentTrick[0].card.suit;
  const followSuit = hand.filter(c => c.suit === leadSuit);
  return followSuit.length > 0 ? followSuit : hand;
}

export function isValidPlay(state: GameState, playerId: string, cardId: string): boolean {
  if (state.phase !== 'playing') return false;
  if (state.players.findIndex(p => p.id === playerId) !== state.currentPlayerIndex) return false;
  return getPlayableCards(state, playerId).some(c => c.id === cardId);
}

function determineTrickWinner(trick: TrickCard[]): string {
  let winner = trick[0];
  for (const tc of trick.slice(1)) {
    const w = winner.card, c = tc.card;
    if (c.suit === 'spades' && w.suit !== 'spades') winner = tc;
    else if (c.suit === w.suit && RANK_VALUES[c.rank] > RANK_VALUES[w.rank]) winner = tc;
  }
  return winner.playerId;
}

export function playCard(state: GameState, playerId: string, cardId: string): GameState {
  const card = state.hands[playerId].find(c => c.id === cardId)!;
  const newHands = {
    ...state.hands,
    [playerId]: state.hands[playerId].filter(c => c.id !== cardId),
  };
  const newTrick: TrickCard[] = [...state.currentTrick, { playerId, card }];
  const spadesBroken = state.spadesBroken || card.suit === 'spades';
  const n = state.players.length;

  if (newTrick.length < n) {
    return {
      ...state, hands: newHands, currentTrick: newTrick, spadesBroken,
      currentPlayerIndex: nextSeat(state.currentPlayerIndex, n),
    };
  }

  // Trick complete
  const lastTrickCards: Record<string, Card> = {};
  newTrick.forEach(tc => { lastTrickCards[tc.playerId] = tc.card; });

  const winnerId = determineTrickWinner(newTrick);
  const winnerIndex = state.players.findIndex(p => p.id === winnerId);
  const completedTricks = [
    ...state.completedTricks,
    { cards: newTrick, winnerId, leadSuit: newTrick[0].card.suit },
  ];

  const allHandsEmpty = Object.values(newHands).every(h => h.length === 0);
  if (allHandsEmpty) {
    return calculateRoundScore({
      ...state, hands: newHands, currentTrick: [], completedTricks,
      spadesBroken, phase: 'scoring', lastTrickCards,
    });
  }

  return {
    ...state, hands: newHands, currentTrick: [], completedTricks,
    spadesBroken, currentPlayerIndex: winnerIndex, lastTrickCards,
  };
}

// ── Scoring ───────────────────────────────────────────────────────────────────
//
// Each round:
//   Make bid  →  score += bid × 10
//   Miss bid  →  score -= bid × 10
//   Overtricks → accumulated as bags (NOT added to score mid-game)
//
// After round 13 (game over):
//   Final score = accumulated score + (bags × 1) — bags add 1pt each at the END
//   (displayed as "score + Nb" during the game so players can track)
//
// No nil, no blind nil, no mid-game bag penalty.

export function calculateRoundScore(state: GameState): GameState {
  const teamCount = getTeamCount(state.config.teamMode, state.players.length, state.config.numTeams);
  const tricksWon: Record<string, number> = Object.fromEntries(state.players.map(p => [p.id, 0]));
  for (const trick of state.completedTricks)
    if (trick.winnerId) tricksWon[trick.winnerId]++;

  const newTeamScores: TeamScore[] = state.teamScores.map(ts => ({
    ...ts, roundScores: [...ts.roundScores],
  }));

  for (let ti = 0; ti < teamCount; ti++) {
    const members = state.players.filter(p => p.teamIndex === ti);
    let teamBid = 0, teamTricks = 0;

    for (const p of members) {
      teamBid += (state.bids[p.id] as number) || 0;
      teamTricks += tricksWon[p.id] || 0;
    }

    let delta = 0;
    if (teamTricks >= teamBid) {
      // Made the bid
      delta = teamBid * 10;
      const bags = teamTricks - teamBid;
      newTeamScores[ti].bags += bags;  // accumulate bags — no penalty until end
    } else {
      // Missed the bid
      delta = -(teamBid * 10);
    }

    newTeamScores[ti].bids = teamBid;
    newTeamScores[ti].tricks = teamTricks;
    newTeamScores[ti].score += delta;
    newTeamScores[ti].roundScores.push(delta);
  }

  const isGameOver = state.round >= TOTAL_ROUNDS;

  // At game end: add bag points (1pt per bag) to final score for ranking
  if (isGameOver) {
    newTeamScores.forEach(ts => {
      ts.score += ts.bags; // bags cash in as 1pt each at the very end
    });
  }

  let winner: number | null = null;
  if (isGameOver) {
    let best = -Infinity;
    newTeamScores.forEach((ts, i) => { if (ts.score > best) { best = ts.score; winner = i; } });
  }

  return { ...state, teamScores: newTeamScores, phase: isGameOver ? 'finished' : 'scoring', winner };
}

// ── Next round ────────────────────────────────────────────────────────────────

export function startNextRound(state: GameState): GameState {
  if (state.round >= TOTAL_ROUNDS) return state;
  return dealCards({
    ...state,
    round: state.round + 1,
    dealerIndex: nextSeat(state.dealerIndex, state.players.length),
    completedTricks: [], currentTrick: [], bids: {}, hands: {},
    spadesBroken: false, winner: null, lastTrickCards: {}, phase: 'bidding',
  });
}

// ── Initial state ─────────────────────────────────────────────────────────────

export function createInitialState(id: string, config: GameConfig, playerCount: number): GameState {
  return {
    id, phase: 'waiting', config, players: [], hands: {}, bids: {},
    currentTrick: [], completedTricks: [],
    teamScores: makeTeamScores(getTeamCount(config.teamMode, playerCount, config.numTeams)),
    currentPlayerIndex: 0, spadesBroken: false, round: 1, dealerIndex: 0,
    winner: null, lastTrickCards: {},
  };
}
