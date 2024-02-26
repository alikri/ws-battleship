import { ShipType, Status } from './enums';
import { AttackFeedbackData } from './responseDataTypes';

export interface WebSocketMessage<T> {
  type: string;
  data: T;
  id: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface ShipData {
  position: Position;
  direction: boolean;
  length: number;
  type: ShipType;
}

export interface Users {
  name: string;
  index: number;
}

export interface WinnerInternal {
  index: number;
  name: string;
  wins: number;
}

export interface AttackFeedbackKilled {
  feedback: AttackFeedbackData & { status: Status.killed };
  killedShipPositions: Position[] | null | undefined;
  cellsAround: Position[];
}

interface AttackFeedbackMissOrShot {
  feedback: AttackFeedbackData & { status: Status.miss | Status.shot };
  killedShipPositions: Position[] | null | undefined;
  cellsAround: never[];
}

export type AttackFeedback = AttackFeedbackKilled | AttackFeedbackMissOrShot | undefined;
