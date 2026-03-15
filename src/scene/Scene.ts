import type { Engine } from '../core/Engine.js';

/**
 * Base class for game scenes. Override lifecycle methods to build game screens.
 */
export abstract class Scene {
  protected engine!: Engine;

  /**
   * Called once when the scene is first entered.
   * Use for initialization, asset loading, entity setup, etc.
   */
  abstract enter(): void | Promise<void>;

  /**
   * Called once when leaving this scene.
   * Use for cleanup.
   */
  abstract exit(): void;

  /**
   * Called every fixed update tick.
   */
  abstract update(dt: number): void;

  /**
   * Called every render frame.
   */
  abstract render(interpolation: number): void;

  /**
   * Called when this scene is paused (another scene pushed on top).
   */
  pause(): void {}

  /**
   * Called when this scene is resumed (scene on top was popped).
   */
  resume(): void {}

  /** @internal */
  _setEngine(engine: Engine): void {
    this.engine = engine;
  }
}
