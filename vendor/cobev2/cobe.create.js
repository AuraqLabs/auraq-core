/**
 * @file cobe.create.js
 * Exports:
 *   - default createGlobe(canvas, opts)
 *
 * @description COBE v2 globe renderer. Adapted from upstream index.js for
 * use without a build step: shader sources are imported from cobe.shader.js
 * instead of being injected by esbuild, the world map texture is imported
 * from cobe.texture.js, and shader variable name constants are defined
 * inline (upstream injects these from the GLSLX compiler output).
 *
 * Key v2 changes over v1:
 *   - Raw WebGL replaces the Phenomenon library (cobe.phenomenon.js removed)
 *   - Three render passes: globe, arcs, markers (instanced drawing)
 *   - `globe.update(state)` replaces the onRender callback pattern
 *   - CSS anchor elements for DOM-positioned marker labels (cobe.anchor.js)
 *   - Firefox GLSL fix: human-readable shaders compile correctly on Firefox
 *
 * Original: https://github.com/shuding/cobe
 * Author: Shu Ding
 * License: MIT
 * Version: 2.0.1
 *
 * @module cobe/create
 * @author Shu Ding (original) -- vendored and adapted by KinuCyber
 * @license GPL-3.0
 */

import {
  createProgram,
  getUniformLocations,
  getAttribLocations,
} from './cobe.webgl.js'
import { createAnchorManager } from './cobe.anchor.js'
import {
  GLOBE_VERT,
  GLOBE_FRAG,
  MARKER_VERT,
  MARKER_FRAG,
  ARC_VERT,
  ARC_FRAG,
} from './cobe.shader.js'
import TEXTURE from './cobe.texture.js'

// ── Shader variable name constants ────────────────────────────────────────────
// These match the uniform/attribute names declared in cobe.shader.js.
// Upstream COBE injects these from the GLSLX compiler; here they are
// defined explicitly since we ship the shaders as human-readable strings.

// Globe fragment uniforms
const GLOBE_F_uResolution      = 'uResolution'
const GLOBE_F_rotation         = 'rotation'
const GLOBE_F_dots             = 'dots'
const GLOBE_F_scale            = 'scale'
const GLOBE_F_offset           = 'offset'
const GLOBE_F_baseColor        = 'baseColor'
const GLOBE_F_glowColor        = 'glowColor'
const GLOBE_F_renderParams     = 'renderParams'
const GLOBE_F_mapBaseBrightness = 'mapBaseBrightness'
const GLOBE_F_uTexture         = 'uTexture'

// Globe vertex attributes
const GLOBE_V_aPosition        = 'aPosition'

// Marker uniforms
const MARKER_phi               = 'phi'
const MARKER_theta             = 'theta'
const MARKER_uResolution       = 'uResolution'
const MARKER_scale             = 'scale'
const MARKER_offset            = 'offset'
const MARKER_markerColor       = 'markerColor'
const MARKER_markerElevation   = 'markerElevation'

// Marker attributes
const MARKER_aPosition         = 'aPosition'
const MARKER_aMarkerPos        = 'aMarkerPos'
const MARKER_aMarkerSize       = 'aMarkerSize'
const MARKER_aMarkerColor      = 'aMarkerColor'
const MARKER_aHasColor         = 'aHasColor'

// Arc uniforms
const ARC_phi                  = 'phi'
const ARC_theta                = 'theta'
const ARC_uResolution          = 'uResolution'
const ARC_scale                = 'scale'
const ARC_offset               = 'offset'
const ARC_arcColor             = 'arcColor'
const ARC_markerElevation      = 'markerElevation'

// Arc attributes
const ARC_aPosition            = 'aPosition'
const ARC_aArcFrom             = 'aArcFrom'
const ARC_aArcTo               = 'aArcTo'
const ARC_aArcHeight           = 'aArcHeight'
const ARC_aArcWidth            = 'aArcWidth'
const ARC_aArcColor            = 'aArcColor'
const ARC_aHasColor            = 'aHasColor'

// ─────────────────────────────────────────────────────────────────────────────

const { PI, sin, cos } = Math
const GLOBE_R           = 0.8

