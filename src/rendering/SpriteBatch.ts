import { Shader, SPRITE_VERTEX_SHADER, SPRITE_FRAGMENT_SHADER } from './Shader.js';
import type { Texture } from './Texture.js';
import type { Sprite } from './Sprite.js';

const MAX_SPRITES = 10000;
// Each sprite = 4 vertices, each vertex = 8 floats (x, y, u, v, r, g, b, a)
const FLOATS_PER_VERTEX = 8;
const VERTICES_PER_SPRITE = 4;
const INDICES_PER_SPRITE = 6;

/**
 * Batches sprite draw calls by texture for efficient rendering.
 */
export class SpriteBatch {
  private shader: Shader;
  private vao: WebGLVertexArrayObject;
  private vbo: WebGLBuffer;
  private ebo: WebGLBuffer;
  private vertexData: Float32Array;
  private spriteCount = 0;
  private currentTexture: Texture | null = null;
  private drawing = false;

  constructor(private gl: WebGL2RenderingContext) {
    this.shader = new Shader(gl, SPRITE_VERTEX_SHADER, SPRITE_FRAGMENT_SHADER);
    this.vertexData = new Float32Array(MAX_SPRITES * VERTICES_PER_SPRITE * FLOATS_PER_VERTEX);

    // Create VAO
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    // Create VBO
    this.vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexData.byteLength, gl.DYNAMIC_DRAW);

    // Position (location 0)
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, FLOATS_PER_VERTEX * 4, 0);
    // TexCoord (location 1)
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, FLOATS_PER_VERTEX * 4, 8);
    // Color (location 2)
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, FLOATS_PER_VERTEX * 4, 16);

    // Create EBO with indices for all quads
    this.ebo = gl.createBuffer()!;
    const indices = new Uint16Array(MAX_SPRITES * INDICES_PER_SPRITE);
    for (let i = 0; i < MAX_SPRITES; i++) {
      const vi = i * 4;
      const ii = i * 6;
      indices[ii] = vi;
      indices[ii + 1] = vi + 1;
      indices[ii + 2] = vi + 2;
      indices[ii + 3] = vi + 2;
      indices[ii + 4] = vi + 3;
      indices[ii + 5] = vi;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
  }

  begin(projectionMatrix: Float32Array): void {
    if (this.drawing) throw new Error('SpriteBatch.begin() called while already drawing');
    this.drawing = true;
    this.spriteCount = 0;
    this.currentTexture = null;

    this.shader.use();
    this.shader.setMatrix4('u_projection', projectionMatrix);
    this.shader.setInt('u_texture', 0);
  }

  draw(sprite: Sprite): void {
    if (!this.drawing) throw new Error('SpriteBatch.draw() called without begin()');

    // Flush if texture changes or batch is full
    if (this.currentTexture && this.currentTexture !== sprite.texture) {
      this.flush();
    }
    if (this.spriteCount >= MAX_SPRITES) {
      this.flush();
    }

    this.currentTexture = sprite.texture;

    const w = sprite.width * sprite.scale.x;
    const h = sprite.height * sprite.scale.y;
    const ox = sprite.origin.x * w;
    const oy = sprite.origin.y * h;
    const px = sprite.position.x;
    const py = sprite.position.y;

    // Compute 4 corner positions relative to origin
    let x0 = -ox, y0 = -oy;
    let x1 = w - ox, y1 = -oy;
    let x2 = w - ox, y2 = h - oy;
    let x3 = -ox, y3 = h - oy;

    // Apply rotation
    if (sprite.rotation !== 0) {
      const cos = Math.cos(sprite.rotation);
      const sin = Math.sin(sprite.rotation);
      const rx0 = x0 * cos - y0 * sin, ry0 = x0 * sin + y0 * cos;
      const rx1 = x1 * cos - y1 * sin, ry1 = x1 * sin + y1 * cos;
      const rx2 = x2 * cos - y2 * sin, ry2 = x2 * sin + y2 * cos;
      const rx3 = x3 * cos - y3 * sin, ry3 = x3 * sin + y3 * cos;
      x0 = rx0; y0 = ry0;
      x1 = rx1; y1 = ry1;
      x2 = rx2; y2 = ry2;
      x3 = rx3; y3 = ry3;
    }

    // Translate to world position
    x0 += px; y0 += py;
    x1 += px; y1 += py;
    x2 += px; y2 += py;
    x3 += px; y3 += py;

    // Texture coordinates
    const tex = sprite.texture;
    const sr = sprite.sourceRect;
    let u0 = sr ? sr.x / tex.width : 0;
    let v0 = sr ? sr.y / tex.height : 0;
    let u1 = sr ? (sr.x + sr.width) / tex.width : 1;
    let v1 = sr ? (sr.y + sr.height) / tex.height : 1;

    if (sprite.flipX) { const tmp = u0; u0 = u1; u1 = tmp; }
    if (sprite.flipY) { const tmp = v0; v0 = v1; v1 = tmp; }

    // Color + opacity
    const r = sprite.tint[0];
    const g = sprite.tint[1];
    const b = sprite.tint[2];
    const a = sprite.opacity;

    // Write vertex data (4 vertices per sprite)
    const offset = this.spriteCount * VERTICES_PER_SPRITE * FLOATS_PER_VERTEX;
    const d = this.vertexData;

    // Top-left
    d[offset] = x0; d[offset + 1] = y0;
    d[offset + 2] = u0; d[offset + 3] = v0;
    d[offset + 4] = r; d[offset + 5] = g; d[offset + 6] = b; d[offset + 7] = a;

    // Top-right
    d[offset + 8] = x1; d[offset + 9] = y1;
    d[offset + 10] = u1; d[offset + 11] = v0;
    d[offset + 12] = r; d[offset + 13] = g; d[offset + 14] = b; d[offset + 15] = a;

    // Bottom-right
    d[offset + 16] = x2; d[offset + 17] = y2;
    d[offset + 18] = u1; d[offset + 19] = v1;
    d[offset + 20] = r; d[offset + 21] = g; d[offset + 22] = b; d[offset + 23] = a;

    // Bottom-left
    d[offset + 24] = x3; d[offset + 25] = y3;
    d[offset + 26] = u0; d[offset + 27] = v1;
    d[offset + 28] = r; d[offset + 29] = g; d[offset + 30] = b; d[offset + 31] = a;

    this.spriteCount++;
  }

  end(): void {
    if (!this.drawing) throw new Error('SpriteBatch.end() called without begin()');
    this.flush();
    this.drawing = false;
    this.currentTexture = null;
  }

  private flush(): void {
    if (this.spriteCount === 0) return;

    const { gl } = this;

    this.currentTexture?.bind(0);

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      0,
      this.vertexData.subarray(0, this.spriteCount * VERTICES_PER_SPRITE * FLOATS_PER_VERTEX),
    );

    gl.drawElements(gl.TRIANGLES, this.spriteCount * INDICES_PER_SPRITE, gl.UNSIGNED_SHORT, 0);

    gl.bindVertexArray(null);
    this.spriteCount = 0;
  }

  destroy(): void {
    this.shader.destroy();
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteBuffer(this.vbo);
    this.gl.deleteBuffer(this.ebo);
  }
}
