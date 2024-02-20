import { EventEmitter } from 'events';
import { Player } from '../Player/Player';
import { GameBoard } from 'src/GameBoard/GameBoard';
import { Ship } from 'src/Ship/Ship';

export class GameRoom extends EventEmitter {
  players: Player[] = [];
  roomId: number;
  gameStarted: boolean = false;
  gameCreated: boolean = false;
  currentPlayerIndex: number = 0;
  gameBoards: Map<number, GameBoard> = new Map();

  constructor(roomId: number) {
    super();
    this.roomId = roomId;
    this.gameBoards.set(0, new GameBoard());
    this.gameBoards.set(1, new GameBoard());
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

  handleShipSubmission(playerIndex: number, shipsData: Ship[]) {
    const gameBoard = this.gameBoards.get(playerIndex);

    if (!gameBoard) {
      console.error('Game board not found for playerIndex:', playerIndex);
      return;
    }

    shipsData.forEach((shipData) => {
      const ship = new Ship(shipData.position, shipData.direction, shipData.length, shipData.type);
      gameBoard.addShip(ship);
    });

    gameBoard.finalizeShipPlacement();

    if (this.startGameWhenReady()) {
      this.gameStarted = true;
      this.emit('start_game', this);
    }
  }

  private startGameWhenReady() {
    const result = Array.from(this.gameBoards.values()).every((board) => board.shipsSubmitted);
    console.log(result, 'result');
    return result;
  }

  getShipsDataForPlayer(playerIndex: number): Ship[] {
    const gameBoard = this.gameBoards.get(playerIndex);
    if (!gameBoard) {
      return [];
    }

    return gameBoard.ships.map((ship) => ({
      position: ship.position,
      direction: ship.direction,
      length: ship.length,
      type: ship.type,
    }));
  }
}
