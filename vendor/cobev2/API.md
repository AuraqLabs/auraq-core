# COBEv2 Module - API Reference

Renders an animated WebGL globe with a Fibonacci-lattice land dot-map, atmospheric glow, location markers, and Bezier arc connections, with optional CSS-anchored DOM overlays for labels and tooltips.

---

## HTML Contract

### Required HTML

```html
<canvas class="cobev2" style="width: 500px; height: 500px" width="1000" height="1000"></canvas>
```

```javascript
import { initGlobeV2 } from 'https://cdn.auraq.org/vendor/cobev2/cobe.init.js';
document.addEventListener('DOMContentLoaded', () => {
  initGlobeV2();
});
```


The `width` and `height` attributes set the internal render resolution; the inline `style` dimensions control the display size. The canvas must be attached to the DOM before `initGlobe` or `createGlobe` is called — `createGlobe` reads `canvas.parentElement` immediately to insert the wrapper div.

### Element Discovery

| Name | Selector | Required | Description |
|---|---|---|---|
| Globe canvas | `.cobe` | Yes | The canvas element(s) on which the globe is rendered. `initGlobe` discovers all matches via `querySelectorAll('.cobe')` and creates a separate globe instance on each. |

### Corner Cases

- **Multiple canvases:** Every `.cobe` element receives its own independent globe instance with its own rAF loop, WebGL context, and wrapper div.
- **Mobile viewport (≤ 800 px):** All `.cobe` canvases are hidden via `display: none` at `initGlobe` call time and no WebGL context is created. The check is not reactive — resizing the window after load does not create or destroy a globe.
- **No canvas found:** `initGlobe` logs `console.warn('initGlobe: no .cobe canvas found, skipping')` and returns `null`.
- **WebGL unavailable:** `createGlobe` attempts `webgl2`, falls back to `webgl`. If neither is available it returns a no-op `{ update: () => {}, destroy: () => {} }` without throwing.
- **Globe shader failure:** If `globeProgram` fails to compile or link, `createGlobe` returns the same no-op object.
- **Canvas not in DOM:** `createGlobe` uses optional chaining — `canvas.parentElement?.insertBefore(wrapper, canvas)`. If the canvas has no parent, the wrapper is created but not inserted and CSS anchor positioning will not work.
- **CSS Anchor Positioning support:** The `anchor-name` / `position-anchor` CSS properties used by DOM overlays are available in Chrome 125+. On unsupported browsers the anchor divs and visibility flags are still written each frame, but `position-anchor` in consumer CSS has no effect.

---

## No-JS Behavior

The `<canvas>` element is present in the DOM but renders nothing — browsers display only the canvas fallback content (empty by default). No WebGL context is acquired, no wrapper is inserted, and no animation loop is started.

---

## Globe Rendering

### Three-Pass Rendering

Each call to `globe.update(state)` redraws the canvas in three sequential WebGL passes. All three passes share the same context; alpha blending is enabled with `SRC_ALPHA / ONE_MINUS_SRC_ALPHA`. The globe surface has a clip-space radius of `GLOBE_R = 0.8`.

| Pass | Draw call | Geometry | Skip condition |
|---|---|---|---|
| 1 — Globe | `drawArrays(TRIANGLES, 0, 6)` | Full-screen quad (2 triangles). Fragment shader ray-marches the sphere and samples the land texture. | Never skipped |
| 2 — Arcs | `drawArraysInstanced(TRIANGLE_STRIP, 0, 66, n)` | One 33-segment Bezier ribbon per arc. | Skipped when `arcs` is empty |
| 3 — Markers | `drawArraysInstanced(TRIANGLES, 0, 6, n)` | One billboard quad per marker. | Skipped when `markers` is empty |

Arcs are drawn before markers so markers always composite on top.

