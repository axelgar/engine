import { Rectangle } from '../math/Rectangle.js';
import { Vector2 } from '../math/Vector2.js';
import type { Texture } from './Texture.js';

/**
 * Sprite data for rendering. Describes how to draw a textured quad.
 */
export class Sprite {
  /** The texture to sample from. */
  texture: Texture;
  /** Source region within the texture (in pixels). Null = full texture. */
  sourceRect: Rectangle | null;
  /** World position. */
  position: Vector2;
  /** Origin point for rotation/scaling (0-1 range). Default: (0.5, 0.5) = center. */
  origin: Vector2;
  /** Scale factor. */
  scale: Vector2;
  /** Rotation in radians. */
  rotation: number;
  /** Tint color [r, g, b] (0-1 range). */
  tint: [number, number, number];
  /** Opacity (0-1). */
  opacity: number;
  /** Flip horizontally. */
  flipX: boolean;
  /** Flip vertically. */
  flipY: boolean;

  constructor(texture: Texture, options: Partial<SpriteOptions> = {}) {
    this.texture = texture;
    this.sourceRect = options.sourceRect ?? null;
    this.position = options.position ?? Vector2.ZERO;
    this.origin = options.origin ?? new Vector2(0.5, 0.5);
    this.scale = options.scale ?? Vector2.ONE;
    this.rotation = options.rotation ?? 0;
    this.tint = options.tint ?? [1, 1, 1];
    this.opacity = options.opacity ?? 1;
    this.flipX = options.flipX ?? false;
    this.flipY = options.flipY ?? false;
  }

  get width(): number {
    return this.sourceRect?.width ?? this.texture.width;
  }

  get height(): number {
    return this.sourceRect?.height ?? this.texture.height;
  }
}

export interface SpriteOptions {
  sourceRect: Rectangle;
  position: Vector2;
  origin: Vector2;
  scale: Vector2;
  rotation: number;
  tint: [number, number, number];
  opacity: number;
  flipX: boolean;
  flipY: boolean;
}
