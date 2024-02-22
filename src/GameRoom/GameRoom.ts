import { Player } from '../Player/Player';
import { GameBoard } from 'src/GameBoard/GameBoard';
import { Ship } from 'src/Ship/Ship';
import { generateRandomId } from 'src/utils/generateRandomId';

export enum Type {
  small = 'small',
  medium = 'medium',
  large = 'large',
  huge = 'huge',
}

export class GameRoom {
  players: Player[] = [];
  roomId: string;
  gameStarted: boolean = false;
  gameCreated: boolean = false;
  currentPlayerIndex: number;
  gameBoards: Map<number, GameBoard> = new Map();

  constructor() {
    this.roomId = generateRandomId();
  }

  addPlayer(player: Player): boolean {
    if (this.players.length < 2) {
      this.players.push(player);
      this.gameBoards.set(player.index, new GameBoard());
      if (this.players.length === 2) {
        this.gameCreated = true;
      } else if (this.players.length === 1) {
        this.currentPlayerIndex = player.index;
      }
      return true;
    }
    return false;
  }

  isFull(): boolean {
    return this.players.length === 2;
  }

  handleShipSubmission(playerIndex: number, shipsData: Ship[]) {
    const gameBoard = this.gameBoards.get(playerIndex);

    if (!gameBoard) {
      console.log('Game board not found for playerIndex:', playerIndex);
      return;
    }

    shipsData.forEach((shipData) => {
      const ship = new Ship(shipData.position, shipData.direction, shipData.length, shipData.type);
      gameBoard.addShip(ship);
    });

    gameBoard.finalizeShipPlacement();

    if (this.startGameWhenReady()) {
      this.gameStarted = true;
    }
  }

  private startGameWhenReady() {
    const result = Array.from(this.gameBoards.values()).every((board) => board.shipsSubmitted);
    return result;
  }

  getShipsDataForPlayer(playerIndex: number): {
    position: { x: number; y: number };
    direction: boolean;
    length: number;
    type: Type;
  }[] {
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

  handleAttack(x: number, y: number, attackerIndex: number) {
    if (this.currentPlayerIndex !== attackerIndex) {
      console.log(this.currentPlayerIndex, 'current');
      console.log(attackerIndex, 'index that sent request');
      console.log("It's not the player's turn.");
      return;
    } else {
      console.log('attacker = ' + attackerIndex);
    }

    const opponentIndex = Array.from(this.gameBoards.keys()).find((key) => key !== attackerIndex);
    if (opponentIndex === undefined) {
      console.log("Opponent's game board not found.");
      return;
    }

    const result = this.gameBoards.get(opponentIndex)?.processAttack(x, y);
    if (result === undefined) {
      console.log('Failed to process attack.');
      return;
    }

    const attackFeedback = {
      position: { x, y },
      status: result,
      currentPlayer: this.currentPlayerIndex,
    };

    this.currentPlayerIndex = opponentIndex;

    return attackFeedback;
  }
}
