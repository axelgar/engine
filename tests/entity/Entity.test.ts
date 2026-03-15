import { describe, it, expect } from 'vitest';
import { Entity } from '../../src/entity/Entity.js';
import { Vector2 } from '../../src/math/Vector2.js';
import { Rectangle } from '../../src/math/Rectangle.js';
import type { Component } from '../../src/entity/Component.js';

describe('Entity', () => {
  it('initializes with position', () => {
    const entity = new Entity(10, 20);
    expect(entity.position.x).toBe(10);
    expect(entity.position.y).toBe(20);
    expect(entity.active).toBe(true);
  });

  it('applies velocity on update', () => {
    const entity = new Entity(0, 0);
    entity.velocity = new Vector2(100, 50);
    entity.update(0.1);

    expect(entity.position.x).toBeCloseTo(10);
    expect(entity.position.y).toBeCloseTo(5);
  });

  it('adds and retrieves components', () => {
    const entity = new Entity();
    let initCalled = false;

    const component: Component = {
      entity: null as any,
      init() { initCalled = true; },
      update(_dt: number) {},
    };

    entity.addComponent('health', component);
    expect(initCalled).toBe(true);
    expect(component.entity).toBe(entity);
    expect(entity.hasComponent('health')).toBe(true);
    expect(entity.getComponent('health')).toBe(component);
  });

  it('throws when getting missing component', () => {
    const entity = new Entity();
    expect(() => entity.getComponent('missing')).toThrow('not found');
  });

  it('removes components', () => {
    const entity = new Entity();
    let destroyed = false;
    const component: Component = {
      entity: null as any,
      destroy() { destroyed = true; },
    };

    entity.addComponent('test', component);
    entity.removeComponent('test');

    expect(destroyed).toBe(true);
    expect(entity.hasComponent('test')).toBe(false);
  });

  it('updates all components', () => {
    const entity = new Entity();
    let updated = false;
    const component: Component = {
      entity: null as any,
      update() { updated = true; },
    };

    entity.addComponent('test', component);
    entity.update(1 / 60);

    expect(updated).toBe(true);
  });

  it('does not update when inactive', () => {
    const entity = new Entity();
    entity.velocity = new Vector2(100, 0);
    entity.active = false;
    entity.update(0.1);

    expect(entity.position.x).toBe(0);
  });

  it('computes world-space bounds', () => {
    const entity = new Entity(10, 20);
    entity.bounds = new Rectangle(0, 0, 16, 16);

    const worldBounds = entity.bounds!;
    expect(worldBounds.x).toBe(10);
    expect(worldBounds.y).toBe(20);
    expect(worldBounds.width).toBe(16);
    expect(worldBounds.height).toBe(16);
  });

  it('returns null bounds when none set', () => {
    const entity = new Entity();
    expect(entity.bounds).toBeNull();
  });

  it('supports tags', () => {
    const entity = new Entity();
    entity.tags.add('player');
    entity.tags.add('friendly');

    expect(entity.tags.has('player')).toBe(true);
    expect(entity.tags.has('enemy')).toBe(false);
  });

  it('destroys entity and components', () => {
    const entity = new Entity();
    let destroyed = false;
    const component: Component = {
      entity: null as any,
      destroy() { destroyed = true; },
    };

    entity.addComponent('test', component);
    entity.destroy();

    expect(destroyed).toBe(true);
    expect(entity.active).toBe(false);
  });
});
