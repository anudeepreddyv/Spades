import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  GameState, GameConfig, Player, TeamMode,
  createInitialState, dealCards, placeBid, playCard,
  isValidBid, isValidPlay, startNextRound, BidValue,
  assignTeams, getTeamCount,
} from '@spades/shared';
import { getComputerBid, getComputerPlay } from './computer';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const rooms = new Map<string, GameState>();
const socketToRoom = new Map<string, string>();
const socketToPlayer = new Map<string, string>();

// Track which players are computers (by playerId)
const computerPlayers = new Set<string>();

function getPublicState(state: GameState, playerId: string) {
  const { hands, ...rest } = state;
  return { ...rest, myHand: hands[playerId] || [], myPlayerId: playerId };
}

function broadcastState(roomId: string) {
  const state = rooms.get(roomId);
  if (!state) return;
  io.in(roomId).fetchSockets().then(sockets => {
    for (const s of sockets) {
      const pid = socketToPlayer.get(s.id);
      if (pid) s.emit('game_state', getPublicState(state, pid));
    }
  });
}

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

// ── Computer player action loop ───────────────────────────────────────────────
// After every state change, check if the current turn belongs to a computer.
// Add a short delay so the human can see what's happening.

function scheduleComputerAction(roomId: string, delayMs = 900) {
  setTimeout(() => {
    const state = rooms.get(roomId);
    if (!state) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || !computerPlayers.has(currentPlayer.id)) return;

    let newState: GameState | null = null;

    if (state.phase === 'bidding') {
      const bid = getComputerBid(state, currentPlayer.id);
      if (isValidBid(state, currentPlayer.id, bid)) {
        newState = placeBid(state, currentPlayer.id, bid);
      }
    } else if (state.phase === 'playing') {
      const cardId = getComputerPlay(state, currentPlayer.id);
      if (cardId && isValidPlay(state, currentPlayer.id, cardId)) {
        newState = playCard(state, currentPlayer.id, cardId);
      }
    }

    if (newState) {
      rooms.set(roomId, newState);
      broadcastState(roomId);
      // If trick just completed (currentTrick reset to []), wait 3.5s for client freeze to show
      // Otherwise chain quickly if next player is also computer
      const trickJustDone = state.phase === 'playing' &&
        state.currentTrick.length === state.players.length - 1 &&
        newState.currentTrick.length === 0;
      scheduleComputerAction(roomId, trickJustDone ? 3500 : 900);
    }
  }, delayMs);
}

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('create_room', (playerName: string, configPartial: Partial<GameConfig> & { vsComputer?: boolean }) => {
    const roomId = generateRoomCode();
    const playerId = uuidv4();
    const vsComputer = configPartial.vsComputer ?? false;

    // vs Computer mode forces 2-player individual
    const playerCount = vsComputer ? 2 : (configPartial.playerCount || 4);
    const teamMode: TeamMode = vsComputer ? 'individual' : (configPartial.teamMode || (playerCount % 2 === 1 ? 'individual' : 'two_teams'));

    const config: GameConfig = {
      ...(vsComputer ? {} : configPartial),
      playerCount,
      teamMode,
      numTeams: vsComputer ? undefined : configPartial.numTeams,
    };

    const state = createInitialState(roomId, config, playerCount);
    const humanPlayer: Player = { id: playerId, name: playerName, teamIndex: 0, seatIndex: 0, connected: true };
    state.players.push(humanPlayer);

    // Add computer player if vs computer mode
    if (vsComputer) {
      const computerId = uuidv4();
      const computerPlayer: Player = { id: computerId, name: 'CPU', teamIndex: 1, seatIndex: 1, connected: true };
      state.players.push(computerPlayer);
      computerPlayers.add(computerId);
    }

    rooms.set(roomId, state);
    socketToRoom.set(socket.id, roomId);
    socketToPlayer.set(socket.id, playerId);

    socket.join(roomId);
    socket.emit('joined_room', roomId, playerId);
    broadcastState(roomId);
  });

  socket.on('join_room', (roomId: string, playerName: string) => {
    const state = rooms.get(roomId);
    if (!state) { socket.emit('error', 'Room not found'); return; }
    if (state.phase !== 'waiting') { socket.emit('error', 'Game already in progress'); return; }
    if (state.players.length >= state.config.playerCount) { socket.emit('error', 'Room is full'); return; }

    const playerId = uuidv4();
    const seatIndex = state.players.length;
    const player: Player = { id: playerId, name: playerName, teamIndex: seatIndex % 2, seatIndex, connected: true };
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

    const assignedPlayers = assignTeams(state.players, state.config.teamMode, state.players.length, state.config.numTeams);
    const teamCount = getTeamCount(state.config.teamMode, state.players.length, state.config.numTeams);

    const dealt = dealCards({
      ...state,
      players: assignedPlayers,
      teamScores: Array.from({ length: teamCount }, () => ({ score: 0, bags: 0, bids: 0, tricks: 0, roundScores: [], roundHistory: [] as any[] })),
    });
    rooms.set(roomId, dealt);
    broadcastState(roomId);
    scheduleComputerAction(roomId);
  });

  socket.on('place_bid', (bid: BidValue) => {
    const roomId = socketToRoom.get(socket.id);
    const playerId = socketToPlayer.get(socket.id);
    if (!roomId || !playerId) return;
    const state = rooms.get(roomId);
    if (!state) return;
    if (!isValidBid(state, playerId, bid)) { socket.emit('error', 'Invalid bid'); return; }
    const newState = placeBid(state, playerId, bid);
    rooms.set(roomId, newState);
    broadcastState(roomId);
    scheduleComputerAction(roomId);
  });

  socket.on('play_card', (cardId: string) => {
    const roomId = socketToRoom.get(socket.id);
    const playerId = socketToPlayer.get(socket.id);
    if (!roomId || !playerId) return;
    const state = rooms.get(roomId);
    if (!state) return;
    if (!isValidPlay(state, playerId, cardId)) { socket.emit('error', 'Invalid play'); return; }
    const newState = playCard(state, playerId, cardId);
    rooms.set(roomId, newState);
    broadcastState(roomId);
    scheduleComputerAction(roomId);
  });

  socket.on('next_round', () => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const state = rooms.get(roomId);
    if (!state || state.phase !== 'scoring') return;
    const newState = startNextRound(state);
    rooms.set(roomId, newState);
    broadcastState(roomId);
    scheduleComputerAction(roomId);
  });

  socket.on('reaction', (emoji: string) => {
    const roomId = socketToRoom.get(socket.id);
    const playerId = socketToPlayer.get(socket.id);
    if (!roomId || !playerId) return;
    const state = rooms.get(roomId);
    if (!state) return;
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    io.in(roomId).emit('player_reaction', playerId, player.name, emoji);
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
  });
});

app.get('/rooms', (req, res) => {
  const list = Array.from(rooms.entries())
    .filter(([, s]) => s.phase === 'waiting')
    .map(([id, s]) => ({ id, players: s.players.length, maxPlayers: s.config.playerCount, teamMode: s.config.teamMode }));
  res.json(list);
});

const PORT = process.env.PORT || 3001;
//httpServer.listen(PORT, () => console.log(`🃏 Spades server on port ${PORT}`));
httpServer.listen(Number(PORT), '0.0.0.0', () => console.log(`🃏 Spades server on port ${PORT}`));

