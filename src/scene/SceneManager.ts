import type { Engine } from '../core/Engine.js';
import type { Scene } from './Scene.js';
import type { Transition } from './Transition.js';

/**
 * Manages a stack of scenes. Supports push/pop and scene transitions.
 */
export class SceneManager {
  private stack: Scene[] = [];
  private pendingTransition: {
    next: Scene;
    transition: Transition;
    phase: 'out' | 'in';
    elapsed: number;
  } | null = null;

  constructor(private engine: Engine) {}

  /**
   * Push a scene onto the stack. The current scene is paused.
   */
  async push(scene: Scene): Promise<void> {
    const current = this.active;
    current?.pause();

    scene._setEngine(this.engine);
    this.stack.push(scene);
    await scene.enter();
  }

  /**
   * Pop the current scene off the stack and resume the one beneath.
   */
  pop(): void {
    const removed = this.stack.pop();
    removed?.exit();
    this.active?.resume();
  }

  /**
   * Replace the current scene with a new one.
   */
  async replace(scene: Scene): Promise<void> {
    const removed = this.stack.pop();
    removed?.exit();

    scene._setEngine(this.engine);
    this.stack.push(scene);
    await scene.enter();
  }

  /**
   * Transition from the current scene to a new one with a visual effect.
   */
  startTransition(next: Scene, transition: Transition): void {
    this.pendingTransition = {
      next,
      transition,
      phase: 'out',
      elapsed: 0,
    };
    transition.start();
  }

  /**
   * Update the active scene (and any in-progress transition).
   */
  update(dt: number): void {
    if (this.pendingTransition) {
      this.updateTransition(dt);
    }

    this.active?.update(dt);
  }

  /**
   * Render the active scene (and any transition overlay).
   */
  render(interpolation: number): void {
    this.active?.render(interpolation);

    if (this.pendingTransition) {
      const t = this.pendingTransition;
      const duration =
        t.phase === 'out' ? t.transition.outDuration : t.transition.inDuration;
      const progress = duration > 0 ? Math.min(t.elapsed / duration, 1) : 1;
      t.transition.render(t.phase, progress);
    }
  }

  private async updateTransition(dt: number): Promise<void> {
    const t = this.pendingTransition!;
    t.elapsed += dt;

    const duration =
      t.phase === 'out' ? t.transition.outDuration : t.transition.inDuration;

    if (t.elapsed >= duration) {
      if (t.phase === 'out') {
        // Switch scenes at midpoint
        await this.replace(t.next);
        t.phase = 'in';
        t.elapsed = 0;
      } else {
        // Transition complete
        t.transition.finish();
        this.pendingTransition = null;
      }
    }
  }

  get active(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }

  get depth(): number {
    return this.stack.length;
  }

  get isTransitioning(): boolean {
    return this.pendingTransition !== null;
  }
}
