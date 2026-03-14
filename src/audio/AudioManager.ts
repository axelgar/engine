import { AudioChannel } from './AudioChannel.js';
import type { AssetStore } from '../assets/AssetStore.js';

/**
 * Manages background music and sound effects via Web Audio API.
 */
export class AudioManager {
  private ctx: AudioContext;
  private bgmChannel: AudioChannel;
  private sfxChannels: AudioChannel[] = [];
  private maxSfxChannels = 8;
  private _masterVolume = 1;
  private masterGain: GainNode;

  constructor(private store: AssetStore) {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.bgmChannel = new AudioChannel(this.ctx);

    // Pre-create SFX channels for pooling
    for (let i = 0; i < this.maxSfxChannels; i++) {
      this.sfxChannels.push(new AudioChannel(this.ctx));
    }
  }

  get audioContext(): AudioContext {
    return this.ctx;
  }

  get masterVolume(): number {
    return this._masterVolume;
  }

  set masterVolume(value: number) {
    this._masterVolume = Math.max(0, Math.min(1, value));
    this.masterGain.gain.value = this._masterVolume;
  }

  /**
   * Resume audio context (required after user interaction due to browser autoplay policy).
   */
  async resume(): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  playBGM(key: string, options: { loop?: boolean; fadeIn?: number; volume?: number } = {}): void {
    const buffer = this.store.get<AudioBuffer>(key);
    this.bgmChannel.play(buffer, {
      loop: options.loop ?? true,
      fadeIn: options.fadeIn,
      volume: options.volume ?? 1,
    });
  }

  stopBGM(fadeOut?: number): void {
    this.bgmChannel.stop(fadeOut);
  }

  playSFX(key: string, options: { volume?: number } = {}): void {
    const buffer = this.store.get<AudioBuffer>(key);

    // Find an idle SFX channel
    const channel = this.sfxChannels.find((ch) => !ch.playing);
    if (!channel) return; // All channels busy, skip

    channel.play(buffer, {
      loop: false,
      volume: options.volume ?? 1,
    });
  }

  destroy(): void {
    this.bgmChannel.stop();
    for (const ch of this.sfxChannels) {
      ch.stop();
    }
    this.ctx.close();
  }
}
