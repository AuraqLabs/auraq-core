# sectionMap Module — API Reference

Scroll indicator UI module for Auraq Core. Renders a pill bar with one tick mark per `<section>` inside `<main>`, and an orange thumb that tracks the current scroll position. Clicking the bar animates to the nearest section. Dragging lerps `scrollTop` in real time and coasts with momentum on release. Both interactions yield immediately to the panning module when a pan gesture begins on `#main`.

---

## Consumer Usage

```javascript
import { initSectionMap } from 'https://cdn.auraq.org/modules/sectionMap/sectionMap.init.js';

document.addEventListener('DOMContentLoaded', () => {
  initSectionMap();
});
```

**Required HTML structure:**

```html
<div class="scrollContainer" id="main" data-panning-axis="y">
  <main>
    <section id="hero"    class="content-section"> ... </section>
    <section id="work"    class="content-section"> ... </section>
    <section id="contact" class="content-section"> ... </section>
    <section id="profile" class="content-section"> ... </section>
  </main>
</div>
```

`#main` must use `scroll-behavior: auto` — all three scrollers write `scrollTop` directly and must not fight a browser-managed smooth scroll.

---

## Module Architecture

```
sectionMap.init.js        ← composition root — discovery and wiring
sectionMap.controller.js  ← pointer events, scroll coordination, animation state
sectionMap.render.js      ← DOM creation and visual updates for bar, ticks, thumb
sectionMap.engine.js      ← scroll math, geometry, rAF loops
sectionMap.dom.js         ← all DOM reads and writes
```

Import graph (one-directional, no cycles):

```
init.js → dom.js
init.js → render.js → dom.js
init.js → controller.js → engine.js → dom.js
                        → render.js → dom.js
                        → dom.js
```

---

## Navigation Behaviour

| Gesture         | Mode                     | Behaviour                                                        |
|-----------------|--------------------------|------------------------------------------------------------------|
| Click (no drag) | `animateScrollTo`        | Eased 380ms animation to the nearest section's `offsetTop`       |
| Drag            | `createLerpScroller`     | `scrollTop` lerps toward pointer position each frame during drag |
| Drag release    | `createMomentumScroller` | Pointer velocity handed off; decays with friction until settled  |
| Pan on `#main`  | Yield                    | All sectionMap loops cancelled immediately on `pointerdown`      |

---

## Thumb and Tick Alignment

Ticks are positioned by CSS flex (`justify-content: space-evenly`). After the bar is in the DOM, `measureTickPositions()` reads where flex actually placed each tick. Separately, `computeSectionNorms()` maps each section's `offsetTop` to a normalized 0–1 scroll position.

These two arrays — `tickPositions` and `sectionNorms` — form a shared coordinate system used by `computeThumbPx`, `getNormalizedPositionFromPointer`, and `getSectionScrollTarget`. All three use per-segment interpolation rather than linear estimation, so the thumb lands exactly on tick `i` when section `i` is in view regardless of individual section heights.

A `ResizeObserver` on the bar re-measures both arrays whenever the bar resizes, keeping the responsive breakpoint in sync automatically.

---

## Exported Functions

---

### `sectionMap.init.js`

#### `initSectionMap(): void`

Entry point. Queries `#main` and all `main > section` elements, creates the bar, and hands everything to `createSectionMapController`.

- Warns and exits if `#main` is not found
- Warns and exits if no `main > section` elements exist

```javascript
initSectionMap();
```

---

### `sectionMap.controller.js`

#### `createSectionMapController(container, sections, bar, ticks, thumb): void`

Owns all pointer event handling, scroll coordination, and animation state for the sectionMap module. Called once by `init.js` after bar creation.

