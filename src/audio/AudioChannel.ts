/**
 * An individual audio channel wrapping a Web Audio source + gain node.
 */
export class AudioChannel {
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private _playing = false;

  constructor(private ctx: AudioContext) {
    this.gainNode = ctx.createGain();
    this.gainNode.connect(ctx.destination);
  }

  get playing(): boolean {
    return this._playing;
  }

  get volume(): number {
    return this.gainNode.gain.value;
  }

  set volume(value: number) {
    this.gainNode.gain.value = Math.max(0, Math.min(1, value));
  }

  play(buffer: AudioBuffer, options: PlayOptions = {}): void {
    this.stop();

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop ?? false;
    source.connect(this.gainNode);

    this.volume = options.volume ?? 1;

    if (options.fadeIn && options.fadeIn > 0) {
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(
        options.volume ?? 1,
        this.ctx.currentTime + options.fadeIn,
      );
    }

    source.onended = () => {
      this._playing = false;
      this.source = null;
    };

    source.start();
    this.source = source;
    this._playing = true;
  }

  stop(fadeOut?: number): void {
    if (!this.source || !this._playing) return;

    if (fadeOut && fadeOut > 0) {
      this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeOut);
      this.source.stop(this.ctx.currentTime + fadeOut);
    } else {
      this.source.stop();
    }

    this._playing = false;
    this.source = null;
  }
}

export interface PlayOptions {
  loop?: boolean;
  volume?: number;
  fadeIn?: number;
}
