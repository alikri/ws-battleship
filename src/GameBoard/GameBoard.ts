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
        attackResult = ship.isKilled() ? Status.killed : Status.shot;
        this.hits.push({ x, y });
      }
    });
    if (attackResult === Status.miss) {
      this.misses.push({ x, y });
    }
    return attackResult;
  }
}
