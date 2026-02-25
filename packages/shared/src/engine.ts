import { Card, Suit, Rank, GameState, GameConfig, Player, TrickCard, Trick, BidValue, TeamScore } from './types';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export function createDeck(count: 1 | 2 = 1): Card[] {
  const deck: Card[] = [];
  for (let d = 0; d < count; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank, id: `${rank}-${suit}${count === 2 ? `-${d}` : ''}` });
      }
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(state: GameState): GameState {
  const deck = shuffleDeck(createDeck(state.config.deckCount));
  const hands: Record<string, Card[]> = {};
  const cardsPerPlayer = Math.floor(deck.length / state.players.length);

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

export function isValidBid(state: GameState, playerId: string, bid: BidValue): boolean {
  if (state.phase !== 'bidding') return false;
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex !== state.currentPlayerIndex) return false;
  if (bid === 'blind_nil' && !state.config.allowBlindNil) return false;
  if (bid === 'nil' && !state.config.allowNil) return false;
  return true;
}

export function placeBid(state: GameState, playerId: string, bid: BidValue): GameState {
  const newBids = { ...state.bids, [playerId]: bid };
  const allBid = state.players.every(p => newBids[p.id] !== null);

  let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;

  if (allBid) {
    // Move to playing, first player after dealer leads
    return {
      ...state,
      bids: newBids,
      phase: 'playing',
      currentPlayerIndex: (state.dealerIndex + 1) % state.players.length,
    };
  }

  return { ...state, bids: newBids, currentPlayerIndex: nextIndex };
}

export function getPlayableCards(state: GameState, playerId: string): Card[] {
  const hand = state.hands[playerId] || [];
  if (state.currentTrick.length === 0) {
    // Leading: can't lead spades unless broken or only spades left
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
  const playable = getPlayableCards(state, playerId);
  return playable.some(c => c.id === cardId);
}

function determineTrickWinner(trick: TrickCard[], leadSuit: Suit): string {
  let winner = trick[0];
  for (const tc of trick.slice(1)) {
    const wCard = winner.card;
    const cCard = tc.card;
    if (cCard.suit === 'spades' && wCard.suit !== 'spades') {
      winner = tc;
    } else if (cCard.suit === wCard.suit && RANK_VALUES[cCard.rank] > RANK_VALUES[wCard.rank]) {
      winner = tc;
    }
  }
  return winner.playerId;
}

export function playCard(state: GameState, playerId: string, cardId: string): GameState {
  const card = state.hands[playerId].find(c => c.id === cardId)!;
  const newHand = state.hands[playerId].filter(c => c.id !== cardId);
  const newHands = { ...state.hands, [playerId]: newHand };
  const newTrick: TrickCard[] = [...state.currentTrick, { playerId, card }];
  const spadesBroken = state.spadesBroken || card.suit === 'spades';

  // Trick not complete yet
  if (newTrick.length < state.players.length) {
    return {
      ...state,
      hands: newHands,
      currentTrick: newTrick,
      spadesBroken,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    };
  }

  // Trick complete - determine winner
  const leadSuit = newTrick[0].card.suit;
  const winnerId = determineTrickWinner(newTrick, leadSuit);
  const winnerIndex = state.players.findIndex(p => p.id === winnerId);

  const completedTrick: Trick = {
    cards: newTrick,
    winnerId,
    leadSuit,
  };

  const newCompletedTricks = [...state.completedTricks, completedTrick];

  // Check if round over (all cards played)
  const allHandsEmpty = Object.values(newHands).every(h => h.length === 0);

  if (allHandsEmpty) {
    return calculateRoundScore({
      ...state,
      hands: newHands,
      currentTrick: [],
      completedTricks: newCompletedTricks,
      spadesBroken,
      phase: 'scoring',
    });
  }

  return {
    ...state,
    hands: newHands,
    currentTrick: [],
    completedTricks: newCompletedTricks,
    spadesBroken,
    currentPlayerIndex: winnerIndex,
  };
}

export function calculateRoundScore(state: GameState): GameState {
  // Count tricks per player
  const tricksWon: Record<string, number> = Object.fromEntries(state.players.map(p => [p.id, 0]));
  for (const trick of state.completedTricks) {
    if (trick.winnerId) tricksWon[trick.winnerId]++;
  }

  const newTeamScores: [TeamScore, TeamScore] = [
    { ...state.teamScores[0] },
    { ...state.teamScores[1] },
  ];

  // Calculate per-team
  for (let teamIdx = 0; teamIdx < 2; teamIdx++) {
    const teamPlayers = state.players.filter(p => p.teamIndex === teamIdx);
    let teamBid = 0;
    let teamTricks = 0;
    let nilBonus = 0;

    for (const player of teamPlayers) {
      const bid = state.bids[player.id];
      const tricks = tricksWon[player.id];

      if (bid === 'nil' || bid === 'blind_nil') {
        const nilValue = bid === 'blind_nil' ? 200 : 100;
        if (tricks === 0) {
          nilBonus += nilValue;
        } else {
          nilBonus -= nilValue;
          teamTricks += tricks;
        }
      } else {
        teamBid += (bid as number) || 0;
        teamTricks += tricks;
      }
    }

    newTeamScores[teamIdx].bids = teamBid;
    newTeamScores[teamIdx].tricks = teamTricks;

    if (teamTricks >= teamBid) {
      const overtricks = teamTricks - teamBid;
      newTeamScores[teamIdx].score += teamBid * 10 + overtricks + nilBonus;
      newTeamScores[teamIdx].bags += overtricks;
      // Bag penalty
      if (newTeamScores[teamIdx].bags >= 10) {
        newTeamScores[teamIdx].score -= 100;
        newTeamScores[teamIdx].bags -= 10;
      }
    } else {
      newTeamScores[teamIdx].score -= teamBid * 10;
      newTeamScores[teamIdx].score += nilBonus;
    }
  }

  // Check for winner
  let winner: number | null = null;
  for (let i = 0; i < 2; i++) {
    if (newTeamScores[i].score >= state.config.targetScore) {
      // Pick highest score
      winner = newTeamScores[0].score > newTeamScores[1].score ? 0 : 1;
    }
  }

  return {
    ...state,
    teamScores: newTeamScores,
    phase: winner !== null ? 'finished' : 'scoring',
    winner,
  };
}

export function startNextRound(state: GameState): GameState {
  const newDealerIndex = (state.dealerIndex + 1) % state.players.length;
  const freshState: GameState = {
    ...state,
    round: state.round + 1,
    dealerIndex: newDealerIndex,
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

export function createInitialState(id: string, config: GameConfig): GameState {
  return {
    id,
    phase: 'waiting',
    config,
    players: [],
    hands: {},
    bids: {},
    currentTrick: [],
    completedTricks: [],
    teamScores: [
      { score: 0, bags: 0, bids: 0, tricks: 0 },
      { score: 0, bags: 0, bids: 0, tricks: 0 },
    ],
    currentPlayerIndex: 0,
    spadesBroken: false,
    round: 1,
    dealerIndex: 0,
    winner: null,
  };
}
