import { WebSocket } from 'ws';

export class Player {
  name: string;
  password: string;
  index: number;
  ws: WebSocket;
  currentlyInRoomId: number | null = null;

  constructor(name: string, password: string, ws: WebSocket, index: number) {
    this.password = password;
    this.name = name;
    this.index = index;
    this.ws = ws;
  }

  updatePassword(newPassword: string) {
    this.password = newPassword;
  }

  updateWebSocket(newWebSocket: WebSocket) {
    this.ws = newWebSocket;
  }
}
