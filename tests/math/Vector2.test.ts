import { describe, it, expect } from 'vitest';
import { Vector2 } from '../../src/math/Vector2.js';

describe('Vector2', () => {
  it('constructs with default values', () => {
    const v = new Vector2();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('adds two vectors', () => {
    const a = new Vector2(1, 2);
    const b = new Vector2(3, 4);
    const result = a.add(b);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });

  it('subtracts two vectors', () => {
    const a = new Vector2(5, 7);
    const b = new Vector2(2, 3);
    const result = a.sub(b);
    expect(result.x).toBe(3);
    expect(result.y).toBe(4);
  });

  it('scales a vector', () => {
    const v = new Vector2(3, 4);
    const result = v.scale(2);
    expect(result.x).toBe(6);
    expect(result.y).toBe(8);
  });

  it('computes dot product', () => {
    const a = new Vector2(1, 2);
    const b = new Vector2(3, 4);
    expect(a.dot(b)).toBe(11);
  });

  it('computes magnitude', () => {
    const v = new Vector2(3, 4);
    expect(v.magnitude).toBe(5);
  });

  it('normalizes a vector', () => {
    const v = new Vector2(3, 4);
    const n = v.normalize();
    expect(n.magnitude).toBeCloseTo(1);
    expect(n.x).toBeCloseTo(0.6);
    expect(n.y).toBeCloseTo(0.8);
  });

  it('normalizing zero vector returns zero', () => {
    const v = Vector2.ZERO.normalize();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('computes distance', () => {
    const a = new Vector2(0, 0);
    const b = new Vector2(3, 4);
    expect(a.distance(b)).toBe(5);
  });

  it('lerps between vectors', () => {
    const a = new Vector2(0, 0);
    const b = new Vector2(10, 20);
    const mid = a.lerp(b, 0.5);
    expect(mid.x).toBe(5);
    expect(mid.y).toBe(10);
  });

  it('computes angle', () => {
    const v = new Vector2(1, 0);
    expect(v.angle()).toBe(0);
    const up = new Vector2(0, -1);
    expect(up.angle()).toBeCloseTo(-Math.PI / 2);
  });

  it('rotates a vector', () => {
    const v = new Vector2(1, 0);
    const rotated = v.rotate(Math.PI / 2);
    expect(rotated.x).toBeCloseTo(0);
    expect(rotated.y).toBeCloseTo(1);
  });

  it('negates a vector', () => {
    const v = new Vector2(3, -4);
    const neg = v.negate();
    expect(neg.x).toBe(-3);
    expect(neg.y).toBe(4);
  });

  it('checks equality with epsilon', () => {
    const a = new Vector2(1, 2);
    const b = new Vector2(1.0000001, 2.0000001);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(new Vector2(2, 2))).toBe(false);
  });

  it('converts to array', () => {
    const v = new Vector2(3, 4);
    expect(v.toArray()).toEqual([3, 4]);
  });

  it('has correct static constants', () => {
    expect(Vector2.ZERO.x).toBe(0);
    expect(Vector2.UP.y).toBe(-1);
    expect(Vector2.RIGHT.x).toBe(1);
  });
});
