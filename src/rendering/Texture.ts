/**
 * WebGL texture wrapper.
 */
export class Texture {
  readonly glTexture: WebGLTexture;
  readonly width: number;
  readonly height: number;

  constructor(
    private gl: WebGL2RenderingContext,
    image: HTMLImageElement,
    options: TextureOptions = {},
  ) {
    this.width = image.width;
    this.height = image.height;

    const tex = gl.createTexture()!;
    this.glTexture = tex;

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    const filter = options.filter ?? TextureFilter.Linear;
    const glFilter = filter === TextureFilter.Nearest ? gl.NEAREST : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, glFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, glFilter);

    const wrap = options.wrap ?? TextureWrap.ClampToEdge;
    const glWrap =
      wrap === TextureWrap.Repeat
        ? gl.REPEAT
        : wrap === TextureWrap.MirroredRepeat
          ? gl.MIRRORED_REPEAT
          : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, glWrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, glWrap);

    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  bind(unit = 0): void {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.glTexture);
  }

  unbind(): void {
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  destroy(): void {
    this.gl.deleteTexture(this.glTexture);
  }
}

export enum TextureFilter {
  Nearest = 'nearest',
  Linear = 'linear',
}

export enum TextureWrap {
  ClampToEdge = 'clamp',
  Repeat = 'repeat',
  MirroredRepeat = 'mirrored',
}

export interface TextureOptions {
  filter?: TextureFilter;
  wrap?: TextureWrap;
}
