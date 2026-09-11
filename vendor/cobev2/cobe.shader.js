/**
 * @file cobe.shader.js
 * Exports:
 *   - GLOBE_VERT
 *   - GLOBE_FRAG
 *   - MARKER_VERT
 *   - MARKER_FRAG
 *   - ARC_VERT
 *   - ARC_FRAG
 *
 * @description GLSL shader sources for COBE v2, converted from GLSLX to
 * plain GLSL for use without a build step. In upstream COBE these are
 * injected at build time by esbuild + a GLSLX plugin. Here they are
 * exported as ES module string constants and imported by cobe.create.js.
 *
 * V2 shaders are human-readable (not minified), which also fixes the
 * Firefox GLSL compilation failure present in v1's minified shader string.
 *
 * Original: https://github.com/shuding/cobe
 * License: MIT
 *
 * @module cobe/shader
 * @author Shu Ding (original) -- vendored and adapted by KinuCyber
 * @license GPL-3.0
 */

// ── Globe vertex shader ───────────────────────────────────────────────────────

export const GLOBE_VERT = /* glsl */`
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

// ── Globe fragment shader ─────────────────────────────────────────────────────
// Fibonacci sphere lattice lookup maps each screen-space fragment to the
// nearest dot on the globe surface to determine land vs ocean.

export const GLOBE_FRAG = /* glsl */`
precision highp float;

uniform vec2 uResolution;
uniform vec2 offset;
uniform vec2 rotation;
uniform float dots;
uniform float scale;
uniform vec3 baseColor;
uniform vec3 glowColor;
uniform vec4 renderParams;
uniform float mapBaseBrightness;
uniform sampler2D uTexture;

const float sqrt5 = 2.236068;
const float PI    = 3.141593;
const float kTau  = 6.283185;
const float kPhi  = 1.618034;
const float r     = 0.8;

float byDots;

mat3 rotate(float theta, float phi) {
  float cx = cos(theta), cy = cos(phi);
  float sx = sin(theta), sy = sin(phi);
  return mat3(
    cy,  sy * sx, -sy * cx,
    0.0, cx,       sx,
    sy,  cy * -sx, cy * cx
  );
}

vec3 nearestFibonacciLattice(vec3 p, out float m) {
  p = p.xzy;
  float k   = max(2.0, floor(log2(sqrt5 * dots * PI * (1.0 - p.z * p.z)) * 0.72021));
  vec2  f   = floor(pow(kPhi, k) / sqrt5 * vec2(1.0, kPhi) + 0.5);
  vec2  br1 = fract((f + 1.0) * (kPhi - 1.0)) * kTau - 3.883222;
  vec2  br2 = -2.0 * f;
  vec2  sp  = vec2(atan(p.y, p.x), p.z - 1.0);
  vec2  c   = floor(vec2(
    br2.y * sp.x - br1.y * (sp.y * dots + 1.0),
    -br2.x * sp.x + br1.x * (sp.y * dots + 1.0)
  ) / (br1.x * br2.y - br2.x * br1.y));

  float mindist = PI;
  vec3  minip;

  for (float s = 0.0; s < 4.0; s += 1.0) {
    vec2  o   = vec2(mod(s, 2.0), floor(s * 0.5));
    float idx = dot(f, c + o);
    if (idx > dots) continue;

    float a = idx, b = 0.0;
    if (a >= 16384.0) { a -= 16384.0; b += 0.868872; }
    if (a >=  8192.0) { a -=  8192.0; b += 0.934436; }
    if (a >=  4096.0) { a -=  4096.0; b += 0.467218; }
    if (a >=  2048.0) { a -=  2048.0; b += 0.733609; }
    if (a >=  1024.0) { a -=  1024.0; b += 0.866804; }
    if (a >=   512.0) { a -=   512.0; b += 0.433402; }
    if (a >=   256.0) { a -=   256.0; b += 0.216701; }
    if (a >=   128.0) { a -=   128.0; b += 0.108351; }
    if (a >=    64.0) { a -=    64.0; b += 0.554175; }
    if (a >=    32.0) { a -=    32.0; b += 0.777088; }
    if (a >=    16.0) { a -=    16.0; b += 0.888544; }
    if (a >=     8.0) { a -=     8.0; b += 0.944272; }
    if (a >=     4.0) { a -=     4.0; b += 0.472136; }
    if (a >=     2.0) { a -=     2.0; b += 0.236068; }
    if (a >=     1.0) { a -=     1.0; b += 0.618034; }

    float theta  = fract(b) * kTau;
    float cosphi = 1.0 - 2.0 * idx * byDots;
    float sinphi = sqrt(1.0 - cosphi * cosphi);
    vec3  sample = vec3(cos(theta) * sinphi, sin(theta) * sinphi, cosphi);
    float dist   = length(p - sample);

    if (dist < mindist) { mindist = dist; minip = sample; }
  }

  m = mindist;
  return minip.xzy;
}

