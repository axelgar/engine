import type { EngineConfig, UpdateCallback, RenderCallback } from './types.js';
import { GameLoop } from './GameLoop.js';
import { WebGLRenderer } from '../rendering/WebGLRenderer.js';
import { InputManager } from '../input/InputManager.js';
import { InputMap } from '../input/InputMap.js';
import { AssetStore } from '../assets/AssetStore.js';
import { AssetLoader } from '../assets/AssetLoader.js';
import { AudioManager } from '../audio/AudioManager.js';
import { EventBus } from '../events/EventBus.js';

/**
 * Main engine entry point. Creates and wires all subsystems.
 */
export class Engine {
  readonly renderer: WebGLRenderer;
  readonly input: InputManager;
  readonly inputMap: InputMap;
  readonly assets: AssetStore;
  readonly loader: AssetLoader;
  readonly audio: AudioManager;
  readonly events: EventBus;

  private loop: GameLoop;
  private userUpdate: UpdateCallback = () => {};
  private userRender: RenderCallback = () => {};

  constructor(config: EngineConfig) {
    const width = config.width ?? 1280;
    const height = config.height ?? 720;

    this.renderer = new WebGLRenderer({
      canvas: config.canvas,
      width,
      height,
      clearColor: config.clearColor,
    });

    this.input = new InputManager();
    this.inputMap = new InputMap(this.input);
    this.assets = new AssetStore();
    this.loader = new AssetLoader(this.assets);
    this.audio = new AudioManager(this.assets);
    this.events = new EventBus();

    // Share the audio context with the asset loader
    this.loader.setAudioContext(this.audio.audioContext);

    const targetUPS = config.targetUPS ?? 60;
    this.loop = new GameLoop(
      targetUPS,
      (dt) => this.update(dt),
      (interpolation) => this.render(interpolation),
    );
  }

  /**
   * Set the game's update callback.
   */
  onUpdate(callback: UpdateCallback): void {
    this.userUpdate = callback;
  }

  /**
   * Set the game's render callback.
   */
  onRender(callback: RenderCallback): void {
    this.userRender = callback;
  }

  /**
   * Start the game loop.
   */
  start(): void {
    this.loop.start();
  }

  /**
   * Stop the game loop.
   */
  stop(): void {
    this.loop.stop();
  }

  /**
   * Pause the game loop (rendering continues but no updates).
   */
  pause(): void {
    this.loop.pause();
  }

  /**
   * Resume after pause.
   */
  resume(): void {
    this.loop.resume();
  }

  get fps(): number {
    return this.loop.fps;
  }

  get isRunning(): boolean {
    return this.loop.isRunning;
  }

  private update(dt: number): void {
    this.input.update();
    this.renderer.camera.update(dt);
    this.userUpdate(dt);
  }

  private render(interpolation: number): void {
    this.renderer.begin();
    this.userRender(interpolation);
    this.renderer.end();
  }

  destroy(): void {
    this.loop.stop();
    this.renderer.destroy();
    this.input.destroy();
    this.audio.destroy();
    this.events.clear();
  }
}