/**
 * Convert lat/lon to a 3D unit sphere position.
 * @param {[number, number]} location - [latitude, longitude] in degrees
 * @returns {[number, number, number]} [x, y, z]
 */
function latLonTo3D([lat, lon]) {
  const latRad = (lat * PI) / 180
  const lonRad = (lon * PI) / 180 - PI
  const cosLat = cos(latRad)
  return [-cosLat * cos(lonRad), sin(latRad), cosLat * sin(lonRad)]
}

/**
 * Create a COBE globe on the given canvas element.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object}  opts
 * @param {number}  opts.devicePixelRatio
 * @param {number}  opts.width
 * @param {number}  opts.height
 * @param {number}  opts.phi              - Initial horizontal rotation (radians)
 * @param {number}  opts.theta            - Initial vertical tilt (radians)
 * @param {number}  opts.dark             - 0 = light globe, 1 = dark globe
 * @param {number}  opts.diffuse          - Light diffusion (default: 1)
 * @param {number}  opts.scale            - Globe scale (default: 1)
 * @param {number}  opts.mapSamples       - Dot density (default: 10000; max ~32767)
 * @param {number}  opts.mapBrightness    - Land dot brightness (default: 1)
 * @param {number}  opts.mapBaseBrightness - Ocean base brightness (default: 0)
 * @param {number[]} opts.baseColor       - Ocean color [r, g, b] (0-1)
 * @param {number[]} opts.markerColor     - Default marker color [r, g, b]
 * @param {number[]} opts.glowColor       - Atmospheric glow [r, g, b]
 * @param {number[]} opts.offset          - Canvas offset [x, y] pixels
 * @param {number}  opts.opacity          - Globe opacity (default: 1)
 * @param {Array}   opts.markers          - Marker definitions
 * @param {Array}   opts.arcs             - Arc definitions (new in v2)
 * @param {number[]} opts.arcColor        - Default arc color [r, g, b]
 * @param {number}  opts.arcWidth         - Arc ribbon width (default: 1)
 * @param {number}  opts.arcHeight        - Arc elevation above globe (default: 0.2)
 * @param {number}  opts.markerElevation  - Marker elevation above globe (default: 0.05)
 * @returns {{ update: Function, destroy: Function }}
 */
