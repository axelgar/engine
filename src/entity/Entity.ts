import { Rectangle } from '../math/Rectangle.js';
import { Vector2 } from '../math/Vector2.js';
import type { Sprite } from '../rendering/Sprite.js';
import type { SpriteBatch } from '../rendering/SpriteBatch.js';
import type { Component } from './Component.js';

/**
 * A game entity with a position, optional sprite, and attachable components.
 */
export class Entity {
  position: Vector2;
  velocity: Vector2 = Vector2.ZERO;
  sprite: Sprite | null = null;
  active = true;
  tags: Set<string> = new Set();

  private components = new Map<string, Component>();
  private _bounds: Rectangle | null = null;

  constructor(x = 0, y = 0) {
    this.position = new Vector2(x, y);
  }

  /**
   * Add a component to this entity.
   */
  addComponent<T extends Component>(name: string, component: T): T {
    component.entity = this;
    this.components.set(name, component);
    component.init?.();
    return component;
  }

  /**
   * Get a component by name.
   */
  getComponent<T extends Component>(name: string): T {
    const c = this.components.get(name);
    if (!c) throw new Error(`Component "${name}" not found on entity`);
    return c as T;
  }

  /**
   * Check if this entity has a component.
   */
  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  /**
   * Remove a component by name.
   */
  removeComponent(name: string): void {
    const c = this.components.get(name);
    if (c) {
      c.destroy?.();
      this.components.delete(name);
    }
  }

  /**
   * Update all components and apply velocity.
   */
  update(dt: number): void {
    if (!this.active) return;

    for (const c of this.components.values()) {
      c.update?.(dt);
    }

    if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      this.position = this.position.add(this.velocity.scale(dt));
    }
  }

  /**
   * Draw the entity's sprite.
   */
  draw(batch: SpriteBatch): void {
    if (!this.active || !this.sprite) return;
    this.sprite.position = this.position;
    batch.draw(this.sprite);
  }

  /**
   * Set the bounding box for collision (relative to position).
   */
  set bounds(rect: Rectangle | null) {
    this._bounds = rect;
  }

  /**
   * Get the world-space bounding box.
   */
  get bounds(): Rectangle | null {
    if (!this._bounds) return null;
    return this._bounds.translate(this.position);
  }

  /**
   * Destroy this entity and all its components.
   */
  destroy(): void {
    this.active = false;
    for (const c of this.components.values()) {
      c.destroy?.();
    }
    this.components.clear();
  }
}
