/**
 * Immutable-style 2D vector.
 */
export class Vector2 {
  constructor(
    public readonly x: number = 0,
    public readonly y: number = 0,
  ) {}

  static readonly ZERO = new Vector2(0, 0);
  static readonly ONE = new Vector2(1, 1);
  static readonly UP = new Vector2(0, -1);
  static readonly DOWN = new Vector2(0, 1);
  static readonly LEFT = new Vector2(-1, 0);
  static readonly RIGHT = new Vector2(1, 0);

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  sub(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y;
  }

  get magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  get magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): Vector2 {
    const mag = this.magnitude;
    if (mag === 0) return Vector2.ZERO;
    return new Vector2(this.x / mag, this.y / mag);
  }

  distance(other: Vector2): number {
    return this.sub(other).magnitude;
  }

  distanceSquared(other: Vector2): number {
    return this.sub(other).magnitudeSquared;
  }

  lerp(target: Vector2, t: number): Vector2 {
    return new Vector2(
      this.x + (target.x - this.x) * t,
      this.y + (target.y - this.y) * t,
    );
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  angleTo(other: Vector2): number {
    return other.sub(this).angle();
  }

  rotate(radians: number): Vector2 {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
    );
  }

  negate(): Vector2 {
    return new Vector2(-this.x, -this.y);
  }

  equals(other: Vector2, epsilon = 1e-6): boolean {
    return (
      Math.abs(this.x - other.x) < epsilon &&
      Math.abs(this.y - other.y) < epsilon
    );
  }

  toArray(): [number, number] {
    return [this.x, this.y];
  }

  toString(): string {
    return `Vector2(${this.x}, ${this.y})`;
  }
}
