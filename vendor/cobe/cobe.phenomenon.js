/**
 * cobe.phenomenon.js
 * A fast 2kB low-level WebGL API.
 *
 * Original: https://github.com/vaneenige/phenomenon
 * Author: Colin van Eenige
 * License: MIT
 * Version: 1.6.0
 *
 * Vendored for cdn.auraq.org — converted from TypeScript to plain JS.
 */

const positionMap = ['x', 'y', 'z'];

class Instance {
  constructor(props) {
    Object.assign(this, {
      uniforms: {},
      geometry: { vertices: [{ x: 0, y: 0, z: 0 }] },
      mode: 0,
      modifiers: {},
      attributes: [],
      multiplier: 1,
      buffers: [],
    });

    Object.assign(this, props);

    this.prepareProgram();
    this.prepareUniforms();
    this.prepareAttributes();
  }

  compileShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    return shader;
  }

  prepareProgram() {
    const { gl, vertex, fragment } = this;
    const program = gl.createProgram();
    gl.attachShader(program, this.compileShader(35633, vertex));
    gl.attachShader(program, this.compileShader(35632, fragment));
    gl.linkProgram(program);
    gl.useProgram(program);
    this.program = program;
  }

  prepareUniforms() {
    const keys = Object.keys(this.uniforms);
    for (let i = 0; i < keys.length; i++) {
      const location = this.gl.getUniformLocation(this.program, keys[i]);
      this.uniforms[keys[i]].location = location;
    }
  }

  prepareAttributes() {
    if (typeof this.geometry.vertices !== 'undefined') {
      this.attributes.push({ name: 'aPosition', size: 3 });
    }
    if (typeof this.geometry.normal !== 'undefined') {
      this.attributes.push({ name: 'aNormal', size: 3 });
    }
    this.attributeKeys = [];
    for (let i = 0; i < this.attributes.length; i++) {
      this.attributeKeys.push(this.attributes[i].name);
      this.prepareAttribute(this.attributes[i]);
    }
  }

  prepareAttribute(attribute) {
    const { geometry, multiplier } = this;
    const { vertices, normal } = geometry;
    const attributeBufferData = new Float32Array(multiplier * vertices.length * attribute.size);

    for (let j = 0; j < multiplier; j++) {
      const data = attribute.data && attribute.data(j, multiplier);
      let offset = j * vertices.length * attribute.size;
      for (let k = 0; k < vertices.length; k++) {
        for (let l = 0; l < attribute.size; l++) {
          const modifier = this.modifiers[attribute.name];
          if (typeof modifier !== 'undefined') {
            attributeBufferData[offset] = modifier(data, k, l, this);
          } else if (attribute.name === 'aPosition') {
            attributeBufferData[offset] = vertices[k][positionMap[l]];
          } else if (attribute.name === 'aNormal') {
            attributeBufferData[offset] = normal[k][positionMap[l]];
          } else {
            attributeBufferData[offset] = data[l];
          }
          offset++;
        }
      }
    }

    this.attributes[this.attributeKeys.indexOf(attribute.name)].data = attributeBufferData;
    this.prepareBuffer(this.attributes[this.attributeKeys.indexOf(attribute.name)]);
  }

  prepareBuffer(attribute) {
    const { data, name, size } = attribute;
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(34962, buffer);
    this.gl.bufferData(34962, data, 35044);
    const location = this.gl.getAttribLocation(this.program, name);
    this.gl.enableVertexAttribArray(location);
    this.gl.vertexAttribPointer(location, size, 5126, false, 0, 0);
    this.buffers[this.attributeKeys.indexOf(attribute.name)] = { buffer, location, size };
  }

  render(renderUniforms) {
    const { uniforms, multiplier, gl } = this;
    gl.useProgram(this.program);

    for (let i = 0; i < this.buffers.length; i++) {
      const { location, buffer, size } = this.buffers[i];
      gl.enableVertexAttribArray(location);
      gl.bindBuffer(34962, buffer);
      gl.vertexAttribPointer(location, size, 5126, false, 0, 0);
    }

    Object.keys(renderUniforms).forEach(key => {
      uniforms[key].value = renderUniforms[key].value;
    });

    Object.keys(uniforms).forEach(key => {
      const { type, location, value } = uniforms[key];
      this.uniformMap[type](location, value);
    });

    gl.drawArrays(this.mode, 0, multiplier * this.geometry.vertices.length);

    if (this.onRender) this.onRender(this);
  }

  destroy() {
    for (let i = 0; i < this.buffers.length; i++) {
      this.gl.deleteBuffer(this.buffers[i].buffer);
    }
    this.gl.deleteProgram(this.program);
    this.gl = null;
  }
}

