import { describe, it, expect } from 'vitest';
import { Rectangle } from '../../src/math/Rectangle.js';
import { Vector2 } from '../../src/math/Vector2.js';

describe('Rectangle', () => {
  it('constructs with x, y, width, height', () => {
    const r = new Rectangle(10, 20, 100, 50);
    expect(r.x).toBe(10);
    expect(r.y).toBe(20);
    expect(r.width).toBe(100);
    expect(r.height).toBe(50);
  });

  it('computes edges', () => {
    const r = new Rectangle(10, 20, 100, 50);
    expect(r.left).toBe(10);
    expect(r.right).toBe(110);
    expect(r.top).toBe(20);
    expect(r.bottom).toBe(70);
  });

  it('computes center', () => {
    const r = new Rectangle(0, 0, 100, 50);
    const c = r.center;
    expect(c.x).toBe(50);
    expect(c.y).toBe(25);
  });

  it('creates from points', () => {
    const r = Rectangle.fromPoints(new Vector2(10, 20), new Vector2(110, 70));
    expect(r.x).toBe(10);
    expect(r.y).toBe(20);
    expect(r.width).toBe(100);
    expect(r.height).toBe(50);
  });

  it('contains a point inside', () => {
    const r = new Rectangle(0, 0, 100, 100);
    expect(r.contains(new Vector2(50, 50))).toBe(true);
    expect(r.contains(new Vector2(0, 0))).toBe(true);
    expect(r.contains(new Vector2(100, 100))).toBe(true);
  });

  it('does not contain a point outside', () => {
    const r = new Rectangle(0, 0, 100, 100);
    expect(r.contains(new Vector2(-1, 50))).toBe(false);
    expect(r.contains(new Vector2(101, 50))).toBe(false);
  });

  it('detects intersection', () => {
    const a = new Rectangle(0, 0, 100, 100);
    const b = new Rectangle(50, 50, 100, 100);
    expect(a.intersects(b)).toBe(true);
    expect(b.intersects(a)).toBe(true);
  });

  it('detects non-intersection', () => {
    const a = new Rectangle(0, 0, 50, 50);
    const b = new Rectangle(100, 100, 50, 50);
    expect(a.intersects(b)).toBe(false);
  });

  it('computes overlap region', () => {
    const a = new Rectangle(0, 0, 100, 100);
    const b = new Rectangle(50, 50, 100, 100);
    const overlap = a.overlap(b);
    expect(overlap).not.toBeNull();
    expect(overlap!.x).toBe(50);
    expect(overlap!.y).toBe(50);
    expect(overlap!.width).toBe(50);
    expect(overlap!.height).toBe(50);
  });

  it('returns null for no overlap', () => {
    const a = new Rectangle(0, 0, 50, 50);
    const b = new Rectangle(100, 100, 50, 50);
    expect(a.overlap(b)).toBeNull();
  });

  it('expands a rectangle', () => {
    const r = new Rectangle(10, 10, 50, 50);
    const expanded = r.expand(5);
    expect(expanded.x).toBe(5);
    expect(expanded.y).toBe(5);
    expect(expanded.width).toBe(60);
    expect(expanded.height).toBe(60);
  });

  it('translates a rectangle', () => {
    const r = new Rectangle(10, 20, 50, 50);
    const moved = r.translate(new Vector2(5, -10));
    expect(moved.x).toBe(15);
    expect(moved.y).toBe(10);
  });

  it('checks equality', () => {
    const a = new Rectangle(1, 2, 3, 4);
    const b = new Rectangle(1, 2, 3, 4);
    expect(a.equals(b)).toBe(true);
  });
});
