import type { UpdateCallback, RenderCallback } from './types.js';

/**
 * Fixed-timestep game loop with variable rendering.
 * Uses an accumulator pattern for deterministic updates.
 */
export class GameLoop {
  private running = false;
  private paused = false;
  private rafId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private readonly timestep: number; // seconds per update

  private frameCount = 0;
  private fpsTime = 0;
  private _fps = 0;

  private onUpdate: UpdateCallback;
  private onRender: RenderCallback;

  constructor(
    targetUPS: number,
    onUpdate: UpdateCallback,
    onRender: RenderCallback,
  ) {
    this.timestep = 1 / targetUPS;
    this.onUpdate = onUpdate;
    this.onRender = onRender;
  }

  get fps(): number {
    return this._fps;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;
    this.frameCount = 0;
    this.fpsTime = this.lastTime;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (this.paused) {
      this.paused = false;
      this.lastTime = performance.now() / 1000;
      this.accumulator = 0;
    }
  }

  private tick = (timestamp: DOMHighResTimeStamp): void => {
    if (!this.running) return;

    const currentTime = timestamp / 1000;
    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Cap frame time to avoid spiral of death
    if (frameTime > 0.25) {
      frameTime = 0.25;
    }

    // FPS counter
    this.frameCount++;
    this.fpsTime += frameTime;
    if (this.fpsTime >= 1) {
      this._fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTime -= 1;
    }

    if (!this.paused) {
      this.accumulator += frameTime;

      // Fixed-timestep updates
      while (this.accumulator >= this.timestep) {
        this.onUpdate(this.timestep);
        this.accumulator -= this.timestep;
      }

      // Render with interpolation factor
      const interpolation = this.accumulator / this.timestep;
      this.onRender(interpolation);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}
