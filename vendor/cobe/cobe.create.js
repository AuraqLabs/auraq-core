/**
 * index.js
 * COBE — 5kB WebGL globe.
 *
 * Original: https://github.com/shuding/cobe
 * Author: Shu Ding
 * License: MIT
 * Version: 0.6.5
 *
 * Vendored for cdn.auraq.org — no build step.
 * Imports resolved to relative paths in place of esbuild inlining.
 *
 * Usage:
 *   import createGlobe from 'https://cdn.auraq.org/vendor/cobe/cobe.create.js'
 */

import Phenomenon from './cobe.phenomenon.js';
import TEXTURE from './cobe.texture.js';
import {
  GLSLX_SOURCE_MAIN,
  GLSLX_NAME_U_RESOLUTION,
  GLSLX_NAME_U_TEXTURE,
  GLSLX_NAME_PHI,
  GLSLX_NAME_THETA,
  GLSLX_NAME_DOTS,
  GLSLX_NAME_DOTS_BRIGHTNESS,
  GLSLX_NAME_MAP_BASE_BRIGHTNESS,
  GLSLX_NAME_BASE_COLOR,
  GLSLX_NAME_MARKER_COLOR,
  GLSLX_NAME_GLOW_COLOR,
  GLSLX_NAME_DIFFUSE,
  GLSLX_NAME_DARK,
  GLSLX_NAME_MARKERS,
  GLSLX_NAME_MARKERS_NUM,
  GLSLX_NAME_OFFSET,
  GLSLX_NAME_SCALE,
  GLSLX_NAME_OPACITY,
} from './cobe.shader.js';

const OPT_PHI               = "phi";
const OPT_THETA             = "theta";
const OPT_DOTS              = "mapSamples";
const OPT_MAP_BRIGHTNESS    = "mapBrightness";
const OPT_BASE_COLOR        = "baseColor";
const OPT_MARKER_COLOR      = "markerColor";
const OPT_GLOW_COLOR        = "glowColor";
const OPT_MARKERS           = "markers";
const OPT_DIFFUSE           = "diffuse";
const OPT_DPR               = "devicePixelRatio";
const OPT_DARK              = "dark";
const OPT_OFFSET            = "offset";
const OPT_SCALE             = "scale";
const OPT_OPACITY           = "opacity";
const OPT_MAP_BASE_BRIGHTNESS = "mapBaseBrightness";

// Maps createGlobe() option keys to minified shader uniform names
const OPT_MAPPING = {
  [OPT_PHI]:               GLSLX_NAME_PHI,
  [OPT_THETA]:             GLSLX_NAME_THETA,
  [OPT_DOTS]:              GLSLX_NAME_DOTS,
  [OPT_MAP_BRIGHTNESS]:    GLSLX_NAME_DOTS_BRIGHTNESS,
  [OPT_BASE_COLOR]:        GLSLX_NAME_BASE_COLOR,
  [OPT_MARKER_COLOR]:      GLSLX_NAME_MARKER_COLOR,
  [OPT_GLOW_COLOR]:        GLSLX_NAME_GLOW_COLOR,
  [OPT_DIFFUSE]:           GLSLX_NAME_DIFFUSE,
  [OPT_DARK]:              GLSLX_NAME_DARK,
  [OPT_OFFSET]:            GLSLX_NAME_OFFSET,
  [OPT_SCALE]:             GLSLX_NAME_SCALE,
  [OPT_OPACITY]:           GLSLX_NAME_OPACITY,
  [OPT_MAP_BASE_BRIGHTNESS]: GLSLX_NAME_MAP_BASE_BRIGHTNESS,
};

const { PI, sin, cos, sqrt, atan2, floor, max, pow, log2 } = Math;

// Fibonacci sphere constants — match the GLSL shader exactly
const sqrt5           = 2.23606797749979;
const kPhi            = 1.618033988749895;
const byLogPhiPlusOne = 0.7202100452062783;
const kTau            = 6.283185307179586;
const twoPiOnPhi      = 3.8832220774509327;
const phiMinusOne     = 0.618033988749895;

/**
 * nearestFibonacciLattice(p, d)
 * Finds the nearest point on a Fibonacci sphere lattice to a given 3D point.
 * Used to snap marker coordinates to the dot grid on the globe surface.
 *
 * @param {number[]} p - 3D point [x, y, z] on the unit sphere
 * @param {number}   d - Number of dots (mapSamples)
 * @returns {number[]} Nearest lattice point [x, y, z]
 */
