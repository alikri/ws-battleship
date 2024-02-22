import { Ship } from 'src/Ship/Ship';

export enum Status {
  miss = 'miss',
  shot = 'shot',
  killed = 'killed',
}

export class GameBoard {
  ships: Ship[] = [];
  shipsSubmitted: boolean = false;
  hits: { x: number; y: number }[] = [];
  misses: { x: number; y: number }[] = [];

  addShip(ship: Ship) {
    this.ships.push(ship);
  }

  finalizeShipPlacement() {
    this.shipsSubmitted = true;
  }

  processAttack(x: number, y: number): Status {
    let attackResult: Status = Status.miss;
    this.ships.forEach((ship) => {
      if (ship.isHit(x, y)) {
        if (ship.isKilled()) {
          attackResult = Status.killed;
          this.markSurroundingCellsAsMisses(ship);
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

  markSurroundingCellsAsMisses(ship: Ship) {
    const directions = [
      { dx: -1, dy: -1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: 1 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
    ];

    for (let i = 0; i <= ship.length; i++) {
      directions.forEach(({ dx, dy }) => {
        const cellToCheck = ship.direction
          ? { x: ship.position.x + i + dx, y: ship.position.y + dy }
          : { x: ship.position.x + dx, y: ship.position.y + i + dy };

        if (!this.isCellAlreadyMarked(cellToCheck)) {
          this.misses.push(cellToCheck);
        }
      });
    }
  }

  isCellAlreadyMarked(cell: { x: number; y: number }): boolean {
    return this.hits.concat(this.misses).some((hitOrMiss) => hitOrMiss.x === cell.x && hitOrMiss.y === cell.y);
  }
}
