import { SpriteBatch } from './SpriteBatch.js';
import { Camera } from './Camera.js';

export interface RendererConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  clearColor?: [number, number, number, number];
}

/**
 * WebGL 2 renderer. Manages the GL context, viewport, and sprite batch.
 */
export class WebGLRenderer {
  readonly gl: WebGL2RenderingContext;
  readonly spriteBatch: SpriteBatch;
  readonly camera: Camera;
  readonly width: number;
  readonly height: number;

  private clearColor: [number, number, number, number];

  constructor(config: RendererConfig) {
    const { canvas, width, height } = config;
    this.width = width;
    this.height = height;
    this.clearColor = config.clearColor ?? [0, 0, 0, 1];

    canvas.width = width;
    canvas.height = height;

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) {
      throw new Error('WebGL 2 is not supported in this browser');
    }
    this.gl = gl;

    gl.viewport(0, 0, width, height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const [r, g, b, a] = this.clearColor;
    gl.clearColor(r, g, b, a);

    this.spriteBatch = new SpriteBatch(gl);
    this.camera = new Camera(width, height);
  }

  /**
   * Call at the start of each frame. Clears the screen and begins sprite batching.
   */
  begin(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    const projection = this.camera.getProjectionMatrix();
    this.spriteBatch.begin(projection);
  }

  /**
   * Call at the end of each frame. Flushes the sprite batch.
   */
  end(): void {
    this.spriteBatch.end();
  }

  /**
   * Set the clear color.
   */
  setClearColor(r: number, g: number, b: number, a = 1): void {
    this.clearColor = [r, g, b, a];
    this.gl.clearColor(r, g, b, a);
  }

  /**
   * Resize the viewport (e.g. when the canvas size changes).
   */
  resize(width: number, height: number): void {
    this.gl.viewport(0, 0, width, height);
    this.camera.viewportWidth = width;
    this.camera.viewportHeight = height;
  }

  destroy(): void {
    this.spriteBatch.destroy();
  }
}
