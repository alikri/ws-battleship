import { WebSocket } from 'ws';

export class Player {
  name: string;
  password: string;
  index: number;
  ws: WebSocket;

  constructor(name: string, password: string, ws: WebSocket, index: number) {
    this.password = password;
    this.name = name;
    this.index = index;
    this.ws = ws;
  }
}
