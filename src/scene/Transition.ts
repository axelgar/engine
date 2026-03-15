/**
 * Interface for scene transition effects (e.g. fade, wipe).
 */
export interface Transition {
  /** Duration of the "out" phase in seconds. */
  outDuration: number;
  /** Duration of the "in" phase in seconds. */
  inDuration: number;
  /** Called when the transition starts. */
  start(): void;
  /** Render the transition overlay. progress is 0..1. */
  render(phase: 'out' | 'in', progress: number): void;
  /** Called when the transition is fully complete. */
  finish(): void;
}

/**
 * A simple fade-to-black transition.
 */
export class FadeTransition implements Transition {
  outDuration: number;
  inDuration: number;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(duration = 0.5) {
    this.outDuration = duration;
    this.inDuration = duration;
  }

  start(): void {}

  render(phase: 'out' | 'in', progress: number): void {
    // Get the canvas from the DOM if not cached
    if (!this.canvas) {
      this.canvas = document.querySelector('canvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
      }
    }
    if (!this.ctx || !this.canvas) return;

    const alpha = phase === 'out' ? progress : 1 - progress;
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  finish(): void {
    this.canvas = null;
    this.ctx = null;
  }
}
