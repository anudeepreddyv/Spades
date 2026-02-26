import { Card, Suit, Rank, GameState, GameConfig, Player, TrickCard, Trick, BidValue, TeamScore, TeamMode } from './types';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

// Total rounds is always 13
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

// ── Team assignment ───────────────────────────────────────────────────────────

export function assignTeams(players: Player[], mode: TeamMode, playerCount: number, numTeams?: number): Player[] {
  const teamCount = getTeamCount(mode, playerCount, numTeams);
  return players.map((p, i) => {
    const teamIndex = mode === 'individual' ? i : i % teamCount;
    return { ...p, teamIndex };
  });
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

// ── Deal ──────────────────────────────────────────────────────────────────────
// Round N → deal N cards to each player

export function dealCards(state: GameState): GameState {
  const cardsPerPlayer = state.round; // round 1 = 1 card, round 13 = 13 cards
  const needed = cardsPerPlayer * state.players.length;
  const fullDeck = shuffleDeck(createDeck());
  // Use only as many cards as needed (from top of shuffled deck)
  const deck = fullDeck.slice(0, needed);

  const hands: Record<string, Card[]> = {};
  state.players.forEach((p, i) => {
    hands[p.id] = deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
  });

  return {
    ...state,
    hands,
    phase: 'bidding',
    bids: Object.fromEntries(state.players.map(p => [p.id, null])),
    currentTrick: [],
    completedTricks: [],
    spadesBroken: false,
    currentPlayerIndex: (state.dealerIndex + 1) % state.players.length,
  };
}

// ── Bidding ───────────────────────────────────────────────────────────────────

export function isValidBid(state: GameState, playerId: string, bid: BidValue): boolean {
  if (state.phase !== 'bidding') return false;
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex !== state.currentPlayerIndex) return false;
  if (bid === 'blind_nil' && !state.config.allowBlindNil) return false;
  if (bid === 'nil' && !state.config.allowNil) return false;
  // In round 1 (1 card each), nil/blind_nil don't make sense — block them
  if (state.round === 1 && (bid === 'nil' || bid === 'blind_nil')) return false;
  return true;
}

export function placeBid(state: GameState, playerId: string, bid: BidValue): GameState {
  const newBids = { ...state.bids, [playerId]: bid };
  const allBid = state.players.every(p => newBids[p.id] !== null);

  if (allBid) {
    return {
      ...state,
      bids: newBids,
      phase: 'playing',
      currentPlayerIndex: (state.dealerIndex + 1) % state.players.length,
    };
  }

  return {
    ...state,
    bids: newBids,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
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
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex !== state.currentPlayerIndex) return false;
  return getPlayableCards(state, playerId).some(c => c.id === cardId);
}

function determineTrickWinner(trick: TrickCard[]): string {
  let winner = trick[0];
  for (const tc of trick.slice(1)) {
    const w = winner.card, c = tc.card;
    if (c.suit === 'spades' && w.suit !== 'spades') {
      winner = tc;
    } else if (c.suit === w.suit && RANK_VALUES[c.rank] > RANK_VALUES[w.rank]) {
      winner = tc;
    }
  }
  return winner.playerId;
}

export function playCard(state: GameState, playerId: string, cardId: string): GameState {
  const card = state.hands[playerId].find(c => c.id === cardId)!;
  const newHands = { ...state.hands, [playerId]: state.hands[playerId].filter(c => c.id !== cardId) };
  const newTrick: TrickCard[] = [...state.currentTrick, { playerId, card }];
  const spadesBroken = state.spadesBroken || card.suit === 'spades';

  if (newTrick.length < state.players.length) {
    return {
      ...state, hands: newHands, currentTrick: newTrick, spadesBroken,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    };
  }

  // Trick complete
  const winnerId = determineTrickWinner(newTrick);
  const winnerIndex = state.players.findIndex(p => p.id === winnerId);
  const completedTricks = [...state.completedTricks, { cards: newTrick, winnerId, leadSuit: newTrick[0].card.suit }];
  const allHandsEmpty = Object.values(newHands).every(h => h.length === 0);

  if (allHandsEmpty) {
    return calculateRoundScore({ ...state, hands: newHands, currentTrick: [], completedTricks, spadesBroken, phase: 'scoring' });
  }

  return { ...state, hands: newHands, currentTrick: [], completedTricks, spadesBroken, currentPlayerIndex: winnerIndex };
}

