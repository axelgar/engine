import type { Sprite } from '../rendering/Sprite.js';
import type { AnimationClip, AnimationFrame } from './AnimationClip.js';

/**
 * Plays AnimationClips and applies frame changes to a Sprite.
 */
export class Animator {
  private clips = new Map<string, AnimationClip>();
  private currentClip: AnimationClip | null = null;
  private elapsed = 0;
  private _speed = 1;
  private _playing = true;
  private _finished = false;

  constructor(private sprite: Sprite) {}

  /**
   * Register a clip for playback by name.
   */
  addClip(clip: AnimationClip): void {
    this.clips.set(clip.name, clip);
  }

  /**
   * Play a clip by name. If already playing, restarts from the beginning.
   */
  play(name: string, restart = false): void {
    const clip = this.clips.get(name);
    if (!clip) throw new Error(`AnimationClip "${name}" not found`);

    if (this.currentClip === clip && !restart) return;

    this.currentClip = clip;
    this.elapsed = 0;
    this._playing = true;
    this._finished = false;
    this.applyFrame();
  }

  /**
   * Stop the current animation.
   */
  stop(): void {
    this._playing = false;
  }

  /**
   * Resume playback.
   */
  resume(): void {
    this._playing = true;
  }

  /**
   * Update the animator. Call once per frame.
   */
  update(dt: number): void {
    if (!this.currentClip || !this._playing || this._finished) return;

    this.elapsed += dt * this._speed;

    if (!this.currentClip.loop && this.elapsed >= this.currentClip.totalDuration) {
      this.elapsed = this.currentClip.totalDuration;
      this._finished = true;
    }

    this.applyFrame();
  }

  private applyFrame(): void {
    if (!this.currentClip) return;
    const frame = this.currentClip.getFrameAtTime(this.elapsed);
    this.sprite.sourceRect = frame.sourceRect;
  }

  get currentFrame(): AnimationFrame | null {
    if (!this.currentClip) return null;
    return this.currentClip.getFrameAtTime(this.elapsed);
  }

  get currentFrameIndex(): number {
    if (!this.currentClip) return 0;
    return this.currentClip.getFrameIndexAtTime(this.elapsed);
  }

  get currentClipName(): string | null {
    return this.currentClip?.name ?? null;
  }

  get playing(): boolean {
    return this._playing;
  }

  get finished(): boolean {
    return this._finished;
  }

  get speed(): number {
    return this._speed;
  }

  set speed(value: number) {
    this._speed = value;
  }
}
