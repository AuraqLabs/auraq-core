# sectionMap Module - API Reference

Renders a fixed pill bar with one tick per `<section>` in `<main>` and an animated thumb that tracks and controls the scroll position.

> See also: [panning](../panning/API.md) - shares `#main` as scroll container; read the Relationship section before integrating both modules.

---

## HTML Contract

### Required HTML

```javascript
import { initSectionMap } from 'https://cdn.auraq.org/modules/sectionMap/sectionMap.init.js';

document.addEventListener('DOMContentLoaded', () => {
  initSectionMap();
});
```

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

### Element Discovery

| Name | Selector | Required | Description |
|---|---|---|---|
| Scroll container | `#main` | Yes | Primary scroll container. Receives all `scrollTop` writes from sectionMap. |
| Semantic main | `main` (child of `#main`) | Yes | Queried by `getSections()`; also observed by `ResizeObserver` to detect layout changes. |
| Section | `main > section` | Yes (>= 1) | One tick mark is rendered per section. Module warns and exits if none are found. |

### Required Site CSS

```css
[data-js] #main {
  scroll-behavior: auto;
}
```

Gated under `[data-js]` following the project's progressive enhancement pattern - without JS, sectionMap never runs and the site is free to use smooth scrolling. When JS is active, all three scrollers (`animateScrollTo`, `createLerpScroller`, `createMomentumScroller`) write `scrollTop` directly; `scroll-behavior: smooth` on `#main` would cause the browser to intercept these writes with its own animation, fighting the module's rAF loops.

### Corner Cases

- If `#main` is absent, `initSectionMap` warns to the console and exits without creating the bar.
- If no `main > section` elements exist, `initSectionMap` warns and exits.
- If `scrollHeight <= clientHeight` (content does not overflow), `computeSectionNorms` returns all zeros and the thumb rests at tick 0.

---

## No-JS Behavior

Without JavaScript, no bar is created and the page displays its sections in normal document flow. The HTML is fully readable and no sectionMap elements appear in the DOM.

---

## Navigation Behavior

| Gesture         | Mode                     | Behavior                                                        |
|---|---|---|
| Click (no drag) | `animateScrollTo`        | Eased 380ms animation to the nearest section's `offsetTop`       |
| Drag            | `createLerpScroller`     | `scrollTop` lerps toward pointer position each frame during drag |
| Drag release    | `createMomentumScroller` | Pointer velocity handed off; decays with friction until settled  |
| Pan on `#main`  | Yield                    | All sectionMap loops cancelled immediately on `pointerdown`      |

Motion: easing approximates `cubic-bezier(0.22, 1, 0.36, 1)` from the design system. Click animation duration is 380ms - within the design system panel range of 300-450ms. Drag lerp settles in ~300ms at 60fps. Momentum friction is `0.85` per frame, matching the panning module.

**Responsive:** At `<= 800px`, the bar switches from `right: 256px` fixed positioning to `width: 90vw` centered at the bottom of the viewport (`bottom: 20px`). `ResizeObserver` re-measures tick positions and section norms on this layout transition automatically.

---

## Thumb and Tick Alignment

Ticks are positioned by CSS flex (`justify-content: space-evenly`). After the bar is in the DOM, `measureTickPositions()` reads where flex actually placed each tick. Separately, `computeSectionNorms()` maps each section's `offsetTop` to a normalized 0-1 scroll position.

These two arrays - `tickPositions` and `sectionNorms` - form a shared coordinate system used by `computeThumbPx`, `getNormalizedPositionFromPointer`, and `getSectionScrollTarget`. All three use per-segment interpolation rather than linear estimation, so the thumb lands exactly on tick `i` when section `i` is in view regardless of individual section heights.

A `ResizeObserver` watches both the bar and `<main>` and re-measures both arrays on any resize, keeping the coordinate system in sync across the responsive breakpoint.

---

## Exports

### sectionMap.init.js

#### `initSectionMap(): void`

Entry point. Queries `#main` and all `main > section` elements, creates the bar, and hands everything to `createSectionMapController`.

- Warns and exits if `#main` is not found
- Warns and exits if no `main > section` elements exist

---

### sectionMap.controller.js

#### `createSectionMapController(container, sections, bar, ticks, thumb): void`

Owns all pointer event handling, scroll coordination, and animation state. Called once by `init.js` after bar creation.

| Parameter   | Type      | Description                |
|---|---|---|
| `container` | Element   | `#main` scroll container   |
| `sections`  | Element[] | All `main > section` nodes |
| `bar`       | Element   | The pill bar element       |
| `ticks`     | Element[] | All tick mark elements     |
| `thumb`     | Element   | The thumb element          |

