# cobe Module - API Reference

Renders an animated WebGL globe with a Fibonacci-lattice land dot-map, atmospheric glow, and location markers on any `<canvas>` element.

---

## HTML Contract

### Required HTML

```html
<canvas class="cobe" style="width: 500px; height: 500px" width="1000" height="1000"></canvas>
```

```javascript
import { initGlobe } from 'https://cdn.auraq.org/vendor/cobe/cobe.init.js';
document.addEventListener('DOMContentLoaded', () => {
  initGlobe();
});
```

The `width` and `height` attributes set the internal render resolution; the `style` dimensions control the display size. These can differ -- a 1000×1000 canvas displayed at 500×500 gives an effective DPR of 2 when `devicePixelRatio: 2` is passed to `createGlobe`.

### Element Discovery

| Name | Selector | Required | Description |
|---|---|---|---|
| Globe canvas | `.cobe` | Yes | The canvas element(s) on which the globe is rendered. `initGlobe` discovers all matches via `querySelectorAll('.cobe')` and creates a separate globe instance on each. |

### Corner Cases

- **Multiple canvases:** Every `.cobe` element found receives its own independent globe instance with its own `phi` closure, render loop, and WebGL context.
- **Mobile viewport (≤ 800 px):** All `.cobe` canvases are hidden via `display: none` at `initGlobe` call time and no WebGL context is ever created. The check is not reactive -- resizing the viewport after load does not create or destroy a globe.
- **No canvas found:** `initGlobe` logs `console.warn('initGlobe: no #cobe canvas found, skipping')` and returns `null`.
- **WebGL unavailable:** `createGlobe` attempts `webgl2`, falls back to `webgl`, then `experimental-webgl`. If none are available the `Phenomenon` renderer will throw and no globe is displayed.

---

## No-JS Behavior

The `<canvas>` element is present in the DOM but renders nothing -- browsers show only the canvas fallback content (empty by default). No WebGL context is acquired and no animation loop is started.

---

## Globe Rendering

COBE renders via a single full-screen quad (two triangles covering the entire canvas) driven by a fragment shader that ray-marches a unit sphere. The shader receives the world map as a small grayscale PNG texture (`cobe.texture.js`): white pixels are land, black pixels are ocean. Land dots are distributed uniformly across the sphere using a Fibonacci lattice, which ensures even spacing independent of latitude -- the same lattice algorithm runs both in JS (for marker snapping) and in the fragment shader (for dot placement), keeping them pixel-accurate.

### Rotation

The globe rotates by incrementing `phi` (horizontal) each animation frame inside the `onRender` callback. `initGlobe` hard-codes the step:

```js
const ROTATION_STEP = 0.006; // radians per frame -- ~21.6°/s at 60 fps
```

The vertical tilt (`theta: 0.4`) is fixed and does not animate. The initial horizontal position (`phi`) opens at `2` radians (roughly facing central Asia), which places the default Rawalpindi marker near center on load.

### Texture Loading

The map texture is injected as an inline base64 PNG to avoid a network round-trip. On setup, COBE initializes the WebGL texture unit with a 1×1 black pixel, then asynchronously replaces it when the `Image` element fires `onload`. The globe is fully functional during the brief window before the texture loads -- dots are simply not rendered.

### Mobile Guard

```js
const MOBILE_BREAKPOINT = 800; // px -- inclusive upper bound for the mobile skip
```

`initGlobe` reads `window.innerWidth` once at call time. At or below `800 px` all `.cobe` canvases are hidden and `createGlobe` is never called. This is not a responsive listener; it is a one-time guard at initialisation.

### Marker Snapping

Markers are specified in decimal-degree lat/lng but must align with the Fibonacci lattice that the shader uses for dot placement. `createGlobe` converts each marker's coordinates to a 3-D unit-sphere point and snaps it to the nearest lattice neighbor via `nearestFibonacciLattice()`. The snapped positions are passed to the shader as a flat `vec4` array. Increasing `mapSamples` tightens the lattice grid and allows finer marker placement.

---

## Exports

### cobe.init.js

#### `initGlobe(opts?)`

Composition root for Kinu sites. Discovers all `.cobe` canvases, applies the mobile guard, derives glow color from `themeColor`, then calls `createGlobe` on each canvas with site defaults merged from `opts`.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `opts.width` | `number` | `1000` | Internal render width passed as `opts.width` to `createGlobe` |
| `opts.height` | `number` | `1000` | Internal render height passed as `opts.height` to `createGlobe` |
| `opts.brightness` | `number` | `0.6` | Land dot brightness; forwarded as `mapBrightness` to `createGlobe` |
| `opts.themeColor` | `number[]` | `[0.08, 0.61, 0.28]` | Globe base color as `[r, g, b]` in 0–1 range. Used as `baseColor`. Glow is derived automatically as `themeColor * 0.6` per channel. |
| `opts.markers` | `Marker[]` | `[{ location: [33.670682, 72.957342], size: 0.03 }]` | Location markers. Defaults to a single pin at Rawalpindi, Pakistan. See Marker Schema below. |

**Returns** `null` when skipped (no canvas found, or mobile viewport); `undefined` otherwise (the `forEach` loop returns no value). Callers that need a handle to the Phenomenon instance should use `createGlobe` directly.