class Renderer {
  constructor(props) {
    const {
      canvas = document.querySelector('canvas'),
      context = {},
      contextType = 'experimental-webgl',
      settings = {},
      debug = false,
    } = props || {};

    const gl = canvas.getContext(
      contextType,
      Object.assign({ alpha: false, antialias: false }, context)
    );

    Object.assign(this, {
      gl,
      canvas,
      uniforms: {},
      instances: new Map(),
      shouldRender: true,
    });

    Object.assign(this, {
      devicePixelRatio: 1,
      clearColor: [1, 1, 1, 1],
      position: { x: 0, y: 0, z: 2 },
      clip: [0.001, 100],
      debug,
    });

    Object.assign(this, settings);

    this.uniformMap = {
      float: (loc, val) => gl.uniform1f(loc, val),
      vec2:  (loc, val) => gl.uniform2fv(loc, val),
      vec3:  (loc, val) => gl.uniform3fv(loc, val),
      vec4:  (loc, val) => gl.uniform4fv(loc, val),
      mat2:  (loc, val) => gl.uniformMatrix2fv(loc, false, val),
      mat3:  (loc, val) => gl.uniformMatrix3fv(loc, false, val),
      mat4:  (loc, val) => gl.uniformMatrix4fv(loc, false, val),
    };

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    if (gl.getContextAttributes().alpha === false) {
      gl.clearColor(...this.clearColor);
      gl.clearDepth(1.0);
    }

    if (this.onSetup) this.onSetup(gl);

    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.render();
  }

  resize() {
    const { gl, canvas, devicePixelRatio, position } = this;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const bufferWidth = gl.drawingBufferWidth;
    const bufferHeight = gl.drawingBufferHeight;
    const ratio = bufferWidth / bufferHeight;

    gl.viewport(0, 0, bufferWidth, bufferHeight);

    const angle = Math.tan(45 * 0.5 * (Math.PI / 180));

    const projectionMatrix = [
      0.5 / angle, 0, 0, 0,
      0, 0.5 * (ratio / angle), 0, 0,
      0, 0, -(this.clip[1] + this.clip[0]) / (this.clip[1] - this.clip[0]), -1,
      0, 0, -2 * this.clip[1] * (this.clip[0] / (this.clip[1] - this.clip[0])), 0,
    ];

    const viewMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];

    const modelMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      position.x, position.y, (ratio < 1 ? 1 : ratio) * -position.z, 1,
    ];

    this.uniforms.uProjectionMatrix = { type: 'mat4', value: projectionMatrix };
    this.uniforms.uViewMatrix      = { type: 'mat4', value: viewMatrix };
    this.uniforms.uModelMatrix     = { type: 'mat4', value: modelMatrix };
  }

  toggle(shouldRender) {
    if (shouldRender === this.shouldRender) return;
    this.shouldRender = typeof shouldRender !== 'undefined' ? shouldRender : !this.shouldRender;
    if (this.shouldRender) this.render();
  }

  render() {
    this.gl.clear(16640);
    this.instances.forEach(instance => instance.render(this.uniforms));
    if (this.onRender) this.onRender(this);
    if (this.shouldRender) requestAnimationFrame(() => this.render());
  }

  add(key, settings) {
    if (typeof settings === 'undefined') settings = { uniforms: {} };
    if (typeof settings.uniforms === 'undefined') settings.uniforms = {};

    Object.assign(settings.uniforms, JSON.parse(JSON.stringify(this.uniforms)));
    Object.assign(settings, { gl: this.gl, uniformMap: this.uniformMap });

    const instance = new Instance(settings);
    this.instances.set(key, instance);

    if (this.debug) {
      const vertexDebug = this.gl.createShader(this.gl.VERTEX_SHADER);
      this.gl.shaderSource(vertexDebug, settings.vertex);
      this.gl.compileShader(vertexDebug);
      if (!this.gl.getShaderParameter(vertexDebug, this.gl.COMPILE_STATUS)) {
        console.error(this.gl.getShaderInfoLog(vertexDebug));
      }

      const fragmentDebug = this.gl.createShader(this.gl.FRAGMENT_SHADER);
      this.gl.shaderSource(fragmentDebug, settings.fragment);
      this.gl.compileShader(fragmentDebug);
      if (!this.gl.getShaderParameter(fragmentDebug, this.gl.COMPILE_STATUS)) {
        console.error(this.gl.getShaderInfoLog(fragmentDebug));
      }
    }

    return instance;
  }

  remove(key) {
    const instance = this.instances.get(key);
    if (typeof instance === 'undefined') return;
    instance.destroy();
    this.instances.delete(key);
  }

  destroy() {
    this.instances.forEach((instance, key) => {
      instance.destroy();
      this.instances.delete(key);
    });
    this.toggle(false);
  }
}

export default Renderer;
