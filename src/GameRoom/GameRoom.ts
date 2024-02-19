import { EventEmitter } from 'events';
import { Player } from '../Player/Player';

export class GameRoom extends EventEmitter {
  players: Player[] = [];
  roomId: number;
  gameStarted: boolean = false;
  gameCreated: boolean = false;
  currentPlayerIndex: number = 0;

  constructor(roomId: number) {
    super();
    this.roomId = roomId;
  }

  addPlayer(player: Player): boolean {
    if (this.players.length < 2) {
      this.players.push(player);
      if (this.players.length === 2) {
        this.createGame();
      }
      return true;
    }
    return false;
  }

  isFull(): boolean {
    return this.players.length === 2;
  }

  private createGame(): void {
    this.gameCreated = true;
    this.emit('game_created', this);
  }

  startGame(): void {
    this.gameStarted = true;
    this.emit('game_started', this);
  }
}