- Measures `tickPositions` and `sectionNorms` on creation
- Starts a `ResizeObserver` to re-measure both arrays on bar resize
- Starts a rAF tracking loop via `createTrackingLoop` — does **not** use a `scroll` event listener, avoiding Firefox's scroll-linked effect warning
- Listens for `pointerdown` on `#main` and cancels all active loops immediately, yielding `scrollTop` ownership to the panning module
- Binds `pointerdown`, `pointermove`, `pointerup`, `pointercancel` on the bar
- Tracks pointer velocity (`px/ms`) during drag for momentum handoff on release
- Exposes `bar._cancelSectionMapAnimation()` for optional cross-module use

| Parameter   | Type      | Description                          |
|-------------|-----------|--------------------------------------|
| `container` | Element   | `#main` scroll container             |
| `sections`  | Element[] | All `main > section` nodes           |
| `bar`       | Element   | The pill bar element                 |
| `ticks`     | Element[] | All tick mark elements               |
| `thumb`     | Element   | The thumb element                    |

**Cross-module cancellation:**

```javascript
const bar = document.querySelector('.sectionMap-bar');
if (bar?._cancelSectionMapAnimation) bar._cancelSectionMapAnimation();
```

---

### `sectionMap.render.js`

#### `createBar(sectionCount): { bar, ticks, thumb }`

Creates and injects the pill bar into `document.body`. Also injects a `<style>` block idempotently — safe to call multiple times, styles are only injected once.

| Parameter      | Type   | Description                    |
|----------------|--------|--------------------------------|
| `sectionCount` | number | Number of tick marks to render |

Returns `{ bar: Element, ticks: Element[], thumb: Element }`.

ARIA attributes set on the bar:

```html
role="scrollbar"
aria-orientation="horizontal"
aria-valuemin="0"
aria-valuemax="100"
aria-valuenow="0"   <!-- updated live by updateThumb -->
```

**Internal constants (private to `render.js`):**

| Constant      | Value | Description                                                    |
|---------------|-------|----------------------------------------------------------------|
| `BAR_PADDING` | `0`   | Horizontal padding (px) inside the bar — used in CSS only      |
| `THUMB_WIDTH` | `3`   | Width (px) of the thumb — used in CSS and thumb centering math |

---

#### `updateThumb(thumb, px, normalizedPosition): void`

Delegates the DOM write to `setThumbPosition` and `setAriaValue` in `dom.js`. Called by `controller.js` with a pre-computed pixel position from `computeThumbPx`.

| Parameter            | Type    | Description                               |
|----------------------|---------|-------------------------------------------|
| `thumb`              | Element | The thumb element                         |
| `px`                 | number  | Pixel X of the thumb centre               |
| `normalizedPosition` | number  | 0–1, used to update `aria-valuenow`       |

---

### `sectionMap.engine.js`

#### `computeSectionNorms(offsetTops, scrollable): number[]`

Pure function. Maps each section's `offsetTop` to its normalized scroll position (0–1).

| Parameter    | Type     | Description                                           |
|--------------|----------|-------------------------------------------------------|
| `offsetTops` | number[] | `offsetTop` of each section in px                     |
| `scrollable` | number   | `scrollHeight - clientHeight` of the scroll container |

Returns `number[]` — one value per section, clamped to [0, 1]. Returns all zeros if `scrollable ≤ 0`.

---

#### `computeThumbPx(normalizedPosition, tickPositions, sectionNorms): number`

Pure function. Returns the pixel X position the thumb centre should sit at, using per-segment interpolation between ticks.

| Parameter            | Type     | Description                                    |
|----------------------|----------|------------------------------------------------|
| `normalizedPosition` | number   | 0 (top) to 1 (bottom)                          |
| `tickPositions`      | number[] | Measured centre X of each tick in px           |
| `sectionNorms`       | number[] | Normalized scroll position of each section     |

Returns `number` — pixel X of thumb centre.

---

#### `normalizeScroll(container): number`

Returns the container's current scroll position as a 0–1 value.

| Parameter   | Type    | Description          |
|-------------|---------|----------------------|
| `container` | Element | The scroll container |

Returns `number` — clamped to [0, 1]. Returns `0` if container is not scrollable.

---

