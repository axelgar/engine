import { AssetStore } from './AssetStore.js';

export interface AssetManifest {
  images?: Record<string, string>;
  audio?: Record<string, string>;
  json?: Record<string, string>;
}

export type ProgressCallback = (loaded: number, total: number) => void;

/**
 * Async asset loader with progress tracking.
 */
export class AssetLoader {
  private audioContext: AudioContext | null = null;

  constructor(private store: AssetStore) {}

  /**
   * Load all assets in the manifest. Returns when all are loaded.
   */
  async load(manifest: AssetManifest, onProgress?: ProgressCallback): Promise<void> {
    const tasks: Array<() => Promise<void>> = [];

    if (manifest.images) {
      for (const [key, url] of Object.entries(manifest.images)) {
        tasks.push(async () => { await this.loadImage(key, url); });
      }
    }

    if (manifest.audio) {
      for (const [key, url] of Object.entries(manifest.audio)) {
        tasks.push(async () => { await this.loadAudio(key, url); });
      }
    }

    if (manifest.json) {
      for (const [key, url] of Object.entries(manifest.json)) {
        tasks.push(async () => { await this.loadJson(key, url); });
      }
    }

    const total = tasks.length;
    let loaded = 0;

    await Promise.all(
      tasks.map(async (task) => {
        await task();
        loaded++;
        onProgress?.(loaded, total);
      }),
    );
  }

  async loadImage(key: string, url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.store.set(key, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  async loadAudio(key: string, url: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.store.set(key, audioBuffer);
    return audioBuffer;
  }

  async loadJson(key: string, url: string): Promise<unknown> {
    const response = await fetch(url);
    const data = await response.json();
    this.store.set(key, data);
    return data;
  }

  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
  }
}
