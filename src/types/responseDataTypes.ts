import { Position, ShipData, Users } from './types';

export interface RegistrationData {
  name: string;
  index: number | null;
  error: boolean;
  errorText: string;
}

export interface UpdateRoomData {
  roomId: number;
  roomUsers: Users[];
}

export interface WinnersData {
  name: string;
  wins: number;
}

export interface CreateGameData {
  idGame: number;
  idPlayer: number;
}

export interface StartGameData {
  ships: ShipData[];
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
