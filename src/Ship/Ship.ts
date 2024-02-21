import { Type } from 'src/GameRoom/GameRoom';

export class Ship {
  position: { x: number; y: number };
  direction: boolean;
  length: number;
  type: Type;
  hits: number;

  constructor(position: { x: number; y: number }, direction: boolean, length: number, type: Type) {
    this.position = position;
    this.direction = direction;
    this.length = length;
    this.type = type;
    this.hits = 0;
  }

  isHit(x: number, y: number): boolean {
    for (let i = 0; i < this.length; i++) {
      const currentPos = this.direction
        ? { x: this.position.x + i, y: this.position.y }
        : { x: this.position.x, y: this.position.y + i };
      if (currentPos.x === x && currentPos.y === y) {
        this.hits++;
        return true;
      }
    }
    return false;
  }

  isKilled(): boolean {
    return this.hits >= this.length;
  }
}