void main() {
  byDots = 1.0 / dots;

  vec2 invRes = 1.0 / uResolution;
  vec2 uv     = ((gl_FragCoord.xy * invRes) * 2.0 - 1.0) / scale
                - offset * vec2(1.0, -1.0) * invRes;
  uv.x *= uResolution.x * invRes.y;

  float l          = dot(uv, uv);
  float glowFactor = 0.0;
  vec4  color      = vec4(0.0);

  if (l <= r * r) {
    float dis;
    vec3  p      = normalize(vec3(uv, sqrt(r * r - l)));
    mat3  rot    = rotate(rotation.y, rotation.x);
    float dotNL  = p.z;

    vec3 gP      = nearestFibonacciLattice(p * rot, dis);
    float gPhi   = asin(gP.y);
    float gTheta = acos(-gP.x / cos(gPhi));
    if (gP.z < 0.0) gTheta = -gTheta;

    float mapColor = max(
      texture2D(uTexture, vec2((gTheta * 0.5) / PI, -(gPhi / PI + 0.5))).x,
      mapBaseBrightness
    );

    float s = mapColor
      * smoothstep(0.008, 0.0, dis)
      * pow(dotNL, renderParams.y)
      * renderParams.x;

    vec4 layer = vec4(
      baseColor * (mix((1.0 - s) * pow(dotNL, 0.4), s, renderParams.z) + 0.1)
      + pow(1.0 - dotNL, 4.0) * glowColor,
      1.0
    );

    color      += layer * (1.0 + renderParams.w) * 0.5;
    glowFactor  = (1.0 - l) * (1.0 - l) * smoothstep(0.0, 1.0, 0.2 / (l - r * r));

  } else {
    float outD = sqrt(0.2 / (l - r * r));
    glowFactor = smoothstep(0.5, 1.0, outD / (outD + 1.0));
  }

  gl_FragColor = color + vec4(glowFactor * glowColor, glowFactor);
}
`

// ── Marker vertex shader ──────────────────────────────────────────────────────
// Instanced: one quad per marker. Markers behind the globe are clipped by
// projecting their gl_Position off-screen.

export const MARKER_VERT = /* glsl */`
precision highp float;

varying vec2  vUV;
varying vec3  vMarkerColor;
varying float vHasColor;

attribute vec2  aPosition;
attribute vec3  aMarkerPos;
attribute float aMarkerSize;
attribute vec3  aMarkerColor;
attribute float aHasColor;

uniform float phi;
uniform float theta;
uniform vec2  uResolution;
uniform float scale;
uniform vec2  offset;
uniform float markerElevation;

void main() {
  float cx = cos(theta), sx = sin(theta);
  float cy = cos(phi),   sy = sin(phi);

  vec3 p  = aMarkerPos * (0.8 + markerElevation);
  vec3 rp = vec3(
     cy * p.x + sy * p.z,
     sy * sx * p.x + cx * p.y - cy * sx * p.z,
    -sy * cx * p.x + sx * p.y + cy * cx * p.z
  );

  // Clip markers behind the globe
  if (rp.z < 0.0 && length(rp.xy) < 0.8) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    return;
  }

  float ia    = uResolution.y / uResolution.x;
  vec2  pos   = (rp.xy + aPosition * aMarkerSize * 2.0)
                * vec2(ia, 1.0) * scale
                + offset * vec2(1.0, -1.0) * scale / uResolution;

  gl_Position  = vec4(pos, 0.0, 1.0);
  vUV          = aPosition;
  vMarkerColor = aMarkerColor;
  vHasColor    = aHasColor;
}
`

// ── Marker fragment shader ────────────────────────────────────────────────────

export const MARKER_FRAG = /* glsl */`
precision highp float;