**Arc geometry.** Each arc path is a quadratic Bezier from `from` to `to` via an apex elevated at `GLOBE_R + arcHeight + markerElevation` from the origin. The apex direction is the normalized average of the two endpoint unit vectors. The ribbon is a `TRIANGLE_STRIP` of 66 vertices — 33 cross-sections × 2 ribbon edges. Screen-space half-width is `arcWidth × 0.005`. Fragments behind the globe silhouette are discarded in `ARC_FRAG` when `vDepth < 0.0 && vRadialDist < GLOBE_R`.

**Marker geometry.** Each marker is a billboard quad (6 vertices, instanced). Markers are circular discs: fragments beyond radius 0.25 in UV space are discarded in `MARKER_FRAG`. The vertex shader clips markers fully behind the globe by projecting their `gl_Position` off-screen when `rp.z < 0.0 && length(rp.xy) < 0.8`.

**GPU instance layouts.** Buffer layouts are fixed by `updateMarkers` and `updateArcs`:

| Buffer | Floats per instance | Layout |
|---|---|---|
| `markerInstanceBuffer` | 8 | `[x, y, z, size, r, g, b, hasColor]` |
| `arcInstanceBuffer` | 12 | `[fromX, fromY, fromZ, toX, toY, toZ, height, width, r, g, b, hasColor]` |

**WebGL1 fallback.** On WebGL1 contexts, `ANGLE_instanced_arrays` is used for instancing. If that extension is also unavailable, instanced passes fall back to a sequential `for` loop — one `drawArrays` call per instance.

### Animation Loop

V2 removes the `onRender` callback. The consumer drives the `requestAnimationFrame` loop externally and calls `globe.update()` each frame to apply state and redraw:

```js
// v2 pattern — used by initGlobe internally
function animate() {
  phi    += 0.006   // ~21.6°/s at 60 fps
  globe.update({ phi })
  requestAnimationFrame(animate)
}
requestAnimationFrame(animate)
```

`initGlobe` manages this loop internally and exposes a `cancel()` function to stop it. Consumers using `createGlobe` directly are responsible for their own rAF loop and must call `globe.update()` to trigger redraws. `createGlobe` does not start a loop automatically.

The `phi` closure in `initGlobe` is initialised to `2` (≈ 114°), so the globe opens facing central Asia regardless of the `phi: 0` passed to `createGlobe` — the rAF loop writes `phi = 2.006` on the first frame.

### Texture Loading

The world map is inlined as a base64 PNG to avoid a network round-trip. The texture unit is initialised with a 1×1 black pixel before `Image.onload` fires. When the image loads, `update({})` is called internally to redraw with the real texture. The globe renders fully — without land dots — during the brief load window.

### Mobile Guard

```js
const MOBILE_BREAKPOINT = 800  // px — inclusive upper bound for the mobile skip
```

`initGlobe` reads `window.innerWidth` once at call time. At or below 800 px all `.cobe` canvases are hidden and `createGlobe` is never called. The guard is not a `resize` listener — it fires once at initialisation only.

---

## CSS Anchor System

V2 introduces CSS-anchored DOM overlays: for each marker or arc that carries an `id`, an invisible 1 px `<div>` is created and repositioned over that globe point every frame. Consumer DOM elements — labels, tooltips, stat chips — can use CSS Anchor Positioning to follow their point with zero JavaScript.

### Visibility Flag

Each frame, `cobe.anchor.js` writes a `--cobe-visible-<id>` custom property to `:root` when the point faces the viewer, and deletes it when the point rotates behind the globe. The value when set is the string `'N'`. Consumers use it as a toggle via the CSS `var()` fallback:

```css
.my-label {
  position: fixed;
  position-anchor: --cobe-sf;
  top:  anchor(center);
  left: anchor(center);
  opacity:    var(--cobe-visible-sf, 0);   /* 0 when hidden, 'N' (truthy) when visible */
  transition: opacity 150ms ease;
}
```

The visibility test in `applyRotation` is:
```js
rz >= 0 || rx * rx + ry * ry >= 0.64  // true when in front of or outside the globe silhouette
```

### Style Tag Update

