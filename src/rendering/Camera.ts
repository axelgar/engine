import { Vector2 } from '../math/Vector2.js';

/**
 * 2D camera with follow, zoom, and screen shake.
 */
export class Camera {
  position: Vector2 = Vector2.ZERO;
  zoom = 1;
  rotation = 0;
  viewportWidth: number;
  viewportHeight: number;

  private shakeIntensity = 0;
  private shakeDuration = 0;
  private shakeElapsed = 0;
  private shakeOffset: Vector2 = Vector2.ZERO;

  private followTarget: { position: Vector2 } | null = null;
  private followLerp = 1;

  constructor(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  follow(target: { position: Vector2 }, lerp = 0.1): void {
    this.followTarget = target;
    this.followLerp = lerp;
  }

  stopFollowing(): void {
    this.followTarget = null;
  }

  shake(intensity: number, durationMs: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = durationMs / 1000;
    this.shakeElapsed = 0;
  }

  update(dt: number): void {
    // Follow target
    if (this.followTarget) {
      this.position = this.position.lerp(this.followTarget.position, this.followLerp);
    }

    // Screen shake
    if (this.shakeElapsed < this.shakeDuration) {
      this.shakeElapsed += dt;
      const progress = this.shakeElapsed / this.shakeDuration;
      const damping = 1 - progress;
      this.shakeOffset = new Vector2(
        (Math.random() * 2 - 1) * this.shakeIntensity * damping,
        (Math.random() * 2 - 1) * this.shakeIntensity * damping,
      );
    } else {
      this.shakeOffset = Vector2.ZERO;
    }
  }

  /**
   * Returns the orthographic projection matrix (4x4, column-major)
   * that maps world coordinates to clip space, accounting for camera transform.
   */
  getProjectionMatrix(): Float32Array {
    const hw = this.viewportWidth / (2 * this.zoom);
    const hh = this.viewportHeight / (2 * this.zoom);
    const cx = this.position.x + this.shakeOffset.x;
    const cy = this.position.y + this.shakeOffset.y;

    const left = cx - hw;
    const right = cx + hw;
    const top = cy - hh;
    const bottom = cy + hh;

    // Orthographic projection matrix (column-major)
    const m = new Float32Array(16);
    m[0] = 2 / (right - left);
    m[5] = 2 / (top - bottom); // flip Y so +Y is down (screen coords)
    m[10] = -1;
    m[12] = -(right + left) / (right - left);
    m[13] = -(top + bottom) / (top - bottom);
    m[15] = 1;

    return m;
  }

  /**
   * Convert screen coordinates to world coordinates.
   */
  screenToWorld(screenX: number, screenY: number): Vector2 {
    const hw = this.viewportWidth / (2 * this.zoom);
    const hh = this.viewportHeight / (2 * this.zoom);
    const cx = this.position.x + this.shakeOffset.x;
    const cy = this.position.y + this.shakeOffset.y;

    const worldX = (screenX / this.viewportWidth) * (2 * hw) + (cx - hw);
    const worldY = (screenY / this.viewportHeight) * (2 * hh) + (cy - hh);

    return new Vector2(worldX, worldY);
  }

  /**
   * Convert world coordinates to screen coordinates.
   */
  worldToScreen(worldX: number, worldY: number): Vector2 {
    const hw = this.viewportWidth / (2 * this.zoom);
    const hh = this.viewportHeight / (2 * this.zoom);
    const cx = this.position.x + this.shakeOffset.x;
    const cy = this.position.y + this.shakeOffset.y;

    const screenX = ((worldX - (cx - hw)) / (2 * hw)) * this.viewportWidth;
    const screenY = ((worldY - (cy - hh)) / (2 * hh)) * this.viewportHeight;

    return new Vector2(screenX, screenY);
  }
}
