import { Rectangle } from '../math/Rectangle.js';
import { Vector2 } from '../math/Vector2.js';
import type { Entity } from '../entity/Entity.js';
import type { TileMap } from '../tilemap/TileMap.js';

export interface CollisionResult {
  collided: boolean;
  /** Displacement vector to resolve the collision. */
  resolution: Vector2;
  /** Which sides were hit. */
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

const NO_COLLISION: CollisionResult = {
  collided: false,
  resolution: Vector2.ZERO,
  left: false,
  right: false,
  top: false,
  bottom: false,
};

/**
 * Handles AABB-based collision detection against tilemaps and other entities.
 */
export class CollisionSystem {
  /**
   * Test and resolve an entity's movement against solid tiles in a tilemap.
   * Moves the entity and applies resolution. Returns collision info.
   */
  moveAndCollide(
    entity: Entity,
    velocity: Vector2,
    dt: number,
    tilemap: TileMap,
  ): CollisionResult {
    const bounds = entity.bounds;
    if (!bounds) {
      entity.position = entity.position.add(velocity.scale(dt));
      return NO_COLLISION;
    }

    let result: CollisionResult = { ...NO_COLLISION };
    const tw = tilemap.tileWidth;
    const th = tilemap.tileHeight;

    // Move X first
    const dx = velocity.x * dt;
    if (dx !== 0) {
      const newBounds = new Rectangle(bounds.x + dx, bounds.y, bounds.width, bounds.height);
      if (tilemap.rectCollidesWithTerrain(newBounds)) {
        result.collided = true;
        if (dx > 0) {
          const rightTile = Math.floor(newBounds.right / tw);
          const resolvedX = rightTile * tw - bounds.width - (bounds.x - entity.position.x);
          entity.position = new Vector2(resolvedX, entity.position.y);
          result.right = true;
        } else {
          const leftTile = Math.floor(newBounds.x / tw);
          const resolvedX = (leftTile + 1) * tw - (bounds.x - entity.position.x);
          entity.position = new Vector2(resolvedX, entity.position.y);
          result.left = true;
        }
      } else {
        entity.position = new Vector2(entity.position.x + dx, entity.position.y);
      }
    }

    // Move Y
    const dy = velocity.y * dt;
    if (dy !== 0) {
      const currentBounds = entity.bounds!;
      const newBounds = new Rectangle(currentBounds.x, currentBounds.y + dy, currentBounds.width, currentBounds.height);
      if (tilemap.rectCollidesWithTerrain(newBounds)) {
        result.collided = true;
        if (dy > 0) {
          const bottomTile = Math.floor(newBounds.bottom / th);
          const resolvedY = bottomTile * th - currentBounds.height - (currentBounds.y - entity.position.y);
          entity.position = new Vector2(entity.position.x, resolvedY);
          result.bottom = true;
        } else {
          const topTile = Math.floor(newBounds.y / th);
          const resolvedY = (topTile + 1) * th - (currentBounds.y - entity.position.y);
          entity.position = new Vector2(entity.position.x, resolvedY);
          result.top = true;
        }
      } else {
        entity.position = new Vector2(entity.position.x, entity.position.y + dy);
      }
    }

    result.resolution = entity.position.sub(
      new Vector2(bounds.x - (bounds.x - entity.position.x), bounds.y - (bounds.y - entity.position.y)),
    );

    return result;
  }

  /**
   * Check AABB overlap between two entities.
   */
  entitiesOverlap(a: Entity, b: Entity): boolean {
    const boundsA = a.bounds;
    const boundsB = b.bounds;
    if (!boundsA || !boundsB) return false;
    return boundsA.intersects(boundsB);
  }

  /**
   * Check overlap between an entity and a rectangle.
   */
  entityOverlapsRect(entity: Entity, rect: Rectangle): boolean {
    const bounds = entity.bounds;
    if (!bounds) return false;
    return bounds.intersects(rect);
  }

  /**
   * Find all entities from a list that overlap with the given entity.
   */
  findOverlapping(entity: Entity, others: Entity[]): Entity[] {
    return others.filter(
      (other) => other !== entity && other.active && this.entitiesOverlap(entity, other),
    );
  }
}