**Side effects:**
- Sets `canvas.style.display = 'none'` on all `.cobe` canvases when `window.innerWidth ≤ 800`.
- Emits `console.warn` when no `.cobe` element is found.
- Starts a `requestAnimationFrame` loop for each canvas via `createGlobe` / `Phenomenon`.

---

### cobe.create.js

#### `createGlobe(canvas, opts)`

Core factory. Wires the GLSL shader uniforms, loads the map texture, and starts the Phenomenon render loop on the provided canvas. Intended for advanced consumers that need direct control over canvas selection and all rendering options.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `canvas` | `HTMLCanvasElement` | -- | The canvas to render into |
| `opts.devicePixelRatio` | `number` | `1` | Pixel density multiplier |
| `opts.width` | `number` | -- | Internal render resolution width in pixels; must match the canvas `width` attribute |
| `opts.height` | `number` | -- | Internal render resolution height in pixels; must match the canvas `height` attribute |
| `opts.phi` | `number` | -- | Initial horizontal rotation in radians |
| `opts.theta` | `number` | -- | Initial vertical tilt in radians |
| `opts.dark` | `number` | -- | Globe darkness: `0` = fully lit, `1` = dark |
| `opts.diffuse` | `number` | `1.2` | Light diffusion coefficient |
| `opts.scale` | `number` | `1` | Globe scale multiplier |
| `opts.mapSamples` | `number` | -- | Fibonacci lattice dot count; higher values increase dot density and marker placement precision |
| `opts.mapBrightness` | `number` | -- | Land dot brightness |
| `opts.mapBaseBrightness` | `number` | -- | Base brightness applied to the map texture before dot compositing |
| `opts.baseColor` | `number[]` | -- | Ocean / base color as `[r, g, b]` in 0–1 range |
| `opts.markerColor` | `number[]` | -- | Default marker color as `[r, g, b]` in 0–1 range; overridden per-marker by `marker.color` |
| `opts.glowColor` | `number[]` | -- | Atmospheric glow color as `[r, g, b]` in 0–1 range |
| `opts.offset` | `number[]` | `[0, 0]` | Canvas offset `[x, y]` in pixels |
| `opts.opacity` | `number` | `1` | Globe opacity |
| `opts.markers` | `Marker[]` | -- | Location markers; see Marker Schema below |
| `opts.onRender` | `function` | -- | Callback invoked each animation frame; receives a plain state object and must return it; see `onRender` Contract below |

**Returns** `Phenomenon` -- the renderer instance. Call `.destroy()` to stop the render loop and free all WebGL resources.

**Side effects:**
- Acquires a WebGL2 / WebGL / experimental-webgl context on `canvas` (first available wins).
- Initializes a 1×1 black texture on the GPU, then asynchronously replaces it with the world map PNG once `Image.onload` fires.
- Attaches a `resize` listener to `window` via `Phenomenon`.
- Starts a `requestAnimationFrame` loop via `Phenomenon`.

#### Marker Schema

```js
{
  location: [lat, lng],  // decimal degrees -- lat: −90 to 90, lng: −180 to 180
  size:      0.03,       // dot radius in globe-space units
  color:    [r, g, b],  // optional -- overrides opts.markerColor for this marker; 0–1 range
}
```

#### `onRender` Contract

The callback receives a plain `state` object and must return it (or a mutated copy). Any key matching a `createGlobe` option name is synced to the corresponding shader uniform before the frame is drawn. The callback fires before each draw, so mutations take effect in the same frame.

```js
onRender: (state) => {
  state.phi = phi;  // advance horizontal rotation
  phi += 0.006;
  return state;     // must return state
}
```

Keys that trigger additional processing when written via `onRender`:

| Key | Extra processing |
|---|---|
| `markers` | All markers are re-snapped to the Fibonacci lattice and the `markers` and `markersNum` uniforms are updated |
| `mapSamples` | All markers (from `state.markers` or the original `opts.markers`) are re-snapped using the new dot density |
| `width` + `height` | The `u_resolution` shader uniform is updated |

---

## CSS Shipped by Auraq

None. This is a behavior-only module. All sizing, positioning, and layout of the `<canvas>` element is the site's responsibility.

---

## Generated DOM

None. COBE draws into a `<canvas>` provided by the site. No HTML elements are created or injected.

---

## Module Architecture

```
cobe.init.js        <- composition root -- canvas discovery, mobile guard, site defaults
cobe.create.js      <- WebGL factory -- shader wiring, texture loading, marker mapping, render loop
cobe.phenomenon.js  <- WebGL abstraction -- program/buffer/uniform/rAF management (vendored)
cobe.shader.js      <- GLSL fragment shader source and minified uniform name constants (vendored)
cobe.texture.js     <- world map as an inline base64 PNG data URI (vendored)
```

Import graph:

```
cobe.init.js -> cobe.create.js -> cobe.phenomenon.js
                               -> cobe.shader.js
                               -> cobe.texture.js
```

`cobe.init.js` is the recommended entry point for Kinu sites. `cobe.create.js` is available for consumers that need direct canvas and option control. `cobe.phenomenon.js`, `cobe.shader.js`, and `cobe.texture.js` are vendored internals and are not intended for direct import.