- Measures `tickPositions` and `sectionNorms` on creation; a `ResizeObserver` on the bar and `<main>` re-measures both on any layout change
- Starts a rAF tracking loop via `createTrackingLoop` to keep the thumb in sync as `scrollTop` changes
- Listens for `pointerdown` on `#main` and cancels all active loops immediately, yielding `scrollTop` ownership to the panning module
- Binds `pointerdown`, `pointermove`, `pointerup`, `pointercancel` on the bar
- Tracks pointer velocity (`px/ms`) during drag for momentum handoff on release
- Exposes `bar._cancelSectionMapAnimation()` for optional cross-module use

**Cross-module cancellation:**

```javascript
const bar = document.querySelector('.sectionMap-bar');
if (bar?._cancelSectionMapAnimation) bar._cancelSectionMapAnimation();
```

---

### sectionMap.render.js

#### `createBar(sectionCount): { bar, ticks, thumb }`

Creates and injects the pill bar into `document.body`. Also injects a `<style>` block idempotently - safe to call multiple times, styles are only injected once.

| Parameter      | Type   | Description                    |
|---|---|---|
| `sectionCount` | number | Number of tick marks to render |

Returns `{ bar: Element, ticks: Element[], thumb: Element }`.

**Side effects:** appends `.sectionMap-bar` (containing all ticks and the thumb) to `document.body`; appends a `<style id="sectionMap-styles">` to `document.head` on first call.

**ARIA attributes set on creation:**

| Attribute           | Value        | Notes                                               |
|---|---|---|
| `role`              | `scrollbar`  | Set once on creation                                |
| `aria-orientation`  | `horizontal` | Set once on creation                                |
| `aria-valuemin`     | `0`          | Set once on creation                                |
| `aria-valuemax`     | `100`        | Set once on creation                                |
| `aria-valuenow`     | `0`-`100`    | Initial `0`; updated live by `updateThumb` on every scroll |

**Internal constants (private to `render.js`):**

| Constant      | Value | Description                                                     |
|---|---|---|
| `BAR_PADDING` | `0`   | Horizontal padding (px) inside the bar - used in CSS only       |
| `THUMB_WIDTH` | `3`   | Width (px) of the thumb - used in CSS and thumb centering math  |

---

#### `updateThumb(thumb, px, normalizedPosition): void`

Delegates the DOM write to `setThumbPosition` and `setAriaValue` in `dom.js`. Called by `controller.js` with a pre-computed pixel position from `computeThumbPx`.

| Parameter            | Type    | Description                         |
|---|---|---|
| `thumb`              | Element | The thumb element                   |
| `px`                 | number  | Pixel X of the thumb center         |
| `normalizedPosition` | number  | 0-1, used to update `aria-valuenow` |

---

### sectionMap.engine.js

#### `computeSectionNorms(offsetTops, scrollable): number[]`

Pure function. Maps each section's `offsetTop` to its normalized scroll position (0-1).

| Parameter    | Type     | Description                                           |
|---|---|---|
| `offsetTops` | number[] | `offsetTop` of each section in px                     |
| `scrollable` | number   | `scrollHeight - clientHeight` of the scroll container |

Returns `number[]` - one value per section, clamped to [0, 1]. Returns all zeros if `scrollable <= 0`.

---

#### `computeThumbPx(normalizedPosition, tickPositions, sectionNorms): number`

Pure function. Returns the pixel X position the thumb center should sit at, using per-segment interpolation between ticks.

| Parameter            | Type     | Description                                |
|---|---|---|
| `normalizedPosition` | number   | 0 (top) to 1 (bottom)                      |
| `tickPositions`      | number[] | Measured center X of each tick in px       |
| `sectionNorms`       | number[] | Normalized scroll position of each section |

Returns `number` - pixel X of thumb center.

---

#### `normalizeScroll(container): number`

Returns the container's current scroll position as a 0-1 value.

| Parameter   | Type    | Description          |
|---|---|---|
| `container` | Element | The scroll container |

Returns `number` - clamped to [0, 1]. Returns `0` if container is not scrollable.

---

#### `createTrackingLoop(container, onUpdate): () => void`

Starts a rAF loop that polls `scrollTop` on every frame and calls `onUpdate` only when the value has changed. Avoids the Firefox scroll-linked effect warning by never listening to the `scroll` event.

