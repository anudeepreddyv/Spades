export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type BidValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 'nil' | 'blind_nil';

export type TeamMode =
  | 'individual'          // everyone for themselves
  | 'two_teams'           // 2 equal teams
  | 'three_teams';        // 3 teams of 2 (6-player only)

export interface Player {
  id: string;
  name: string;
  teamIndex: number;  // in individual mode, each player is their own team (0,1,2,...)
  seatIndex: number;
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

// One score entry per team (or per player in individual mode)
export interface TeamScore {
  score: number;
  bags: number;
  bids: number;   // bid this round
  tricks: number; // tricks won this round
  roundScores: number[]; // per-round score history
}

export interface GameConfig {
  playerCount: number;       // any number >= 2
  teamMode: TeamMode;
  numTeams?: number;         // explicit team count (overrides teamMode default)
  allowNil: boolean;
  allowBlindNil: boolean;
  // No targetScore — fixed 13 rounds
}

export interface GameState {
  id: string;
  phase: GamePhase;
  config: GameConfig;
  players: Player[];
  hands: Record<string, Card[]>;
  bids: Record<string, BidValue | null>;
  currentTrick: TrickCard[];
  completedTricks: Trick[];
  // One entry per team (or per player in individual)
  teamScores: TeamScore[];
  currentPlayerIndex: number;
  spadesBroken: boolean;
  round: number;        // 1–13: round N deals N cards per player
  dealerIndex: number;
  winner: number | null; // winning teamIndex
}

export interface PublicGameState extends Omit<GameState, 'hands'> {
  myHand: Card[];
  myPlayerId: string;
}

export interface ServerToClientEvents {
  game_state: (state: PublicGameState) => void;
  error: (msg: string) => void;
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
