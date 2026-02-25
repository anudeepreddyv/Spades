export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // e.g. "A-spades"
}

export type BidValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 'nil' | 'blind_nil';

export interface Player {
  id: string;
  name: string;
  teamIndex: number; // 0 or 1
  seatIndex: number; // 0-3
  connected: boolean;
}

export interface TrickCard {
  playerId: string;
  card: Card;
}

export interface Trick {
  cards: TrickCard[];
  winnerId: string | null;
  leadSuit: Suit | null;
}

export type GamePhase = 'waiting' | 'bidding' | 'playing' | 'scoring' | 'finished';

export interface TeamScore {
  score: number;
  bags: number;
  bids: number;
  tricks: number;
}

export interface GameConfig {
  deckCount: 1 | 2;
  targetScore: number;
  allowNil: boolean;
  allowBlindNil: boolean;
  playerCount: 2 | 4 | 6;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  config: GameConfig;
  players: Player[];
  // Hands are private - server sends each player only their own hand
  hands: Record<string, Card[]>;
  bids: Record<string, BidValue | null>;
  currentTrick: TrickCard[];
  completedTricks: Trick[];
  teamScores: [TeamScore, TeamScore];
  currentPlayerIndex: number;
  spadesBroken: boolean;
  round: number;
  dealerIndex: number;
  winner: number | null; // team index
}

// What gets sent to each client (hands are masked)
export interface PublicGameState extends Omit<GameState, 'hands'> {
  myHand: Card[];
  myPlayerId: string;
}

// Socket event payloads
export interface ServerToClientEvents {
  game_state: (state: PublicGameState) => void;
  room_players: (players: Player[]) => void;
  error: (msg: string) => void;
  room_created: (roomId: string) => void;
  joined_room: (roomId: string, playerId: string) => void;
}

export interface ClientToServerEvents {
  create_room: (playerName: string, config: Partial<GameConfig>) => void;
  join_room: (roomId: string, playerName: string) => void;
  rejoin_room: (roomId: string, playerId: string) => void;
  start_game: () => void;
  place_bid: (bid: BidValue) => void;
  play_card: (cardId: string) => void;
  next_round: () => void;
}