| Parameter   | Type     | Description                                                          |
|---|---|---|
| `container` | Element  | The scroll container                                                 |
| `onUpdate`  | Function | Called with the new normalized position whenever `scrollTop` changes |

Returns a **stop function** - call it to cancel the loop.

```javascript
const stop = createTrackingLoop(container, (normalized) => { ... });
stop(); // cancel when done
```

---

#### `createLerpScroller(container): { setTarget, cancel }`

Returns a scroller that chases a moving target via lerp on each rAF tick. Used during drag so `scrollTop` follows the pointer with a natural ease-out feel.

| Parameter   | Type    | Description          |
|---|---|---|
| `container` | Element | The scroll container |

Returns an object with two methods:

| Method             | Description                                                            |
|---|---|
| `setTarget(value)` | Updates the target `scrollTop`. Restarts the rAF loop if not running. |
| `cancel()`         | Stops the loop immediately without snapping to the target.             |

**Internal constants:**

| Constant       | Value | Effect                                                        |
|---|---|---|
| `LERP_FACTOR`  | `0.14` | 14% of remaining distance per frame (~300ms settle at 60fps) |
| `SETTLE_DELTA` | `0.5`  | Snaps to target when within 0.5px, stopping the loop         |

---

#### `createMomentumScroller(container): { kick, cancel }`

Returns a velocity-based momentum scroller for post-drag coast. Mirrors the momentum behavior of the panning module.

| Parameter   | Type    | Description          |
|---|---|---|
| `container` | Element | The scroll container |

Returns an object with two methods:

| Method                  | Description                                                      |
|---|---|
| `kick(initialVelocity)` | Starts momentum with the given velocity in `scrollTop px/frame`. |
| `cancel()`              | Stops the loop and zeroes velocity immediately.                   |

**Internal constants:**

| Constant      | Value  | Effect                                           |
|---|---|---|
| `friction`    | `0.85` | Velocity multiplier per frame - matches panning  |
| `minVelocity` | `0.3`  | px/frame - loop stops below this threshold       |

**Velocity conversion in `controller.js`:**

```javascript
const scale = scrollable / barWidth * 16; // 16ms ~= one frame at 60fps
momentumScroller.kick(pointerVelX * scale);
```

`pointerVelX` is in `px/ms` tracked during drag. Multiplying by `scale` converts it to `scrollTop px/frame`, accounting for the ratio between bar width and total scrollable distance.

---

#### `animateScrollTo(container, targetScrollTop): () => void`

Animates `scrollTop` to `targetScrollTop` using rAF and design-system easing over 380ms. Used for click navigation only - drag and momentum use their own scrollers.

| Parameter         | Type    | Description              |
|---|---|---|
| `container`       | Element | The scroll container     |
| `targetScrollTop` | number  | Target `scrollTop` value |

Returns a **cancel function** - call it to abort the animation at any point.

---

#### `getSectionScrollTarget(sections, normalizedPosition, sectionNorms): number`

Nearest-neighbor search - maps a 0-1 normalized position to the `offsetTop` of the closest section.

| Parameter            | Type      | Description                                |
|---|---|---|
| `sections`           | Element[] | Array of `main > section` nodes            |
| `normalizedPosition` | number    | 0-1 position                               |
| `sectionNorms`       | number[]  | Normalized scroll position of each section |

Returns `number` - the `offsetTop` of the nearest section.

---

#### `getNormalizedPositionFromPointer(bar, pointerX, tickPositions, sectionNorms): number`

Inverse of `computeThumbPx` - maps a pixel position on the bar back to a normalized 0-1 scroll value.

| Parameter       | Type      | Description                                |
|---|---|---|
| `bar`           | Element   | The pill bar element                       |
| `pointerX`      | number    | `e.clientX` from pointer event             |
| `tickPositions` | number[]  | Measured center X of each tick in px       |
| `sectionNorms`  | number[]  | Normalized scroll position of each section |

Returns `number` - clamped to [0, 1].

---

### sectionMap.state.js

#### `createSectionMapState(): object`

Factory that returns the initial pointer and animation state object. Used internally by `createSectionMapController` only - not intended for cross-module use.

Returns `{ cancelAnimation, isDragging, hasMoved, lastPointerX, lastPointerT, pointerVelX }`.

---

### sectionMap.dom.js

All DOM reads and writes for the module pass through here. No math, no constants - pure I/O.

#### Measurement

