# Panning Module - API Reference

Smooth pointer-based panning with momentum and wheel redirection for nested scroll containers, with configurable axis and arbitrary nesting depth.

> See also: [sectionMap](../sectionMap/API.md) - shares `#main` as scroll container;
> see sectionMap's Relationship section for yielding and ownership rules.

---

## HTML Contract

### Required HTML

```html
<div class="scrollContainer" data-panning-axis="y"> ... </div>

<div class="scrollContainer" data-panning-axis="x"> ... </div>
```

```javascript
import { initPanning } from 'https://cdn.auraq.org/modules/panning/panning.init.js';

document.addEventListener('DOMContentLoaded', () => {
  initPanning();
});
```

The module is purely attribute-driven and imposes no tag constraint. `[data-panning-axis]` works on any element the browser can render as a scroll container, provided it has a constrained dimension and content that overflows it - without those, `overflow: auto` has nothing to scroll regardless of the attribute.

**Compatible tags:**

| Category | Elements |
|---|---|
| Structural | `<div>`, `<main>`, `<section>`, `<article>`, `<aside>` |
| Landmark | `<nav>`, `<header>`, `<footer>` |
| List | `<ul>`, `<ol>` |
| Table | `<table>`, `<tbody>`, `<td>` |
| Figure | `<figure>` |
| Interactive | `<details>`, `<dialog>`, `<form>`, `<fieldset>` |
| Text block | `<p>`, `<pre>`, `<blockquote>` |

**Incompatible tags:**

| Category | Elements | Reason |
|---|---|---|
| Void elements | `<input>`, `<img>`, `<br>`, `<hr>` | No children, no scroll context |
| Non-rendered elements | `<head>`, `<script>`, `<style>`, `<meta>`, `<link>`, `<title>` | Not part of the render tree |
| Viewport-level elements | `<html>`, `<body>` | Scroll context belongs to the viewport; behavior is browser-dependent |

### Attribute Schema

| Name | Required | Values | Description |
|---|---|---|---|
| `data-panning-axis` | Yes | `x` \| `y` \| `xy` | Declares the scroll axis for this container. Consumed by `getAxis()`. Controls which scroll dimensions the pointer and momentum handlers write to, and whether wheel redirection is applied. Defaults to `xy` if the attribute is present but carries no value. |

### Required Site CSS

Panning containers must be scroll containers. The following properties are required:

```css
.scrollContainer {
  touch-action: none;      /* prevents browser interference with pointer events */
  scrollbar-width: none;   /* hides scrollbar */
}

/* x-axis containers */
[data-panning-axis="x"] {
  overflow-x: auto;
  overflow-y: clip;
  overscroll-behavior-x: contain;
}

/* y-axis containers */
[data-panning-axis="y"] {
  overflow-y: auto;
  overscroll-behavior-y: contain;
}

/* xy-axis containers */
[data-panning-axis="xy"] {
  overflow: auto;
  overscroll-behavior: contain;
}
```

`touch-action: none` prevents the browser from claiming pointer events natively, which would break gesture detection. `overflow-y: clip` is used instead of `hidden` on x-axis containers to avoid implicitly creating a vertical scroll context, which would swallow wheel events and break scroll chaining to parent containers. `overscroll-behavior: contain` prevents scroll propagation to the document when the container reaches its boundary.

### Corner Cases
- No `[data-panning-axis]` elements found - `initPanning()` emits a `console.warn` and returns early. No listeners are registered.
- An x-axis container with no y-scrollable ancestor - `getNearestYScrollable()` walks up the DOM and returns null. The wheel redirect handler is not registered for that container. Vertical wheel input on it behaves natively.
- `[data-panning-axis]` on an incompatible element - listeners are attached but `scrollLeft`/`scrollTop` are meaningless on void or non-rendered elements; panning has no effect. 

---

## No-JS Behavior

Without JavaScript, `[data-panning-axis]` containers are inert HTML elements. No pointer event handlers are registered, no momentum runs, and no wheel redirection is applied. Scroll behavior falls back entirely to native browser overflow - containers scroll through native input only (trackpad, scrollbar, keyboard) if the required `overflow` CSS is present.

---

## Panning Behavior

### Gesture Recognition

A pan gesture commits when pointer travel exceeds `dragThreshold` (`5px` default) on any active axis. Until that threshold is crossed, `isPanning` remains `false` and scroll position is not modified - this prevents micro-movements from being interpreted as intentional pans. Once committed, `isPanning` stays `true` for the pointer's lifetime and resets only on `pointerup` or `pointercancel`.

