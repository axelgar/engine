import { describe, it, expect } from 'vitest';
import { CollisionSystem } from '../../src/collision/CollisionSystem.js';
import { Entity } from '../../src/entity/Entity.js';
import { Rectangle } from '../../src/math/Rectangle.js';
import { Vector2 } from '../../src/math/Vector2.js';

describe('CollisionSystem', () => {
  const collision = new CollisionSystem();

  it('detects overlap between two entities', () => {
    const a = new Entity(0, 0);
    a.bounds = new Rectangle(0, 0, 16, 16);

    const b = new Entity(8, 8);
    b.bounds = new Rectangle(0, 0, 16, 16);

    expect(collision.entitiesOverlap(a, b)).toBe(true);
  });

  it('detects no overlap when entities are apart', () => {
    const a = new Entity(0, 0);
    a.bounds = new Rectangle(0, 0, 16, 16);

    const b = new Entity(100, 100);
    b.bounds = new Rectangle(0, 0, 16, 16);

    expect(collision.entitiesOverlap(a, b)).toBe(false);
  });

  it('returns false for entities without bounds', () => {
    const a = new Entity(0, 0);
    const b = new Entity(0, 0);

    expect(collision.entitiesOverlap(a, b)).toBe(false);
  });

  it('finds overlapping entities from a list', () => {
    const player = new Entity(10, 10);
    player.bounds = new Rectangle(0, 0, 16, 16);

    const enemy1 = new Entity(12, 12);
    enemy1.bounds = new Rectangle(0, 0, 16, 16);

    const enemy2 = new Entity(200, 200);
    enemy2.bounds = new Rectangle(0, 0, 16, 16);

    const result = collision.findOverlapping(player, [enemy1, enemy2]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(enemy1);
  });

  it('checks entity overlap with rectangle', () => {
    const entity = new Entity(10, 10);
    entity.bounds = new Rectangle(0, 0, 16, 16);

    const zone = new Rectangle(0, 0, 50, 50);
    expect(collision.entityOverlapsRect(entity, zone)).toBe(true);

    const farZone = new Rectangle(200, 200, 50, 50);
    expect(collision.entityOverlapsRect(entity, farZone)).toBe(false);
  });

  it('ignores inactive entities when finding overlaps', () => {
    const player = new Entity(10, 10);
    player.bounds = new Rectangle(0, 0, 16, 16);

    const enemy = new Entity(12, 12);
    enemy.bounds = new Rectangle(0, 0, 16, 16);
    enemy.active = false;

    const result = collision.findOverlapping(player, [enemy]);
    expect(result).toHaveLength(0);
  });
});
