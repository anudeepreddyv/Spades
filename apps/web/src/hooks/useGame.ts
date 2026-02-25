import { useState, useEffect, useCallback } from 'react';
import { PublicGameState, BidValue, GameConfig } from '@spades/shared';
import { getSocket } from '../lib/socket';

export interface GameSession {
  roomId: string | null;
  playerId: string | null;
  gameState: PublicGameState | null;
  error: string | null;
  connected: boolean;
}

export function useGame() {
  const [session, setSession] = useState<GameSession>({
    roomId: null,
    playerId: null,
    gameState: null,
    error: null,
    connected: false,
  });

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => setSession(s => ({ ...s, connected: true })));
    socket.on('disconnect', () => setSession(s => ({ ...s, connected: false })));

    socket.on('joined_room', (roomId: string, playerId: string) => {
      // Persist for reconnection
      localStorage.setItem('spades_room', roomId);
      localStorage.setItem('spades_player', playerId);
      setSession(s => ({ ...s, roomId, playerId, error: null }));
    });

    socket.on('game_state', (state: PublicGameState) => {
      setSession(s => ({ ...s, gameState: state }));
    });

    socket.on('error', (msg: string) => {
      setSession(s => ({ ...s, error: msg }));
    });

    // Try to rejoin on load
    const savedRoom = localStorage.getItem('spades_room');
    const savedPlayer = localStorage.getItem('spades_player');
    if (savedRoom && savedPlayer) {
      socket.emit('rejoin_room', savedRoom, savedPlayer);
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('joined_room');
      socket.off('game_state');
      socket.off('error');
    };
  }, []);

  const createRoom = useCallback((playerName: string, config: Partial<GameConfig>) => {
    getSocket().emit('create_room', playerName, config);
  }, []);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    getSocket().emit('join_room', roomId.toUpperCase(), playerName);
  }, []);

  const startGame = useCallback(() => {
    getSocket().emit('start_game');
  }, []);

  const placeBid = useCallback((bid: BidValue) => {
    getSocket().emit('place_bid', bid);
  }, []);

  const playCard = useCallback((cardId: string) => {
    getSocket().emit('play_card', cardId);
  }, []);

  const nextRound = useCallback(() => {
    getSocket().emit('next_round');
  }, []);

  const leaveGame = useCallback(() => {
    localStorage.removeItem('spades_room');
    localStorage.removeItem('spades_player');
    setSession({ roomId: null, playerId: null, gameState: null, error: null, connected: true });
  }, []);

  return { session, createRoom, joinRoom, startGame, placeBid, playCard, nextRound, leaveGame };
}
