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
  cellsAroundForKilledShip: { x: number; y: number }[] = [];

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
          this.cellsAroundForKilledShip = ship.cellsAround;
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
}
