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
    const cellProcessed =
      this.hits.some((hit) => hit.x === x && hit.y === y) || this.misses.some((miss) => miss.x === x && miss.y === y);
    if (cellProcessed) {
      console.log(`Cell: (${x}, ${y}) is already processed.`);
    }
    let attackResult: Status = Status.miss;
    this.ships.forEach((ship) => {
      if (ship.isHit(x, y)) {
        if (!cellProcessed) {
          this.hits.push({ x, y });
        }
        if (ship.isKilled()) {
          if (!cellProcessed) {
            this.cellsAroundForKilledShip = ship.cellsAround.filter(
              (cell) =>
                !this.hits.some((hit) => hit.x === cell.x && hit.y === cell.y) &&
                !this.misses.some((miss) => miss.x === cell.x && miss.y === cell.y),
            );
            this.cellsAroundForKilledShip = ship.cellsAround;
            this.shipsKilled += 1;
            this.currentKilledShip = ship;
          }
          attackResult = Status.killed;
        } else {
          attackResult = Status.shot;
        }
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
