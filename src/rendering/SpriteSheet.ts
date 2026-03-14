import { Rectangle } from '../math/Rectangle.js';
import type { Texture } from './Texture.js';

/**
 * A sprite atlas — a single texture with named frame regions.
 */
export class SpriteSheet {
  readonly texture: Texture;
  private frames: Map<string, Rectangle>;

  constructor(texture: Texture, frames?: Record<string, Rectangle>) {
    this.texture = texture;
    this.frames = new Map(frames ? Object.entries(frames) : []);
  }

  /**
   * Create a sprite sheet from a uniform grid.
   * Frames are named "0", "1", "2", etc. left-to-right, top-to-bottom.
   */
  static fromGrid(
    texture: Texture,
    frameWidth: number,
    frameHeight: number,
    options?: { prefix?: string; count?: number },
  ): SpriteSheet {
    const cols = Math.floor(texture.width / frameWidth);
    const rows = Math.floor(texture.height / frameHeight);
    const total = options?.count ?? cols * rows;
    const prefix = options?.prefix ?? '';
    const frames: Record<string, Rectangle> = {};

    for (let i = 0; i < total; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      if (row >= rows) break;
      frames[`${prefix}${i}`] = new Rectangle(
        col * frameWidth,
        row * frameHeight,
        frameWidth,
        frameHeight,
      );
    }

    return new SpriteSheet(texture, frames);
  }

  addFrame(name: string, rect: Rectangle): void {
    this.frames.set(name, rect);
  }

  getFrame(name: string): Rectangle {
    const frame = this.frames.get(name);
    if (!frame) {
      throw new Error(`SpriteSheet frame "${name}" not found`);
    }
    return frame;
  }

  hasFrame(name: string): boolean {
    return this.frames.has(name);
  }

  get frameNames(): string[] {
    return Array.from(this.frames.keys());
  }
}
