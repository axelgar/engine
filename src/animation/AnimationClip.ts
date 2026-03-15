import type { Rectangle } from '../math/Rectangle.js';

export interface AnimationFrame {
  /** Source rectangle within the sprite sheet texture. */
  sourceRect: Rectangle;
  /** Duration of this frame in seconds. */
  duration: number;
}

/**
 * A named sequence of animation frames with playback settings.
 */
export class AnimationClip {
  readonly name: string;
  readonly frames: readonly AnimationFrame[];
  readonly loop: boolean;
  readonly totalDuration: number;

  constructor(name: string, frames: AnimationFrame[], loop = true) {
    this.name = name;
    this.frames = frames;
    this.loop = loop;
    this.totalDuration = frames.reduce((sum, f) => sum + f.duration, 0);
  }

  /**
   * Get the frame at a given elapsed time.
   */
  getFrameAtTime(elapsed: number): AnimationFrame {
    if (this.frames.length === 0) {
      throw new Error(`AnimationClip "${this.name}" has no frames`);
    }

    let t = elapsed;
    if (this.loop && this.totalDuration > 0) {
      t = t % this.totalDuration;
    }

    let accumulated = 0;
    for (const frame of this.frames) {
      accumulated += frame.duration;
      if (t < accumulated) return frame;
    }

    return this.frames[this.frames.length - 1];
  }

  /**
   * Get the frame index at a given elapsed time.
   */
  getFrameIndexAtTime(elapsed: number): number {
    if (this.frames.length === 0) return 0;

    let t = elapsed;
    if (this.loop && this.totalDuration > 0) {
      t = t % this.totalDuration;
    }

    let accumulated = 0;
    for (let i = 0; i < this.frames.length; i++) {
      accumulated += this.frames[i].duration;
      if (t < accumulated) return i;
    }

    return this.frames.length - 1;
  }
}