varying vec2  vUV;
varying vec3  vMarkerColor;
varying float vHasColor;

uniform vec3 markerColor;

void main() {
  if (length(vUV) > 0.25) discard;
  vec3 col     = vHasColor > 0.5 ? vMarkerColor : markerColor;
  gl_FragColor = vec4(col, 1.0);
}
`

// ── Arc vertex shader ─────────────────────────────────────────────────────────
// Instanced: one ribbon (TRIANGLE_STRIP of 33 segments) per arc.
// Arc path is a quadratic Bezier from from-point to to-point via a midpoint
// elevated above the globe surface by aArcHeight.

export const ARC_VERT = /* glsl */`
precision highp float;

const float GLOBE_R = 0.8;

varying vec3  vArcColor;
varying float vHasColor;
varying float vDepth;
varying float vRadialDist;

attribute vec2  aPosition;
attribute vec3  aArcFrom;
attribute vec3  aArcTo;
attribute float aArcHeight;
attribute float aArcWidth;
attribute vec3  aArcColor;
attribute float aHasColor;

uniform float phi;
uniform float theta;
uniform vec2  uResolution;
uniform float scale;
uniform vec2  offset;
uniform float markerElevation;

mat3 rotate(float theta, float phi) {
  float cx = cos(theta), cy = cos(phi);
  float sx = sin(theta), sy = sin(phi);
  return mat3(
    cy,  sy * sx, -sy * cx,
    0.0, cx,       sx,
    sy,  cy * -sx, cy * cx
  );
}

vec3 bezierPoint(vec3 p0, vec3 p1, vec3 p2, float t) {
  float u = 1.0 - t;
  return u * u * p0 + 2.0 * u * t * p1 + t * t * p2;
}

vec3 bezierTangent(vec3 p0, vec3 p1, vec3 p2, float t) {
  float u = 1.0 - t;
  return 2.0 * u * (p1 - p0) + 2.0 * t * (p2 - p1);
}

void main() {
  mat3 rot = rotate(theta, phi);

  float endpointR = GLOBE_R + markerElevation;
  vec3  from      = aArcFrom * endpointR;
  vec3  to        = aArcTo   * endpointR;

  vec3  midSum = aArcFrom + aArcTo;
  float midLen = length(midSum);
  vec3  midDir = midLen > 0.001 ? midSum / midLen : vec3(0.0, 1.0, 0.0);
  vec3  mid    = midDir * (GLOBE_R + aArcHeight);

  float t          = aPosition.x;
  vec3  arcPoint   = bezierPoint(from, mid, to, t);
  vec3  rotated    = rot * arcPoint;

  vec3  rawTangent     = bezierTangent(from, mid, to, t);
  vec3  rotatedTangent = rot * rawTangent;
  vec2  screenTan      = rotatedTangent.xy;
  float screenTanLen   = length(screenTan);
  vec2  screenPerp     = screenTanLen > 0.001
    ? vec2(-screenTan.y, screenTan.x) / screenTanLen
    : vec2(1.0, 0.0);

  float aspect      = uResolution.x / uResolution.y;
  vec2  basePos     = rotated.xy * vec2(1.0 / aspect, 1.0) * scale
                      + offset * vec2(1.0, -1.0) * scale / uResolution;
  vec2  screenPos   = basePos + screenPerp * aArcWidth * aPosition.y * scale;

  gl_Position  = vec4(screenPos, 0.0, 1.0);
  vArcColor    = aArcColor;
  vHasColor    = aHasColor;
  vDepth       = rotated.z;
  vRadialDist  = length(rotated.xy);
}
`

// ── Arc fragment shader ───────────────────────────────────────────────────────

export const ARC_FRAG = /* glsl */`
precision highp float;

const float GLOBE_R = 0.8;

varying vec3  vArcColor;
varying float vHasColor;
varying float vDepth;
varying float vRadialDist;

uniform vec3 arcColor;

void main() {
  // Discard arc fragments behind the globe and inside the sphere silhouette
  if (vDepth < 0.0 && vRadialDist < GLOBE_R) discard;
  vec3 col     = vHasColor > 0.5 ? vArcColor : arcColor;
  gl_FragColor = vec4(col, 1.0);
}
`
