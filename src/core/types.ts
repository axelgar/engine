/**
 * Configuration for engine initialization.
 */
export interface EngineConfig {
  /** Canvas element or a container element (engine will create a canvas inside it). */
  canvas: HTMLCanvasElement;
  /** Logical game width in pixels. Default: 1280 */
  width?: number;
  /** Logical game height in pixels. Default: 720 */
  height?: number;
  /** Target updates per second. Default: 60 */
  targetUPS?: number;
  /** Background clear color as [r, g, b, a] (0-1 range). Default: [0, 0, 0, 1] */
  clearColor?: [number, number, number, number];
}

/**
 * Callback signature for the game's update function.
 */
export type UpdateCallback = (dt: number) => void;

/**
 * Callback signature for the game's render function.
 */
export type RenderCallback = (interpolation: number) => void;