export default (canvas, opts) => {
  const contextOpts = {
    alpha: true,
    stencil: false,
    antialias: true,
    depth: false,
    preserveDrawingBuffer: false,
    ...opts.context,
  }

  let gl = canvas.getContext('webgl2', contextOpts)
  const webgl2 = !!gl
  if (!gl) gl = canvas.getContext('webgl', contextOpts)
  if (!gl) return { destroy: () => {}, update: () => {} }

  // ANGLE_instanced_arrays extension for WebGL1 instancing
  const instExt = webgl2 ? null : gl.getExtension('ANGLE_instanced_arrays')

  const dpr       = opts.devicePixelRatio || 1
  canvas.width    = opts.width  * dpr
  canvas.height   = opts.height * dpr

  // Mutable state -- updated via globe.update()
  let phi               = opts.phi               || 0
  let theta             = opts.theta             || 0
  let markers           = opts.markers           || []
  let arcs              = opts.arcs              || []
  let mapSamples        = opts.mapSamples        || 10000
  let mapBrightness     = opts.mapBrightness     || 1
  let mapBaseBrightness = opts.mapBaseBrightness || 0
  let baseColor         = opts.baseColor         || [1, 1, 1]
  let markerColor       = opts.markerColor       || [1, 0.5, 0]
  let glowColor         = opts.glowColor         || [1, 1, 1]
  let arcColor          = opts.arcColor          || [0.3, 0.6, 1]
  let arcWidth          = opts.arcWidth          ?? 1
  let arcHeight         = opts.arcHeight         ?? 0.2
  let diffuse           = opts.diffuse           || 1
  let dark              = opts.dark              || 0
  let opacity           = opts.opacity           ?? 1
  let offsetOpt         = opts.offset            || [0, 0]
  let scaleOpt          = opts.scale             || 1
  let markerElevation   = opts.markerElevation   ?? 0.05

  // Compile shader programs
  const globeProgram  = createProgram(gl, GLOBE_VERT,  GLOBE_FRAG)
  const markerProgram = createProgram(gl, MARKER_VERT, MARKER_FRAG)
  const arcProgram    = createProgram(gl, ARC_VERT,    ARC_FRAG)
  if (!globeProgram) return { destroy: () => {}, update: () => {} }

  // Full-screen quad buffer (globe pass)
  const quadBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  )

  // Arc segment buffer: 33 (t, offset) pairs along the Bezier curve
  const arcSegmentBuffer = gl.createBuffer()
  const arcSegmentCount  = 66 // (32 + 1) * 2
  gl.bindBuffer(gl.ARRAY_BUFFER, arcSegmentBuffer)
  const segVerts = []
  for (let i = 0; i <= 32; i++) {
    const t = i / 32
    segVerts.push(t, -1, t, 1)
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(segVerts), gl.STATIC_DRAW)

  // Instance buffers (populated by updateMarkers / updateArcs)
  const markerInstanceBuffer = gl.createBuffer()
  const arcInstanceBuffer    = gl.createBuffer()

  // Resolve uniform/attribute locations
  const globeUniforms = getUniformLocations(gl, globeProgram, [
    GLOBE_F_uResolution, GLOBE_F_rotation, GLOBE_F_dots,
    GLOBE_F_scale, GLOBE_F_offset, GLOBE_F_baseColor,
    GLOBE_F_glowColor, GLOBE_F_renderParams,
    GLOBE_F_mapBaseBrightness, GLOBE_F_uTexture,
  ])

  const markerUniforms = getUniformLocations(gl, markerProgram, [
    MARKER_phi, MARKER_theta, MARKER_uResolution,
    MARKER_scale, MARKER_offset, MARKER_markerColor, MARKER_markerElevation,
  ])

  const markerAttribs = getAttribLocations(gl, markerProgram, [
    MARKER_aPosition, MARKER_aMarkerPos, MARKER_aMarkerSize,
    MARKER_aMarkerColor, MARKER_aHasColor,
  ])

  const arcUniforms = getUniformLocations(gl, arcProgram, [
    ARC_phi, ARC_theta, ARC_uResolution,
    ARC_scale, ARC_offset, ARC_arcColor, ARC_markerElevation,
  ])

  const arcAttribs = getAttribLocations(gl, arcProgram, [
    ARC_aPosition, ARC_aArcFrom, ARC_aArcTo,
    ARC_aArcHeight, ARC_aArcWidth, ARC_aArcColor, ARC_aHasColor,
  ])

  const globePositionAttrib = gl.getAttribLocation(globeProgram, GLOBE_V_aPosition)

  // Load world map texture
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0]))
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  const image = new Image()
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    update({})
  }
  image.src = TEXTURE

  // ── Instance data helpers ─────────────────────────────────────────────────

  /**
   * Upload marker positions, sizes and optional colors as instance data.
   * 8 floats per marker: [x, y, z, size, r, g, b, hasColor]
   * @param {Array} newMarkers
   */
  function updateMarkers(newMarkers) {
    markers = newMarkers
    const data = new Float32Array(markers.length * 8)
    markers.forEach((m, i) => {
      data.set([
        ...latLonTo3D(m.location),
        m.size,
        ...(m.color || [0, 0, 0]),
        m.color ? 1 : 0,
      ], i * 8)
    })
    gl.bindBuffer(gl.ARRAY_BUFFER, markerInstanceBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
  }

  let validArcCount = 0

  /**
   * Upload arc endpoint positions, heights, widths and optional colors.
   * 12 floats per arc: [from(3), to(3), height, width, color(3), hasColor]
   * @param {Array} newArcs
   */
  function updateArcs(newArcs) {
    arcs          = newArcs
    validArcCount = arcs.length
    const data    = new Float32Array(arcs.length * 12)
    arcs.forEach((arc, i) => {
      data.set([
        ...latLonTo3D(arc.from),
        ...latLonTo3D(arc.to),
        arcHeight + markerElevation,
        arcWidth * 0.005,
        ...(arc.color || [0, 0, 0]),
        arc.color ? 1 : 0,
      ], i * 12)
    })
    gl.bindBuffer(gl.ARRAY_BUFFER, arcInstanceBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
  }

  // ── Projection helpers (for CSS anchor positioning) ───────────────────────

  /**
   * Apply globe rotation to a 3D world-space point.
   * @param {[number, number, number]} p
   * @returns {[number, number, boolean]} [x, y, visible] in 0-1 screen space
   */
  function applyRotation(p) {
    const cx = Math.cos(theta), sx = Math.sin(theta)
    const cy = Math.cos(phi),   sy = Math.sin(phi)
    const aspect = canvas.width / canvas.height

    const rx =  cy * p[0] + sy * p[2]
    const ry =  sy * sx * p[0] + cx * p[1] - cy * sx * p[2]
    const rz = -sy * cx * p[0] + sx * p[1] + cy * cx * p[2]

    return [
      ((rx / aspect) * scaleOpt + offsetOpt[0] * scaleOpt * dpr / canvas.width  + 1) / 2,
      (-ry          * scaleOpt + offsetOpt[1] * scaleOpt * dpr / canvas.height + 1) / 2,
      rz >= 0 || rx * rx + ry * ry >= 0.64,
    ]
  }

  /**
   * Project a lat/lon location to 0-1 screen coordinates.
   * @param {[number, number]} location
   * @returns {{ x: number, y: number, visible: boolean }}
   */
  function project(location) {
    const p = latLonTo3D(location)
    const r = GLOBE_R + markerElevation
    const rotated = applyRotation([p[0] * r, p[1] * r, p[2] * r])
    return { x: rotated[0], y: rotated[1], visible: rotated[2] }
  }

  /**
   * Project arc midpoint (Bezier t=0.5) to 0-1 screen coordinates.
   * @param {{ from: [number, number], to: [number, number] }} arc
   * @returns {{ x: number, y: number, visible: boolean }|null}
   */
  function projectArcMidpoint(arc) {
    const f   = latLonTo3D(arc.from)
    const t   = latLonTo3D(arc.to)
    const mid = [f[0] + t[0], f[1] + t[1], f[2] + t[2]]
    const len = (mid[0] ** 2 + mid[1] ** 2 + mid[2] ** 2) ** 0.5
    if (len < 0.001) return null
    const s = 0.25 * (GLOBE_R + markerElevation)
            + 0.5  * (GLOBE_R + arcHeight + markerElevation) / len
    const rotated = applyRotation([mid[0] * s, mid[1] * s, mid[2] * s])
    return { x: rotated[0], y: rotated[1], visible: rotated[2] }
  }

  // ── Instanced draw helper ─────────────────────────────────────────────────

  /**
   * Set up a per-instance vertex attribute.
   * @param {number} attrib
   * @param {number} size   - Number of floats per instance
   * @param {number} stride - Total bytes per instance
   * @param {number} offset - Byte offset to this attribute
   * @param {number} divisor - 1 for per-instance, 0 for per-vertex
   */
  function setupInstancedAttribute(attrib, size, stride, offset, divisor) {
    if (attrib < 0) return
    gl.enableVertexAttribArray(attrib)
    gl.vertexAttribPointer(attrib, size, gl.FLOAT, false, stride, offset)
    if (webgl2)        gl.vertexAttribDivisor(attrib, divisor)
    else if (instExt)  instExt.vertexAttribDivisorANGLE(attrib, divisor)
  }

  /**
   * Draw a full-screen quad instanced `count` times.
   * @param {number} count
   */
  function drawInstanced(count) {
    if      (webgl2)   gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count)
    else if (instExt)  instExt.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, count)
    else {
      for (let i = 0; i < count; i++) gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
  }

  // ── CSS anchor wrapper ────────────────────────────────────────────────────

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:relative;width:100%;height:100%'
  canvas.parentElement?.insertBefore(wrapper, canvas)
  wrapper.append(canvas)
  const anchorManager = createAnchorManager(wrapper)

  // ── Main update / render ──────────────────────────────────────────────────

  const UNDEFINED = undefined

  /**
   * Apply state updates and re-render one frame.
   * Called by the consumer's rAF loop via globe.update({ phi }).
   * @param {Partial<COBEOptions>} state
   */
  function update(state) {
    if (state.phi             != UNDEFINED) phi               = state.phi
    if (state.theta           != UNDEFINED) theta             = state.theta
    if (state.markers)                      updateMarkers(state.markers)
    if (state.arcs)                         updateArcs(state.arcs)
    if (state.width && state.height) {
      canvas.width  = state.width  * dpr
      canvas.height = state.height * dpr
    }
    if (state.mapSamples        != UNDEFINED) mapSamples        = state.mapSamples
    if (state.mapBrightness     != UNDEFINED) mapBrightness     = state.mapBrightness
    if (state.mapBaseBrightness != UNDEFINED) mapBaseBrightness = state.mapBaseBrightness
    if (state.baseColor         != UNDEFINED) baseColor         = state.baseColor
    if (state.markerColor       != UNDEFINED) markerColor       = state.markerColor
    if (state.glowColor         != UNDEFINED) glowColor         = state.glowColor
    if (state.arcColor          != UNDEFINED) arcColor          = state.arcColor
    if (state.arcWidth          != UNDEFINED) arcWidth          = state.arcWidth
    if (state.arcHeight         != UNDEFINED) arcHeight         = state.arcHeight
    if (state.diffuse           != UNDEFINED) diffuse           = state.diffuse
    if (state.dark              != UNDEFINED) dark              = state.dark
    if (state.opacity           != UNDEFINED) opacity           = state.opacity
    if (state.offset            != UNDEFINED) offsetOpt         = state.offset
    if (state.scale             != UNDEFINED) scaleOpt          = state.scale
    if (state.markerElevation   != UNDEFINED) markerElevation   = state.markerElevation

    // Update CSS anchor positions for DOM-positioned markers and arcs
    anchorManager.m(markers, project)
    anchorManager.a(arcs, projectArcMidpoint)
    anchorManager.s()

    // Clear and configure blending
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // -- Pass 1: Globe --------------------------------------------------------

    gl.useProgram(globeProgram)
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.enableVertexAttribArray(globePositionAttrib)
    gl.vertexAttribPointer(globePositionAttrib, 2, gl.FLOAT, false, 0, 0)

    if      (webgl2)  gl.vertexAttribDivisor(globePositionAttrib, 0)
    else if (instExt) instExt.vertexAttribDivisorANGLE(globePositionAttrib, 0)

    gl.uniform2f(globeUniforms[GLOBE_F_uResolution], canvas.width, canvas.height)
    gl.uniform2f(globeUniforms[GLOBE_F_rotation],    phi, theta)
    gl.uniform1f(globeUniforms[GLOBE_F_dots],        mapSamples)
    gl.uniform1f(globeUniforms[GLOBE_F_scale],       scaleOpt)
    gl.uniform2f(globeUniforms[GLOBE_F_offset],      offsetOpt[0] * dpr, offsetOpt[1] * dpr)
    gl.uniform3fv(globeUniforms[GLOBE_F_baseColor],  baseColor)
    gl.uniform3fv(globeUniforms[GLOBE_F_glowColor],  glowColor)
    gl.uniform4f(globeUniforms[GLOBE_F_renderParams], mapBrightness, diffuse, dark, opacity)
    gl.uniform1f(globeUniforms[GLOBE_F_mapBaseBrightness], mapBaseBrightness)
    gl.uniform1i(globeUniforms[GLOBE_F_uTexture],    0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    // -- Pass 2: Arcs ---------------------------------------------------------

    if (arcProgram && validArcCount > 0) {
      gl.useProgram(arcProgram)

      gl.bindBuffer(gl.ARRAY_BUFFER, arcSegmentBuffer)
      if (arcAttribs[ARC_aPosition] >= 0) {
        gl.enableVertexAttribArray(arcAttribs[ARC_aPosition])
        gl.vertexAttribPointer(arcAttribs[ARC_aPosition], 2, gl.FLOAT, false, 0, 0)
        if      (webgl2)  gl.vertexAttribDivisor(arcAttribs[ARC_aPosition], 0)
        else if (instExt) instExt.vertexAttribDivisorANGLE(arcAttribs[ARC_aPosition], 0)
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, arcInstanceBuffer)
      const arcStride = 12 * 4
      setupInstancedAttribute(arcAttribs[ARC_aArcFrom],   3, arcStride,  0, 1)
      setupInstancedAttribute(arcAttribs[ARC_aArcTo],     3, arcStride, 12, 1)
      setupInstancedAttribute(arcAttribs[ARC_aArcHeight], 1, arcStride, 24, 1)
      setupInstancedAttribute(arcAttribs[ARC_aArcWidth],  1, arcStride, 28, 1)
      setupInstancedAttribute(arcAttribs[ARC_aArcColor],  3, arcStride, 32, 1)
      setupInstancedAttribute(arcAttribs[ARC_aHasColor],  1, arcStride, 44, 1)

      gl.uniform1f(arcUniforms[ARC_phi],            phi)
      gl.uniform1f(arcUniforms[ARC_theta],          theta)
      gl.uniform2f(arcUniforms[ARC_uResolution],    canvas.width, canvas.height)
      gl.uniform1f(arcUniforms[ARC_scale],          scaleOpt)
      gl.uniform2f(arcUniforms[ARC_offset],         offsetOpt[0] * dpr, offsetOpt[1] * dpr)
      gl.uniform3fv(arcUniforms[ARC_arcColor],      arcColor)
      gl.uniform1f(arcUniforms[ARC_markerElevation], markerElevation)

      if      (webgl2)  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, arcSegmentCount, validArcCount)
      else if (instExt) instExt.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, arcSegmentCount, validArcCount)
      else {
        for (let i = 0; i < validArcCount; i++) gl.drawArrays(gl.TRIANGLE_STRIP, 0, arcSegmentCount)
      }
    }

    // -- Pass 3: Markers ------------------------------------------------------

    if (markerProgram && markers.length > 0) {
      gl.useProgram(markerProgram)

      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
      if (markerAttribs[MARKER_aPosition] >= 0) {
        gl.enableVertexAttribArray(markerAttribs[MARKER_aPosition])
        gl.vertexAttribPointer(markerAttribs[MARKER_aPosition], 2, gl.FLOAT, false, 0, 0)
        if      (webgl2)  gl.vertexAttribDivisor(markerAttribs[MARKER_aPosition], 0)
        else if (instExt) instExt.vertexAttribDivisorANGLE(markerAttribs[MARKER_aPosition], 0)
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, markerInstanceBuffer)
      const markerStride = 8 * 4
      setupInstancedAttribute(markerAttribs[MARKER_aMarkerPos],   3, markerStride,  0, 1)
      setupInstancedAttribute(markerAttribs[MARKER_aMarkerSize],  1, markerStride, 12, 1)
      setupInstancedAttribute(markerAttribs[MARKER_aMarkerColor], 3, markerStride, 16, 1)
      setupInstancedAttribute(markerAttribs[MARKER_aHasColor],    1, markerStride, 28, 1)

      gl.uniform1f(markerUniforms[MARKER_phi],             phi)
      gl.uniform1f(markerUniforms[MARKER_theta],           theta)
      gl.uniform2f(markerUniforms[MARKER_uResolution],     canvas.width, canvas.height)
      gl.uniform1f(markerUniforms[MARKER_scale],           scaleOpt)
      gl.uniform2f(markerUniforms[MARKER_offset],          offsetOpt[0] * dpr, offsetOpt[1] * dpr)
      gl.uniform3fv(markerUniforms[MARKER_markerColor],    markerColor)
      gl.uniform1f(markerUniforms[MARKER_markerElevation], markerElevation)

      drawInstanced(markers.length)
    }
  }

  // Initial render (markers and arcs only; texture loads asynchronously)
  update({ markers, arcs })

  return { update, destroy: () => {
    gl.deleteBuffer(quadBuffer)
    gl.deleteBuffer(arcSegmentBuffer)
    gl.deleteBuffer(markerInstanceBuffer)
    gl.deleteBuffer(arcInstanceBuffer)
    gl.deleteProgram(globeProgram)
    if (markerProgram) gl.deleteProgram(markerProgram)
    if (arcProgram)    gl.deleteProgram(arcProgram)
    anchorManager.r()
  }}
}