### Momentum

On `pointerup`, if a pan was active, the module enters a momentum phase driven by `requestAnimationFrame`. Each frame, velocity decays by `friction` (`0.85` default) and is applied to scroll position scaled by `momentumScale` (`20` default). Momentum stops when all active-axis velocities fall below `minVelocity` (`0.02 px/frame` default). A new `pointerdown` cancels any in-flight momentum frame immediately.

### Wheel Redirection

On `x`-axis containers only, a `wheel` handler is registered with `{ passive: false }` that redirects vertical scroll delta to the nearest y-scrollable ancestor via `getNearestYScrollable()`. The redirect is bypassed when `shiftKey` is held or when `deltaX` exceeds `deltaY`, preserving native horizontal scrolling via touchpad and shift+wheel.

---

## Exports

### panning.state.js

#### `createPanningState()`

Returns a fresh, isolated state object for one panning container.

- **Returns:** `Object`

```javascript
{
  isPanning: false,
  isPointerDown: false,
  startX: 0,
  startY: 0,
  startScrollX: 0,
  startScrollY: 0,
  velocityX: 0,
  velocityY: 0,
  lastX: 0,
  lastY: 0,
  lastTime: 0,
  momentumFrameID: null
}
```

---

### panning.dom.js

#### `getPanningContainers()`

Returns `NodeList` of all `[data-panning-axis]` elements in the document.

#### `getAxis(container)`

Returns the `data-panning-axis` value of `container`, defaulting to `'xy'`.

#### `getScrollX(container)`

Returns `container.scrollLeft`.

#### `setScrollX(container, value)`

Sets `container.scrollLeft` to `value`.

#### `getScrollY(container)`

Returns `container.scrollTop`.

#### `setScrollY(container, value)`

Sets `container.scrollTop` to `value`.

#### `bindEvent(container, event, handler, options)`

Calls `container.addEventListener(event, handler, options)`.

#### `getNearestYScrollable(element)`

Walks up the DOM from `element` and returns the first ancestor whose computed `overflow-y` is `auto` or `scroll`. Returns `null` if none is found.

---

### panning.controller.js

#### `createPanningController(container, state, axis, config)`

Creates and returns the three pointer event handlers for a given container.

| Parameter | Type | Description |
|---|---|---|
| `container` | `Element` | The scroll container to control |
| `state` | `Object` | State object from `createPanningState()` |
| `axis` | `string` | Scroll axis: `'x'`, `'y'`, or `'xy'` |
| `config` | `Object` | Merged config object from `initPanning()` |

**Returns:** `{ onPointerDown, onPointerMove, onPointerUp }`

---

### panning.init.js

#### `initPanning(options)`

Queries the DOM for all `[data-panning-axis]` elements and initialises pointer-based panning and wheel redirection on each. All options are optional - unspecified keys stay at their default values.

| Parameter | Type | Description |
|---|---|---|
| `options.dragThreshold` | `number` | Default `5`. Minimum pointer travel in px before a pan gesture commits. |
| `options.friction` | `number` | Default `0.85`. Velocity decay per frame - lower values slide longer. |
| `options.minVelocity` | `number` | Default `0.02`. Momentum stops when all active-axis velocities fall below this value (px/frame). |
| `options.momentumScale` | `number` | Default `20`. Multiplier applied to velocity when advancing scroll position each frame. |

- **Returns:** void
- **Side effects:**
  - Emits a `console.warn` if no `[data-panning-axis]` elements are found and returns early
  - Binds `pointerdown` on every container
  - Binds `pointermove`, `pointerup`, `pointercancel` on `document`
  - Binds a `wheel` handler (registered with `{ passive: false }`, calls `e.preventDefault()`) on `x`-axis containers that redirects vertical wheel delta to the nearest y-scrollable ancestor

---

## CSS Shipped by Auraq

None. Panning is a behavior-only module - Auraq ships no CSS. All visual treatment and required scroll container styles are the consumer site's responsibility.

---

## Module Architecture

```
panning.init.js       <-  composition root -- discovery, config merge, wiring
panning.controller.js <-  pointer events, momentum physics
panning.dom.js        <-  all DOM reads/writes and event binding
panning.state.js      <-  state factory
panning.config.js     <-  default constants (internal - CDN only)
```

Import graph (one-directional, no cycles):

```
init.js -> config.js
init.js -> state.js
init.js -> controller.js -> dom.js
init.js -> dom.js
```
