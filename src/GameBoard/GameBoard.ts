import { Ship } from 'src/Ship/Ship';
import { Status } from 'src/types/enums';
export class GameBoard {
  ships: Ship[] = [];
  shipsSubmitted: boolean = false;
  hits: { x: number; y: number }[] = [];
  misses: { x: number; y: number }[] = [];
  shipsKilled: number = 0;
  cellsAroundForKilledShip: { x: number; y: number }[] = [];
  currentKilledShip: Ship | null = null;

  addShip(ship: Ship) {
    this.ships.push(ship);
  }

  finalizeShipPlacement() {
    this.shipsSubmitted = true;
  }

  applyAttack(x: number, y: number): Status {
    let attackResult: Status = Status.miss;
    this.ships.forEach((ship) => {
      if (ship.isHit(x, y)) {
        if (ship.isKilled()) {
          attackResult = Status.killed;
          this.cellsAroundForKilledShip = ship.cellsAround;
          this.shipsKilled += 1;
          this.currentKilledShip = ship;
        } else {
          attackResult = Status.shot;
        }
        this.hits.push({ x, y });
      }
    });
    if (attackResult === Status.miss) {
      this.misses.push({ x, y });
    }
    return attackResult;
  }

  getKilledShipPositions() {
    const currentShipKilledPositions = this.currentKilledShip?.hitPositions;
    this.currentKilledShip = null;
    if (currentShipKilledPositions) {
      return currentShipKilledPositions;
    }
    return null;
  }

  isGameLost() {
    if (this.shipsKilled >= this.ships.length) {
      return true;
    } else {
      return false;
    }
  }
}
