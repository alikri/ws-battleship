import { ShipType } from 'src/types/enums';
import { Position } from 'src/types/types';

export class Ship {
  position: Position;
  direction: boolean;
  length: number;
  type: ShipType;
  hits: number;
  occupiedCells: Position[];
  cellsAround: Position[];
  hitPositions: Position[];

  constructor(position: Position, direction: boolean, length: number, type: ShipType) {
    this.hitPositions = [];
    this.position = position;
    this.direction = direction;
    this.length = length;
    this.type = type;
    this.hits = 0;
    this.occupiedCells = [];
    this.cellsAround = [];
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
      this.hitPositions.push({ x, y });
      return true;
    }
    return false;
  }

  isKilled(): boolean {
    if (this.hits >= this.length) {
      this.markSurroundingCellsAsMisses();
      return true;
    } else {
      return false;
    }
  }

  markSurroundingCellsAsMisses() {
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

    this.cellsAround = [];

    this.occupiedCells.forEach((occupiedCell) => {
      directions.forEach(({ dx, dy }) => {
        const cellToCheck = { x: occupiedCell.x + dx, y: occupiedCell.y + dy };
        if (
          !this.occupiedCells.some((oc) => oc.x === cellToCheck.x && oc.y === cellToCheck.y) &&
          !this.cellsAround.some((ca) => ca.x === cellToCheck.x && ca.y === cellToCheck.y)
        ) {
          this.cellsAround.push(cellToCheck);
        }
      });
    });
  }
}
