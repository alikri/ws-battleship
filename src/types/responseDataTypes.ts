import { Position, Ship, Users } from './types';

export interface RegistrationData {
  name: string;
  index: number;
  error: boolean;
  errorText: string;
}

export interface UpdateRoomData {
  roomId: number;
  roomUsers: Users[];
}

export interface UpdateWinnersData {
  name: string;
  wins: number;
}

export interface CreateGameData {
  idGame: number;
  idPlayer: number;
}

export interface StartGameData {
  ships: Ship[];
  currentPlayerIndex: number;
}

export interface PlayerTurnData {
  currentPlayer: number;
}

export interface AttackFeedbackData {
  position: Position;
  status: string;
  currentPlayer: number;
}

export interface FinishGameData {
  winPlayer: number;
}
