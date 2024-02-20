export class Ship {
  position: { x: number; y: number };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';

  constructor(
    position: { x: number; y: number },
    direction: boolean,
    length: number,
    type: 'small' | 'medium' | 'large' | 'huge',
  ) {
    this.position = position;
    this.direction = direction;
    this.length = length;
    this.type = type;
  }
}