| Function                         | Returns    | Description                                          |
|---|---|---|
| `measureTickPositions(ticks)`    | `number[]` | Centre X of each tick in px, read from rendered DOM  |
| `getSectionOffsetTops(sections)` | `number[]` | `offsetTop` of each section                          |
| `getScrollable(container)`       | `number`   | `scrollHeight - clientHeight`                        |
| `getBarRect(bar)`                | `DOMRect`  | Bounding client rect of the pill bar                 |

#### Discovery

| Function               | Returns          | Description                   |
|---|---|---|
| `getScrollContainer()` | `Element\|null`  | Returns `#main`               |
| `getSections()`        | `Element[]`      | All `main > section` elements |

#### Container reads/writes

| Function                         | Returns  | Description                  |
|---|---|---|
| `getScrollTop(container)`        | `number` | `container.scrollTop`        |
| `getScrollHeight(container)`     | `number` | `container.scrollHeight`     |
| `getClientHeight(container)`     | `number` | `container.clientHeight`     |
| `setScrollTop(container, value)` | `void`   | Writes `container.scrollTop` |
| `getSectionOffsetTop(section)`   | `number` | `section.offsetTop`          |

#### Visual writes

| Function                       | Returns | Description                       |
|---|---|---|
| `setThumbPosition(thumb, px)`  | `void`  | Writes `thumb.style.transform`    |
| `setAriaValue(element, value)` | `void`  | Writes `aria-valuenow` on the bar |

---

## CSS Custom Properties

| Property | Default | Controls |
|---|---|---|
| `--sectionMap-bar-bg`      | `color-mix(in srgb, var(--bg-color, #140A0A) 88%, transparent)`    | Bar background color   |
| `--sectionMap-bar-border`  | `color-mix(in srgb, var(--text-color, #EFF9F0) 21%, transparent)`  | Bar border color       |
| `--sectionMap-bar-radius`  | `8px`                                                               | Bar border radius       |
| `--sectionMap-bar-opacity` | `0.4`                                                               | Bar opacity at rest (transitions to `1` on `:hover`) |
| `--sectionMap-tick-color`  | `var(--text-color, #7D7D7D)`                                        | Tick color             |
| `--sectionMap-thumb-color` | `var(--theme-color, #FF9124)`                                       | Thumb color            |
| `--sectionMap-thumb-radius`| `2px`                                                               | Thumb border radius     |

---

## Generated DOM

The site must not author these elements directly; sectionMap creates, measures, and owns them.

| Element | Description |
|---|---|
| `.sectionMap-bar`   | Fixed pill bar injected into `document.body`. Acts as the ARIA `scrollbar` host. Contains all ticks and the thumb. |
| `.sectionMap-tick`  | One per section. Positioned by CSS flex (`justify-content: space-evenly`) inside the bar. `aria-hidden="true"`. |
| `.sectionMap-thumb` | Scroll position indicator. Translated horizontally via `transform` by `setThumbPosition`. `aria-hidden="true"`. |

---

## Module Architecture

```
sectionMap.init.js        <- composition root -- discovery and wiring
sectionMap.controller.js  <- pointer events, scroll coordination, animation state
sectionMap.render.js      <- DOM creation and visual updates for bar, ticks, thumb
sectionMap.engine.js      <- scroll math, geometry, rAF loops
sectionMap.state.js       <- state factory
sectionMap.dom.js         <- all DOM reads and writes
```

Import graph (one-directional, no cycles):

```
init.js -> dom.js
init.js -> render.js      -> dom.js
init.js -> controller.js  -> engine.js -> dom.js
                          -> render.js -> dom.js
                          -> dom.js
                          -> state.js
```

---

## Relationship to Panning

sectionMap and panning share `#main` as their scroll container but are fully decoupled - neither imports the other.

**Ownership rules:**

- `scrollTop` is owned by whoever last touched it.
- sectionMap yields on `pointerdown` on `#main` - all active rAF loops (lerp, momentum, animation) are cancelled before panning's handler runs.
- `e.stopPropagation()` on the bar's `pointerdown` prevents the event from reaching document-level listeners.
- The bar being appended to body prevents `pointerdown` event from reaching panning's listener on `#main`.
- `scroll-behavior: auto` on `#main` must not be changed - all three scrollers rely on `scrollTop` writes taking effect immediately.

**`main.js` initialization order:**

No ordering constraint. Neither module imports the other, and the yielding logic works regardless of which is initialized first.

**Cross-module cancellation (optional):**

```javascript
const bar = document.querySelector('.sectionMap-bar');
if (bar?._cancelSectionMapAnimation) bar._cancelSectionMapAnimation();
```