The style element content is replaced each frame with the current visibility variable block. A string comparison guards against unnecessary DOM writes:

```js
const next = ':root{' + vars + '}'
if (next !== styleEl.textContent) styleEl.textContent = next
```

**Known issue (upstream #119).** Replacing `styleEl.textContent` each frame causes the Chrome DevTools Styles panel to appear empty while the globe is running. Production rendering is unaffected.

### Browser Support

`anchor-name` and `position-anchor` are available in Chrome 125+. On other browsers, anchor divs and `:root` variables are still written correctly each frame, but `position-anchor` in consumer CSS has no effect.

---

## Exports

### cobe.init.js

#### `initGlobe(opts?)`

Composition root for Kinu sites. Discovers all `.cobe` canvases, applies the mobile guard, derives `glowColor` from `themeColor`, creates a globe on each canvas, and starts an independent rAF loop.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `opts.width` | `number` | `1000` | Internal render width passed to `createGlobe` |
| `opts.height` | `number` | `1000` | Internal render height passed to `createGlobe` |
| `opts.brightness` | `number` | `0.6` | Land dot brightness; forwarded as `mapBrightness` |
| `opts.themeColor` | `number[]` | `[0.08, 0.61, 0.28]` | Globe base color as `[r, g, b]` in 0–1 range. Glow is auto-derived as `themeColor × 0.6` per channel. |
| `opts.markers` | `Marker[]` | `[{ location: [33.670682, 72.957342], size: 0.03 }]` | Location markers. Defaults to a single pin at Rawalpindi, Pakistan. See Marker Schema. |
| `opts.arcs` | `Arc[]` | `[]` | Arc connections. See Arc Schema. |

**Returns** `Array<{ globe: object, cancel: Function }> | null`

Returns `null` when skipped (no canvas found, or mobile viewport). On success, returns one entry per `.cobe` canvas:

| Field | Type | Description |
|---|---|---|
| `globe` | `object` | The `{ update, destroy }` object from `createGlobe` |
| `cancel()` | `Function` | Cancels the rAF loop via `cancelAnimationFrame` and calls `globe.destroy()` |

**Side effects:**
- Sets `canvas.style.display = 'none'` on all `.cobe` canvases when `window.innerWidth ≤ 800`.
- Emits `console.warn` when no `.cobe` element is found.
- Inserts a `position:relative` wrapper `<div>` around each canvas (via `createGlobe`).
- Appends a `<style>` element to `<head>` per canvas (via `createGlobe`).
- Starts one `requestAnimationFrame` loop per canvas.

---

### cobe.create.js

#### `createGlobe(canvas, opts)`

Core factory. Compiles three shader programs, allocates GPU buffers, loads the map texture, inserts the CSS anchor wrapper, and returns `{ update, destroy }`. Does not start an animation loop.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `canvas` | `HTMLCanvasElement` | — | Canvas to render into |
| `opts.devicePixelRatio` | `number` | `1` | Pixel density multiplier; canvas dimensions are set to `opts.width * dpr` and `opts.height * dpr` |
| `opts.width` | `number` | — | Render width in pixels (before DPR multiplication) |
| `opts.height` | `number` | — | Render height in pixels (before DPR multiplication) |
| `opts.phi` | `number` | `0` | Initial horizontal rotation in radians |
| `opts.theta` | `number` | `0` | Initial vertical tilt in radians |
| `opts.dark` | `number` | `0` | Globe darkness: `0` = fully lit, `1` = dark |
| `opts.diffuse` | `number` | `1` | Light diffusion coefficient |
| `opts.scale` | `number` | `1` | Globe scale multiplier |
| `opts.mapSamples` | `number` | `10000` | Fibonacci lattice dot count. Higher values increase dot density and tighten marker snap precision. Practical max is ~32767. |
| `opts.mapBrightness` | `number` | `1` | Land dot brightness |
| `opts.mapBaseBrightness` | `number` | `0` | Ocean base brightness added to the texture sample before dot compositing |
| `opts.baseColor` | `number[]` | `[1, 1, 1]` | Ocean / base color as `[r, g, b]` in 0–1 range |
| `opts.markerColor` | `number[]` | `[1, 0.5, 0]` | Default marker color as `[r, g, b]`; overridden per-marker by `marker.color` |
| `opts.glowColor` | `number[]` | `[1, 1, 1]` | Atmospheric glow color as `[r, g, b]` |
| `opts.arcColor` | `number[]` | `[0.3, 0.6, 1]` | Default arc color as `[r, g, b]`; overridden per-arc by `arc.color` |
| `opts.arcWidth` | `number` | `1` | Arc ribbon half-width. Multiplied by `0.005` internally; `arcWidth: 1` yields a thin ribbon in screen space. |
| `opts.arcHeight` | `number` | `0.2` | Arc apex elevation above the globe endpoints in globe-space units. Apex sits at `GLOBE_R + arcHeight + markerElevation` from the origin. |
| `opts.markerElevation` | `number` | `0.05` | Elevation of markers and arc endpoints above `GLOBE_R` in globe-space units |
| `opts.offset` | `number[]` | `[0, 0]` | Canvas offset `[x, y]` in pixels |
| `opts.opacity` | `number` | `1` | Globe opacity |
| `opts.markers` | `Marker[]` | `[]` | Location markers. See Marker Schema. |
| `opts.arcs` | `Arc[]` | `[]` | Arc connections. See Arc Schema. |

**Returns** `{ update: Function, destroy: Function }`

On WebGL unavailability or shader compilation failure, returns `{ update: () => {}, destroy: () => {} }` without throwing.

**Side effects:**
- Acquires a WebGL2 or WebGL context on `canvas` (WebGL2 preferred).
- Sets `canvas.width` and `canvas.height` to `opts.width * dpr` and `opts.height * dpr`.
- Inserts a `position:relative` wrapper `<div>` before the canvas in its parent and re-parents the canvas into it.
- Appends a `<style>` element to `<head>`.
- Loads the map texture asynchronously; calls `update({})` on `Image.onload`.
- Calls `update({ markers, arcs })` immediately after setup for the initial render.

#### Marker Schema

```js
{
  location: [lat, lng],  // decimal degrees — lat: −90 to 90, lng: −180 to 180
  size:      0.03,       // disc radius in globe-space units
  id:       'sf',        // optional — enables CSS anchor (anchor-name: --cobe-sf)
  color:    [r, g, b],  // optional — overrides opts.markerColor for this marker; 0–1 range
}
```

#### Arc Schema

```js
{
  from:  [lat, lng],   // arc start point in decimal degrees
  to:    [lat, lng],   // arc end point in decimal degrees
  id:    'sf-ny',      // optional — enables CSS anchor at arc midpoint (anchor-name: --cobe-arc-sf-ny)
  color: [r, g, b],   // optional — overrides opts.arcColor for this arc; 0–1 range
}
```

#### `globe.update(state)`

Apply state changes and redraw one frame. All fields are optional — pass only what changed.

```js
globe.update({ phi })                              // advance horizontal rotation
globe.update({ markers: updatedMarkers })          // swap marker list; re-uploads GPU buffer
globe.update({ arcs: updatedArcs })               // swap arc list; re-uploads GPU buffer
globe.update({ baseColor: [0.05, 0.05, 0.15] })   // change ocean color live
globe.update({ width: 800, height: 800 })          // resize canvas (both keys required together)
```

All `createGlobe` option keys are accepted as `state` keys. Passing `markers` or `arcs` triggers a full GPU instance-buffer re-upload. Passing `width` and `height` together resizes the canvas (DPR-multiplied internally). Passing only one of `width` / `height` is a no-op for canvas resize.

#### `globe.destroy()`

Frees all WebGL resources and removes all CSS anchor DOM. Does **not** cancel the consumer's rAF loop — that must be stopped separately before calling `destroy()`, or by using `cancel()` from `initGlobe`.

Deleted resources:
- WebGL buffers: `quadBuffer`, `arcSegmentBuffer`, `markerInstanceBuffer`, `arcInstanceBuffer`
- WebGL programs: `globeProgram`, `markerProgram` (if compiled), `arcProgram` (if compiled)
- All marker and arc anchor divs (via `anchorManager.r()`)
- The `<style>` element in `<head>` (via `anchorManager.r()`)

**The wrapper `<div>` inserted around the canvas is not removed by `destroy()`.** It remains in the DOM. Consumers that need to fully detach the globe must remove the wrapper manually after calling `destroy()`.

---

## CSS Custom Properties

These properties are written to `:root` each frame by the CSS Anchor System. They exist only for markers and arcs that carry an `id` field.

| Property | Default | Controls |
|---|---|---|
| `--cobe-visible-<id>` | *(unset)* | Set to `'N'` on `:root` while marker `<id>` faces the viewer; deleted when the marker rotates behind the globe. Consume as `opacity: var(--cobe-visible-sf, 0)`. |
| `--cobe-visible-arc-<id>` | *(unset)* | Set to `'N'` on `:root` while arc `<id>`'s Bezier midpoint faces the viewer; deleted otherwise. |

The `anchor-name` values (`--cobe-<id>` and `--cobe-arc-<id>`) are inline styles on the generated anchor divs, not custom properties on `:root`. They cannot be read via `getComputedStyle` / `getPropertyValue`.

---

## Generated DOM

`createGlobe` creates and manages the following elements. The site must not author these elements directly.

| Element | Lifecycle | Description |
|---|---|---|
| `<div style="position:relative;width:100%;height:100%">` | Created on `createGlobe`. **Not removed by `destroy()`.** | Wrapper inserted before the canvas in its parent; the canvas is re-parented into it. Consumer CSS targeting the canvas's direct parent may need adjustment. Must be removed manually if full detachment is needed. |
| `<div style="position:absolute;width:1px;height:1px;pointer-events:none;anchor-name:--cobe-<id>">` | Created on first `update()` for a marker with `id`. Removed when the marker leaves the `markers` array or on `destroy()`. | Invisible positioning anchor for a marker. Repositioned each frame to the marker's screen-space coordinates. |
| `<div style="position:absolute;width:1px;height:1px;pointer-events:none;anchor-name:--cobe-arc-<id>">` | Created on first `update()` for an arc with `id`. Removed when the arc leaves the `arcs` array or on `destroy()`. | Invisible positioning anchor placed at the arc's Bezier midpoint (t = 0.5). Repositioned each frame. |
| `<style>` in `<head>` | Created on `createGlobe`. Removed on `destroy()`. | Content is replaced each frame with the current `--cobe-visible-*` block. One style element per globe instance. |

---

## Module Architecture

```
cobe.init.js     <- composition root — canvas discovery, mobile guard, rAF loop, site defaults
cobe.create.js   <- WebGL factory — three-pass rendering, state management, GPU buffers, anchor wiring
cobe.webgl.js    <- WebGL utilities — shader compilation, program linking, uniform/attrib resolution (internal)
cobe.anchor.js   <- CSS anchor manager — wrapper div, 1px anchor divs, :root visibility variables (internal)
cobe.shader.js   <- GLSL shader sources — GLOBE_VERT/FRAG, MARKER_VERT/FRAG, ARC_VERT/FRAG (internal)
cobe.texture.js  <- World map as an inline base64 PNG data URI (internal)
```

Import graph:

```
cobe.init.js -> cobe.create.js -> cobe.webgl.js
                               -> cobe.anchor.js
                               -> cobe.shader.js
                               -> cobe.texture.js
```

`cobe.init.js` is the recommended entry point for Kinu sites. `cobe.create.js` is available for consumers that need direct control over the canvas, all rendering options, and the rAF loop. The four remaining files are vendored internals and are not intended for direct import by consumer sites.