// ── Scoring ───────────────────────────────────────────────────────────────────
// Rules:
//   - Each unit bid = 10 pts if made, -10 pts if missed
//   - Overtricks = bags: +1 pt each
//   - Every 3 bags accumulated = -30 pts penalty (bags reset by 3)
//   - Nil = ±50 pts (blind nil = ±100)
//   - After round 13 → game over, highest score wins

export function calculateRoundScore(state: GameState): GameState {
  const teamCount = getTeamCount(state.config.teamMode, state.players.length);

  // Count tricks won per player
  const tricksWon: Record<string, number> = Object.fromEntries(state.players.map(p => [p.id, 0]));
  for (const trick of state.completedTricks) {
    if (trick.winnerId) tricksWon[trick.winnerId]++;
  }

  const newTeamScores: TeamScore[] = state.teamScores.map(ts => ({ ...ts, roundScores: [...ts.roundScores] }));

  for (let teamIdx = 0; teamIdx < teamCount; teamIdx++) {
    const teamPlayers = state.players.filter(p => p.teamIndex === teamIdx);
    let teamBid = 0;
    let teamTricks = 0;
    let roundDelta = 0;

    for (const player of teamPlayers) {
      const bid = state.bids[player.id];
      const tricks = tricksWon[player.id] || 0;

      if (bid === 'nil' || bid === 'blind_nil') {
        const nilValue = bid === 'blind_nil' ? 100 : 50;
        roundDelta += tricks === 0 ? nilValue : -nilValue;
        if (tricks > 0) teamTricks += tricks; // failed nil tricks count as bags
      } else {
        teamBid += (bid as number) || 0;
        teamTricks += tricks;
      }
    }

    if (teamTricks >= teamBid) {
      const overtricks = teamTricks - teamBid;
      roundDelta += teamBid * 10 + overtricks; // each overtrick = 1 bag point
      newTeamScores[teamIdx].bags += overtricks;

      // Every 3 bags = -30 penalty, consume those bags
      const bagPenalties = Math.floor(newTeamScores[teamIdx].bags / 3);
      if (bagPenalties > 0) {
        roundDelta -= bagPenalties * 30;
        newTeamScores[teamIdx].bags = newTeamScores[teamIdx].bags % 3;
      }
    } else {
      // Missed bid
      roundDelta -= teamBid * 10;
    }

    newTeamScores[teamIdx].bids = teamBid;
    newTeamScores[teamIdx].tricks = teamTricks;
    newTeamScores[teamIdx].score += roundDelta;
    newTeamScores[teamIdx].roundScores.push(roundDelta);
  }

  // After round 13, game is finished
  const isGameOver = state.round >= TOTAL_ROUNDS;
  let winner: number | null = null;
  if (isGameOver) {
    let maxScore = -Infinity;
    newTeamScores.forEach((ts, i) => {
      if (ts.score > maxScore) { maxScore = ts.score; winner = i; }
    });
  }

  return {
    ...state,
    teamScores: newTeamScores,
    phase: isGameOver ? 'finished' : 'scoring',
    winner,
  };
}

// ── Next round ────────────────────────────────────────────────────────────────

export function startNextRound(state: GameState): GameState {
  if (state.round >= TOTAL_ROUNDS) return state; // safety guard
  const freshState: GameState = {
    ...state,
    round: state.round + 1,
    dealerIndex: (state.dealerIndex + 1) % state.players.length,
    completedTricks: [],
    currentTrick: [],
    bids: {},
    hands: {},
    spadesBroken: false,
    winner: null,
    phase: 'bidding',
  };
  return dealCards(freshState);
}

// ── Initial state ─────────────────────────────────────────────────────────────

export function createInitialState(id: string, config: GameConfig, playerCount: number): GameState {
  const teamCount = getTeamCount(config.teamMode, playerCount);
  return {
    id,
    phase: 'waiting',
    config,
    players: [],
    hands: {},
    bids: {},
    currentTrick: [],
    completedTricks: [],
    teamScores: makeTeamScores(teamCount),
    currentPlayerIndex: 0,
    spadesBroken: false,
    round: 1,
    dealerIndex: 0,
    winner: null,
  };
}
