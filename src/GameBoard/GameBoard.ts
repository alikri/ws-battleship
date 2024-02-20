import { Ship } from 'src/Ship/Ship';

export class GameBoard {
  ships: Ship[] = [];
  shipsSubmitted: boolean = false;

  addShip(ship: Ship) {
    this.ships.push(ship);
  }

  finalizeShipPlacement() {
    this.shipsSubmitted = true;
  }
}
