import type { Entity } from './Entity.js';

/**
 * Component interface for the Entity component system.
 * Attach to entities to add behavior.
 */
export interface Component {
  /** Reference to the owning entity. Set automatically. */
  entity: Entity;
  /** Called once when added to an entity. */
  init?(): void;
  /** Called every update tick. */
  update?(dt: number): void;
  /** Called when removed from an entity or entity is destroyed. */
  destroy?(): void;
}