#### `createTrackingLoop(container, onUpdate): () => void`

Starts a rAF loop that polls `scrollTop` on every frame and calls `onUpdate` only when the value has changed.

| Parameter  | Type     | Description                                             |
|------------|----------|---------------------------------------------------------|
| `container`| Element  | The scroll container                                    |
| `onUpdate` | Function | Called with the new normalized position whenever `scrollTop` changes |

Returns a **stop function** — call it to cancel the loop.

```javascript
const stop = createTrackingLoop(container, (normalized) => { ... });
stop(); // cancel when done
```

---

#### `createLerpScroller(container): { setTarget, cancel }`

Returns a scroller that chases a moving target via lerp on each rAF tick. Used during drag so `scrollTop` follows the pointer with a natural ease-out feel.

| Parameter   | Type    | Description          |
|-------------|---------|----------------------|
| `container` | Element | The scroll container |

Returns an object with two methods:

| Method             | Description                                                           |
|--------------------|-----------------------------------------------------------------------|
| `setTarget(value)` | Updates the target `scrollTop`. Restarts the rAF loop if not running |
| `cancel()`         | Stops the loop immediately without snapping to the target            |

**Internal constants:**

| Constant       | Value   | Effect                                                       |
|----------------|---------|--------------------------------------------------------------|
| `LERP_FACTOR`  | `0.14`  | 14% of remaining distance per frame (~300ms settle at 60fps) |
| `SETTLE_DELTA` | `0.5px` | Snaps to target when within this distance, stopping the loop |

---

#### `createMomentumScroller(container): { kick, cancel }`

Returns a velocity-based momentum scroller for post-drag coast. Mirrors the momentum behaviour of the panning module.

| Parameter   | Type    | Description          |
|-------------|---------|----------------------|
| `container` | Element | The scroll container |

Returns an object with two methods:

| Method                  | Description                                                     |
|-------------------------|-----------------------------------------------------------------|
| `kick(initialVelocity)` | Starts momentum with the given velocity in `scrollTop px/frame` |
| `cancel()`              | Stops the loop and zeroes velocity immediately                  |

**Internal constants:**

| Constant      | Value  | Effect                                          |
|---------------|--------|-------------------------------------------------|
| `friction`    | `0.85` | Velocity multiplier per frame — matches panning |
| `minVelocity` | `0.3`  | px/frame — loop stops below this threshold      |

**Velocity conversion in `controller.js`:**

```javascript
const scale = scrollable / barWidth * 16; // 16ms ≈ one frame at 60fps
momentumScroller.kick(pointerVelX * scale);
```

`pointerVelX` is in `px/ms` tracked during drag. Multiplying by `scale` converts it to `scrollTop px/frame`, accounting for the ratio between bar width and total scrollable distance.

---

#### `animateScrollTo(container, targetScrollTop): () => void`

Animates `scrollTop` to `targetScrollTop` using rAF and design-system easing over 380ms. Used for clean click navigation only.

| Parameter         | Type    | Description              |
|-------------------|---------|--------------------------|
| `container`       | Element | The scroll container     |
| `targetScrollTop` | number  | Target `scrollTop` value |

Returns a **cancel function** — call it to abort the animation at any point.

---

#### `getSectionScrollTarget(sections, normalizedPosition, sectionNorms): number`

Nearest-neighbor search — maps a 0–1 normalized position to the `offsetTop` of the closest section.

| Parameter            | Type      | Description                                |
|----------------------|-----------|--------------------------------------------|
| `sections`           | Element[] | Array of `main > section` nodes            |
| `normalizedPosition` | number    | 0–1 position                               |
| `sectionNorms`       | number[]  | Normalized scroll position of each section |

Returns `number` — the `offsetTop` of the nearest section.

---

#### `getNormalizedPositionFromPointer(bar, pointerX, tickPositions, sectionNorms): number`

Inverse of `computeThumbPx` — maps a pixel position on the bar back to a normalized 0–1 scroll value.

