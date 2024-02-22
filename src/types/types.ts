import { ShipType } from './enums';

export interface WebSocketMessage<T> {
  type: string;
  data: T;
  id: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Ship {
  position: Position;
  direction: boolean;
  length: number;
  type: ShipType;
}

export interface Users {
  name: string;
  index: number;
}
