import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  GameState, GameConfig, Player, PublicGameState,
  createInitialState, dealCards, placeBid, playCard,
  isValidBid, isValidPlay, startNextRound, BidValue
} from '@spades/shared';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// In-memory store
const rooms = new Map<string, GameState>();
const socketToRoom = new Map<string, string>(); // socketId -> roomId
const socketToPlayer = new Map<string, string>(); // socketId -> playerId

function getPublicState(state: GameState, playerId: string): PublicGameState {
  const { hands, ...rest } = state;
  return {
    ...rest,
    myHand: hands[playerId] || [],
    myPlayerId: playerId,
  };
}

function broadcastState(roomId: string) {
  const state = rooms.get(roomId);
  if (!state) return;
  // Send each player their own view
  io.in(roomId).fetchSockets().then(sockets => {
    for (const socket of sockets) {
      const pid = socketToPlayer.get(socket.id);
      if (pid) {
        socket.emit('game_state', getPublicState(state, pid));
      }
    }
  });
}

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function assignTeamAndSeat(players: Player[], newPlayerId: string): { teamIndex: number; seatIndex: number } {
  const seatIndex = players.length;
  // Alternate teams: 0,1,0,1...
  const teamIndex = seatIndex % 2;
  return { teamIndex, seatIndex };
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('create_room', (playerName: string, configPartial: Partial<GameConfig>) => {
    const roomId = generateRoomCode();
    const playerId = uuidv4();
    const config: GameConfig = {
      deckCount: 1,
      targetScore: 500,
      allowNil: true,
      allowBlindNil: true,
      playerCount: 4,
      ...configPartial,
    };

    const state = createInitialState(roomId, config);
    const player: Player = {
      id: playerId,
      name: playerName,
      teamIndex: 0,
      seatIndex: 0,
      connected: true,
    };
    state.players.push(player);

    rooms.set(roomId, state);
    socketToRoom.set(socket.id, roomId);
    socketToPlayer.set(socket.id, playerId);

    socket.join(roomId);
    socket.emit('joined_room', roomId, playerId);
    broadcastState(roomId);
  });

  socket.on('join_room', (roomId: string, playerName: string) => {
    const state = rooms.get(roomId);
    if (!state) {
      socket.emit('error', 'Room not found');
      return;
    }
    if (state.phase !== 'waiting') {
      socket.emit('error', 'Game already in progress');
      return;
    }
    if (state.players.length >= state.config.playerCount) {
      socket.emit('error', 'Room is full');
      return;
    }

    const playerId = uuidv4();
    const { teamIndex, seatIndex } = assignTeamAndSeat(state.players, playerId);
    const player: Player = { id: playerId, name: playerName, teamIndex, seatIndex, connected: true };
    state.players.push(player);

    socketToRoom.set(socket.id, roomId);
    socketToPlayer.set(socket.id, playerId);

    socket.join(roomId);
    socket.emit('joined_room', roomId, playerId);
    broadcastState(roomId);
  });

  socket.on('rejoin_room', (roomId: string, playerId: string) => {
    const state = rooms.get(roomId);
    if (!state) { socket.emit('error', 'Room not found'); return; }
    const player = state.players.find(p => p.id === playerId);
    if (!player) { socket.emit('error', 'Player not found'); return; }

    player.connected = true;
    socketToRoom.set(socket.id, roomId);
    socketToPlayer.set(socket.id, playerId);
    socket.join(roomId);
    socket.emit('joined_room', roomId, playerId);
    broadcastState(roomId);
  });

  socket.on('start_game', () => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const state = rooms.get(roomId);
    if (!state) return;
    if (state.phase !== 'waiting') { socket.emit('error', 'Game already started'); return; }
    if (state.players.length < 2) { socket.emit('error', 'Need at least 2 players'); return; }

    const dealt = dealCards(state);
    rooms.set(roomId, dealt);
    broadcastState(roomId);
  });

  socket.on('place_bid', (bid: BidValue) => {
    const roomId = socketToRoom.get(socket.id);
    const playerId = socketToPlayer.get(socket.id);
    if (!roomId || !playerId) return;
    const state = rooms.get(roomId);
    if (!state) return;

    if (!isValidBid(state, playerId, bid)) {
      socket.emit('error', 'Invalid bid');
      return;
    }

    const newState = placeBid(state, playerId, bid);
    rooms.set(roomId, newState);
    broadcastState(roomId);
  });

  socket.on('play_card', (cardId: string) => {
    const roomId = socketToRoom.get(socket.id);
    const playerId = socketToPlayer.get(socket.id);
    if (!roomId || !playerId) return;
    const state = rooms.get(roomId);
    if (!state) return;

    if (!isValidPlay(state, playerId, cardId)) {
      socket.emit('error', 'Invalid play');
      return;
    }

    const newState = playCard(state, playerId, cardId);
    rooms.set(roomId, newState);
    broadcastState(roomId);
  });

  socket.on('next_round', () => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const state = rooms.get(roomId);
    if (!state || state.phase !== 'scoring') return;

    const newState = startNextRound(state);
    rooms.set(roomId, newState);
    broadcastState(roomId);
  });

  socket.on('disconnect', () => {
    const roomId = socketToRoom.get(socket.id);
    const playerId = socketToPlayer.get(socket.id);
    if (roomId && playerId) {
      const state = rooms.get(roomId);
      if (state) {
        const player = state.players.find(p => p.id === playerId);
        if (player) player.connected = false;
        broadcastState(roomId);
      }
    }
    socketToRoom.delete(socket.id);
    socketToPlayer.delete(socket.id);
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// REST: list rooms (for lobby)
app.get('/rooms', (req, res) => {
  const list = Array.from(rooms.entries())
    .filter(([, s]) => s.phase === 'waiting')
    .map(([id, s]) => ({
      id,
      players: s.players.length,
      maxPlayers: s.config.playerCount,
      targetScore: s.config.targetScore,
    }));
  res.json(list);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`🃏 Spades server running on port ${PORT}`));
