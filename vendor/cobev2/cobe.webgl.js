/**
 * @file cobe.webgl.js
 * Exports:
 *   - createProgram(gl, vertSrc, fragSrc)
 *   - getUniformLocations(gl, program, names)
 *   - getAttribLocations(gl, program, names)
 *
 * @description Lightweight WebGL utility layer for COBE v2.
 * Replaces cobe.phenomenon.js (the Phenomenon library used in v1) with
 * minimal raw WebGL helpers. No external dependencies.
 *
 * Original: https://github.com/shuding/cobe
 * License: MIT
 *
 * @module cobe/webgl
 * @author Shu Ding (original) -- vendored and adapted by KinuCyber
 * @license GPL-3.0
 */

/**
 * Compile a shader from source.
 * @param {WebGLRenderingContext} gl
 * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param {string} source
 * @returns {WebGLShader|null}
 */
function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/**
 * Link a program from vertex and fragment shader sources.
 * @param {WebGLRenderingContext} gl
 * @param {string} vertSrc
 * @param {string} fragSrc
 * @returns {WebGLProgram|null}
 */
export function createProgram(gl, vertSrc, fragSrc) {
  const vert = createShader(gl, gl.VERTEX_SHADER, vertSrc)
  const frag = createShader(gl, gl.FRAGMENT_SHADER, fragSrc)
  if (!vert || !frag) return null

  const program = gl.createProgram()
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }

  gl.deleteShader(vert)
  gl.deleteShader(frag)

  return program
}

/**
 * Resolve uniform locations for an array of name strings.
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string[]} names
 * @returns {Object.<string, WebGLUniformLocation>}
 */
export function getUniformLocations(gl, program, names) {
  const locations = {}
  for (const name of names) {
    locations[name] = gl.getUniformLocation(program, name)
  }
  return locations
}

/**
 * Resolve attribute locations for an array of name strings.
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string[]} names
 * @returns {Object.<string, number>}
 */
export function getAttribLocations(gl, program, names) {
  const locations = {}
  for (const name of names) {
    locations[name] = gl.getAttribLocation(program, name)
  }
  return locations
}
