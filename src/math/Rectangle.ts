import { Vector2 } from './Vector2.js';

/**
 * Axis-aligned bounding box.
 */
export class Rectangle {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly width: number,
    public readonly height: number,
  ) {}

  static fromPoints(topLeft: Vector2, bottomRight: Vector2): Rectangle {
    return new Rectangle(
      topLeft.x,
      topLeft.y,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y,
    );
  }

  get left(): number {
    return this.x;
  }

  get right(): number {
    return this.x + this.width;
  }

  get top(): number {
    return this.y;
  }

  get bottom(): number {
    return this.y + this.height;
  }

  get center(): Vector2 {
    return new Vector2(this.x + this.width / 2, this.y + this.height / 2);
  }

  get topLeft(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  get bottomRight(): Vector2 {
    return new Vector2(this.right, this.bottom);
  }

  get size(): Vector2 {
    return new Vector2(this.width, this.height);
  }

  contains(point: Vector2): boolean {
    return (
      point.x >= this.x &&
      point.x <= this.right &&
      point.y >= this.y &&
      point.y <= this.bottom
    );
  }

  intersects(other: Rectangle): boolean {
    return (
      this.x < other.right &&
      this.right > other.x &&
      this.y < other.bottom &&
      this.bottom > other.y
    );
  }

  overlap(other: Rectangle): Rectangle | null {
    const x = Math.max(this.x, other.x);
    const y = Math.max(this.y, other.y);
    const right = Math.min(this.right, other.right);
    const bottom = Math.min(this.bottom, other.bottom);

    if (right <= x || bottom <= y) return null;

    return new Rectangle(x, y, right - x, bottom - y);
  }

  expand(amount: number): Rectangle {
    return new Rectangle(
      this.x - amount,
      this.y - amount,
      this.width + amount * 2,
      this.height + amount * 2,
    );
  }

  translate(offset: Vector2): Rectangle {
    return new Rectangle(
      this.x + offset.x,
      this.y + offset.y,
      this.width,
      this.height,
    );
  }

  equals(other: Rectangle, epsilon = 1e-6): boolean {
    return (
      Math.abs(this.x - other.x) < epsilon &&
      Math.abs(this.y - other.y) < epsilon &&
      Math.abs(this.width - other.width) < epsilon &&
      Math.abs(this.height - other.height) < epsilon
    );
  }

  toString(): string {
    return `Rectangle(${this.x}, ${this.y}, ${this.width}, ${this.height})`;
  }
}