const nearestFibonacciLattice = (p, d) => {
  const q = [p[0], p[2], p[1]], b = 1 / d;
  const k = max(2, floor(log2(sqrt5 * d * PI * (1 - q[2] * q[2])) * byLogPhiPlusOne));
  const pk = pow(kPhi, k) / sqrt5;
  const f = [floor(pk + .5), floor(pk * kPhi + .5)];
  const r1 = [((f[0] + 1) * phiMinusOne) % 1 * kTau - twoPiOnPhi, ((f[1] + 1) * phiMinusOne) % 1 * kTau - twoPiOnPhi];
  const r2 = [-2 * f[0], -2 * f[1]];
  const sp = [atan2(q[1], q[0]), q[2] - 1];
  const dt = r1[0] * r2[1] - r2[0] * r1[1];
  const c = [floor((r2[1] * sp[0] - r1[1] * (sp[1] * d + 1)) / dt), floor((-r2[0] * sp[0] + r1[0] * (sp[1] * d + 1)) / dt)];

  let md = PI, mp = [0, 0, 0];
  for (let s = 0; s < 4; s++) {
    const i = f[0] * (c[0] + s % 2) + f[1] * (c[1] + floor(s * .5));
    if (i > d) continue;
    const t = ((i * phiMinusOne) % 1) * kTau, cp = 1 - 2 * i * b, sp = sqrt(1 - cp * cp);
    const sm = [cos(t) * sp, sin(t) * sp, cp];
    const ds = sqrt((q[0] - sm[0]) ** 2 + (q[1] - sm[1]) ** 2 + (q[2] - sm[2]) ** 2);
    if (ds < md) md = ds, mp = sm;
  }
  return [mp[0], mp[2], mp[1]];
};

/**
 * mapMarkers(markers, dots)
 * Converts lat/lng marker definitions into pre-computed Fibonacci lattice
 * positions that the shader can use directly.
 *
 * @param {Array}  markers - Array of { location: [lat, lng], size, color? }
 * @param {number} dots    - mapSamples value
 * @returns {number[]} Flat array of vec4 pairs for the shader's markers uniform
 */
const mapMarkers = (markers, dots) => [].concat(...markers.map(m => {
  let [a, b] = m.location;
  a = a * PI / 180;
  b = b * PI / 180 - PI;
  const c = cos(a), p = [-c * cos(b), sin(a), c * sin(b)];
  const l = nearestFibonacciLattice(p, dots);
  return [...l, m.size, ...(m.color ? [...m.color, 1] : [0, 0, 0, 0])];
}), [0, 0, 0, 0, 0, 0, 0, 0]);

/**
 * createGlobe(canvas, opts)
 * Initialises a COBE globe on the given canvas element.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} opts
 *   @param {number}   opts.devicePixelRatio
 *   @param {number}   opts.width
 *   @param {number}   opts.height
 *   @param {number}   opts.phi            - Initial horizontal rotation (radians)
 *   @param {number}   opts.theta          - Initial vertical tilt (radians)
 *   @param {number}   opts.dark           - 0 = light globe, 1 = dark globe
 *   @param {number}   opts.diffuse        - Light diffusion (default: 1.2)
 *   @param {number}   opts.scale          - Globe scale (default: 1)
 *   @param {number}   opts.mapSamples     - Dot density (default: 16000)
 *   @param {number}   opts.mapBrightness  - Land dot brightness (default: 6)
 *   @param {number[]} opts.baseColor      - Ocean color [r, g, b] (0–1)
 *   @param {number[]} opts.markerColor    - Default marker color [r, g, b]
 *   @param {number[]} opts.glowColor      - Atmospheric glow color [r, g, b]
 *   @param {number[]} opts.offset         - Canvas offset [x, y]
 *   @param {Array}    opts.markers        - Location markers
 *   @param {function} opts.onRender       - Called every animation frame
 * @returns {Phenomenon} globe instance — call .destroy() to clean up
 */