| Parameter       | Type      | Description                                |
|-----------------|-----------|--------------------------------------------|
| `bar`           | Element   | The pill bar element                       |
| `pointerX`      | number    | `e.clientX` from pointer event             |
| `tickPositions` | number[]  | Measured centre X of each tick in px       |
| `sectionNorms`  | number[]  | Normalized scroll position of each section |

Returns `number` — clamped to [0, 1].

---

### `sectionMap.dom.js`

All DOM reads and writes for the module pass through here. No math, no constants — pure I/O.

#### Measurement

| Function                         | Returns    | Description                                         |
|----------------------------------|------------|-----------------------------------------------------|
| `measureTickPositions(ticks)`    | `number[]` | Centre X of each tick in px, read from rendered DOM |
| `getSectionOffsetTops(sections)` | `number[]` | `offsetTop` of each section                         |
| `getScrollable(container)`       | `number`   | `scrollHeight − clientHeight`                       |
| `getBarRect(bar)`                | `DOMRect`  | Bounding client rect of the pill bar                |

#### Discovery

| Function               | Returns         | Description                   |
|------------------------|-----------------|-------------------------------|
| `getScrollContainer()` | `Element\|null` | Returns `#main`               |
| `getSections()`        | `Element[]`     | All `main > section` elements |

#### Container reads/writes

| Function                         | Returns  | Description                  |
|----------------------------------|----------|------------------------------|
| `getScrollTop(container)`        | `number` | `container.scrollTop`        |
| `getScrollHeight(container)`     | `number` | `container.scrollHeight`     |
| `getClientHeight(container)`     | `number` | `container.clientHeight`     |
| `setScrollTop(container, value)` | `void`   | Writes `container.scrollTop` |
| `getSectionOffsetTop(section)`   | `number` | `section.offsetTop`          |

#### Visual writes

| Function                        | Returns | Description                             |
|---------------------------------|---------|-----------------------------------------|
| `setThumbPosition(thumb, px)`   | `void`  | Writes `thumb.style.transform`          |
| `setAriaValue(element, value)`  | `void`  | Writes `aria-valuenow` on the bar       |

---

## Design Tokens Used

| Element | Value                       | Derivation               |
|---------|-----------------------------|--------------------------|
| Bar bg  | `rgba(20, 10, 10, 0.88)`    | `--primary-color` at 88% |
| Border  | `rgba(255, 255, 255, 0.22)` | White at 22% opacity     |
| Ticks   | `rgb(125, 125, 125)`        | Neutral mid-grey         |
| Thumb   | `rgb(255, 145, 36)`         | `--theme-color` direct   |

Motion: easing approximates `cubic-bezier(0.22, 1, 0.36, 1)`. Click animation: 380ms (within the design system panel range of 300–450ms). Drag lerp settles in ~300ms at 60fps. Momentum friction: `0.85` per frame, matching the panning module.

**Responsive:** At `≤800px`, the bar switches from `right: 256px` fixed positioning to `width: 90vw` centred at the bottom of the viewport (`bottom: 20px`). `ResizeObserver` re-measures tick positions and section norms on this transition automatically.

---

## Co-existence with the Panning Module

sectionMap and panning share `#main` as their scroll container but are fully decoupled — neither imports the other.

**Ownership rules:**

- `scrollTop` is owned by whoever last touched it
- sectionMap yields on `pointerdown` on `#main` — all active rAF loops (lerp, momentum, animation) are cancelled before panning's handler runs
- Panning yields to sectionMap on bar interaction — `e.stopPropagation()` on the bar's `pointerdown` prevents it reaching panning's listener on `#main`
- `scroll-behavior: auto` on `#main` must not be changed — all three scrollers rely on `scrollTop` writes taking effect immediately

**Cross-module cancellation (optional):**

```javascript
const bar = document.querySelector('.sectionMap-bar');
if (bar?._cancelSectionMapAnimation) bar._cancelSectionMapAnimation();
```

> Developed with AI assistance
