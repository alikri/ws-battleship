import { Player } from '../Player/Player';
import { GameBoard, Status } from 'src/GameBoard/GameBoard';
import { Ship } from 'src/Ship/Ship';
import { generateRandomId } from 'src/utils/generateRandomId';

export enum ShipType {
  small = 'small',
  medium = 'medium',
  large = 'large',
  huge = 'huge',
}

export class GameRoom {
  private currentPlayerIndex: number;
  players: Player[] = [];
  roomId: string;
  gameStarted: boolean = false;
  gameCreated: boolean = false;
  gameFinished: boolean = false;
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

  getCurrentPlayerIndex(): number {
    return this.currentPlayerIndex;
  }

  isFull(): boolean {
    return this.players.length === 2;
  }

  handleShipsSubmission(playerIndex: number, shipsData: Ship[]) {
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
    type: ShipType;
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

    const oponentBoard = this.gameBoards.get(opponentIndex);
    if (oponentBoard === undefined) {
      console.log('Opponent board is undefined!');
      return;
    }

    const attackResult = oponentBoard.applyAttack(x, y);
    if (attackResult === undefined) {
      console.log('Failed to process attack.');
      return;
    }

    if (oponentBoard.isGameLost()) {
      this.gameFinished = true;
    }

    if (attackResult === Status.killed) {
      const attackFeedback = {
        misses: oponentBoard.cellsAroundForKilledShip,
        feedback: {
          position: { x, y },
          status: attackResult,
          currentPlayer: this.currentPlayerIndex,
        },
      };
      return attackFeedback;
    } else {
      const attackFeedback = {
        feedback: {
          position: { x, y },
          status: attackResult,
          currentPlayer: this.currentPlayerIndex,
        },
        misses: [],
      };

      if (attackResult === Status.miss) {
        this.currentPlayerIndex = opponentIndex;
      }

      return attackFeedback;
    }
  }
}