export default function createGlobe(canvas, opts) {
  const createUniform = (type, name, fallback) => ({
    type,
    value: typeof opts[name] === "undefined" ? fallback : opts[name],
  });

  // Prefer webgl2, fall back gracefully
  const contextType = canvas.getContext("webgl2")
    ? "webgl2"
    : canvas.getContext("webgl")
      ? "webgl"
      : "experimental-webgl";

  const p = new Phenomenon({
    canvas,
    contextType,
    context: {
      alpha: true,
      stencil: false,
      antialias: true,
      depth: false,
      preserveDrawingBuffer: false,
      ...opts.context,
    },
    settings: {
      [OPT_DPR]: opts[OPT_DPR] || 1,
      onSetup: (gl) => {
        const RGBFormat = gl.RGB;
        const srcType   = gl.UNSIGNED_BYTE;
        const TEXTURE_2D = gl.TEXTURE_2D;

        // Initialise texture with a 1x1 black pixel, then load the real map
        const texture = gl.createTexture();
        gl.bindTexture(TEXTURE_2D, texture);
        gl.texImage2D(TEXTURE_2D, 0, RGBFormat, 1, 1, 0, RGBFormat, srcType, new Uint8Array([0, 0, 0, 0]));

        const image = new Image();
        image.onload = () => {
          gl.bindTexture(TEXTURE_2D, texture);
          gl.texImage2D(TEXTURE_2D, 0, RGBFormat, RGBFormat, srcType, image);
          gl.generateMipmap(TEXTURE_2D);

          const program = gl.getParameter(gl.CURRENT_PROGRAM);
          const textureLocation = gl.getUniformLocation(program, GLSLX_NAME_U_TEXTURE);
          gl.texParameteri(TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.uniform1i(textureLocation, 0);
        };
        image.src = TEXTURE;
      },
    },
  });

  p.add("", {
    vertex: `attribute vec3 aPosition;uniform mat4 uProjectionMatrix;uniform mat4 uModelMatrix;uniform mat4 uViewMatrix;void main(){gl_Position=uProjectionMatrix*uModelMatrix*uViewMatrix*vec4(aPosition,1.);}`,
    fragment: GLSLX_SOURCE_MAIN,
    uniforms: {
      [GLSLX_NAME_U_RESOLUTION]: { type: "vec2", value: [opts.width, opts.height] },
      [GLSLX_NAME_PHI]:          createUniform("float", OPT_PHI),
      [GLSLX_NAME_THETA]:        createUniform("float", OPT_THETA),
      [GLSLX_NAME_DOTS]:         createUniform("float", OPT_DOTS),
      [GLSLX_NAME_DOTS_BRIGHTNESS]:     createUniform("float", OPT_MAP_BRIGHTNESS),
      [GLSLX_NAME_MAP_BASE_BRIGHTNESS]: createUniform("float", OPT_MAP_BASE_BRIGHTNESS),
      [GLSLX_NAME_BASE_COLOR]:   createUniform("vec3",  OPT_BASE_COLOR),
      [GLSLX_NAME_MARKER_COLOR]: createUniform("vec3",  OPT_MARKER_COLOR),
      [GLSLX_NAME_DIFFUSE]:      createUniform("float", OPT_DIFFUSE),
      [GLSLX_NAME_GLOW_COLOR]:   createUniform("vec3",  OPT_GLOW_COLOR),
      [GLSLX_NAME_DARK]:         createUniform("float", OPT_DARK),
      [GLSLX_NAME_MARKERS]: {
        type: "vec4",
        value: mapMarkers(opts[OPT_MARKERS], opts[OPT_DOTS]),
      },
      [GLSLX_NAME_MARKERS_NUM]: {
        type: "float",
        value: opts[OPT_MARKERS].length * 2,
      },
      [GLSLX_NAME_OFFSET]: createUniform("vec2",  OPT_OFFSET, [0, 0]),
      [GLSLX_NAME_SCALE]:  createUniform("float", OPT_SCALE, 1),
      [GLSLX_NAME_OPACITY]:createUniform("float", OPT_OPACITY, 1),
    },
    mode: 4,
    geometry: {
      vertices: [
        { x: -100, y:  100, z: 0 },
        { x: -100, y: -100, z: 0 },
        { x:  100, y:  100, z: 0 },
        { x:  100, y: -100, z: 0 },
        { x: -100, y: -100, z: 0 },
        { x:  100, y:  100, z: 0 },
      ],
    },
    onRender: ({ uniforms }) => {
      let state = {};
      if (opts.onRender) {
        state = opts.onRender(state) || state;

        // Sync any option keys returned from onRender into shader uniforms
        for (const k in OPT_MAPPING) {
          if (state[k] !== undefined) {
            uniforms[OPT_MAPPING[k]].value = state[k];
          }
        }

        // Re-map markers if they were updated this frame
        if (state[OPT_MARKERS] !== undefined) {
          const currentDots = state[OPT_DOTS] !== undefined
            ? state[OPT_DOTS]
            : uniforms[GLSLX_NAME_DOTS].value;
          uniforms[GLSLX_NAME_MARKERS].value = mapMarkers(state[OPT_MARKERS], currentDots);
          uniforms[GLSLX_NAME_MARKERS_NUM].value = state[OPT_MARKERS].length;
        }

        // Update resolution if canvas was resized
        if (state.width && state.height) {
          uniforms[GLSLX_NAME_U_RESOLUTION].value = [state.width, state.height];
        }

        // Re-map markers if dot density changed
        if (state[OPT_DOTS] !== undefined) {
          uniforms[GLSLX_NAME_MARKERS].value = mapMarkers(
            state[OPT_MARKERS] || opts[OPT_MARKERS],
            state[OPT_DOTS]
          );
        }
      }
    },
  });

  return p;
}
