/**
 * WebGL shader program wrapper.
 */
export class Shader {
  readonly program: WebGLProgram;
  private uniformLocations = new Map<string, WebGLUniformLocation>();
  private attributeLocations = new Map<string, number>();

  constructor(
    private gl: WebGL2RenderingContext,
    vertexSource: string,
    fragmentSource: string,
  ) {
    const vertShader = this.compile(gl.VERTEX_SHADER, vertexSource);
    const fragShader = this.compile(gl.FRAGMENT_SHADER, fragmentSource);

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vertShader);
    gl.attachShader(this.program, fragShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(this.program);
      gl.deleteProgram(this.program);
      throw new Error(`Shader link error: ${info}`);
    }

    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
  }

  private compile(type: number, source: string): WebGLShader {
    const { gl } = this;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      const typeName = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
      throw new Error(`${typeName} shader compile error: ${info}`);
    }

    return shader;
  }

  use(): void {
    this.gl.useProgram(this.program);
  }

  getUniformLocation(name: string): WebGLUniformLocation {
    let loc = this.uniformLocations.get(name);
    if (loc === undefined) {
      loc = this.gl.getUniformLocation(this.program, name)!;
      this.uniformLocations.set(name, loc);
    }
    return loc;
  }

  getAttributeLocation(name: string): number {
    let loc = this.attributeLocations.get(name);
    if (loc === undefined) {
      loc = this.gl.getAttribLocation(this.program, name);
      this.attributeLocations.set(name, loc);
    }
    return loc;
  }

  setFloat(name: string, value: number): void {
    this.gl.uniform1f(this.getUniformLocation(name), value);
  }

  setInt(name: string, value: number): void {
    this.gl.uniform1i(this.getUniformLocation(name), value);
  }

  setVec2(name: string, x: number, y: number): void {
    this.gl.uniform2f(this.getUniformLocation(name), x, y);
  }

  setVec4(name: string, x: number, y: number, z: number, w: number): void {
    this.gl.uniform4f(this.getUniformLocation(name), x, y, z, w);
  }

  setMatrix4(name: string, matrix: Float32Array): void {
    this.gl.uniformMatrix4fv(this.getUniformLocation(name), false, matrix);
  }

  destroy(): void {
    this.gl.deleteProgram(this.program);
  }
}

/** Default sprite vertex shader. */
export const SPRITE_VERTEX_SHADER = `#version 300 es
  layout(location = 0) in vec2 a_position;
  layout(location = 1) in vec2 a_texCoord;
  layout(location = 2) in vec4 a_color;

  uniform mat4 u_projection;

  out vec2 v_texCoord;
  out vec4 v_color;

  void main() {
    gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
    v_color = a_color;
  }
`;

/** Default sprite fragment shader. */
export const SPRITE_FRAGMENT_SHADER = `#version 300 es
  precision mediump float;

  in vec2 v_texCoord;
  in vec4 v_color;

  uniform sampler2D u_texture;

  out vec4 fragColor;

  void main() {
    vec4 texColor = texture(u_texture, v_texCoord);
    fragColor = texColor * v_color;
  }
`;
