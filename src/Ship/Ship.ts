import { ShipType } from 'src/GameRoom/GameRoom';

export class Ship {
  position: { x: number; y: number };
  direction: boolean;
  length: number;
  type: ShipType;
  hits: number;
  occupiedCells: { x: number; y: number }[];
  constructor(position: { x: number; y: number }, direction: boolean, length: number, type: ShipType) {
    this.position = position;
    this.direction = direction;
    this.length = length;
    this.type = type;
    this.hits = 0;
    this.occupiedCells = [];
    this.calculateOccupiedCells();
  }

  calculateOccupiedCells() {
    for (let i = 0; i < this.length; i++) {
      const cell = this.direction
        ? { x: this.position.x, y: this.position.y + i }
        : { x: this.position.x + i, y: this.position.y };
      this.occupiedCells.push(cell);
    }
  }

  isHit(x: number, y: number): boolean {
    const hitCell = this.occupiedCells.find((cell) => cell.x === x && cell.y === y);
    if (hitCell) {
      this.hits++;
      return true;
    }
    return false;
  }

  isKilled(): boolean {
    return this.hits >= this.length;
  }
}
