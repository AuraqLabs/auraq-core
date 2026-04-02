// panning.API.md

# Panning Module API

Smooth pointer-based panning with momentum and wheel redirection for nested containers.
Supports configurable scroll axis and arbitrary nesting depth.

---

## Usage
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

All configuration is optional — calling `initPanning()` with no arguments uses the defaults from `panning.config.js`.

---

## Configuration

Pass an options object to override any default. Unspecified keys stay at their default values.

```javascript
// Override one key, rest stay default
initPanning({ dragThreshold: 10 });

// Override several keys
initPanning({ dragThreshold: 10, friction: 0.9 });
```

| Option | Default | Description |
|---|---|---|
| `dragThreshold` | `5` | px — minimum pointer travel before a pan gesture commits |
| `friction` | `0.85` | Velocity decay per frame — lower = slides longer |
| `minVelocity` | `0.02` | px/frame — momentum stops below this threshold |
| `momentumScale` | `20` | Multiplier applied to velocity when advancing scroll |

Defaults are defined in `panning.config.js` on the CDN. Consumers never import or host this file — the options object passed to `initPanning()` is the only configuration surface.

---

## CSS Requirements

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

> `overflow-y: clip` is used instead of `hidden` on x-axis containers to avoid implicitly creating a vertical scroll context, which would swallow wheel events and break scroll chaining to parent containers.

---

## Module Architecture

```
panning.init.js       ← composition root — discovery, config merge, wiring
panning.controller.js ← pointer events, momentum physics
panning.dom.js        ← all DOM reads/writes and event binding
panning.state.js      ← state factory
panning.config.js     ← default constants (internal — CDN only)
```

Import graph (one-directional, no cycles):

```
init.js → config.js
init.js → state.js
init.js → controller.js → dom.js
init.js → dom.js
```

---

## panning.init.js

Entry point. Merges consumer options with defaults, discovers all panning containers, then wires state, controller, and input handlers.

### `initPanning(options?)`

Queries the DOM for all `[data-panning-axis]` elements and initialises pointer-based panning and wheel redirection on each.

- **Parameters:** `options` — optional config object (see [Configuration](#configuration))
- **Returns:** void
- **Side effects:**
  - Binds `pointerdown` on every container
  - Binds `pointermove`, `pointerup`, `pointercancel` on `document`
  - Binds a `wheel` handler (registered with `{ passive: false }`, calls `e.preventDefault()`) on `x`-axis containers that redirects vertical wheel delta to the nearest y-scrollable ancestor, preserving native horizontal scrolling via touchpad and shift+wheel

---

## panning.controller.js

Pointer event logic and momentum physics engine.

### `createPanningController(container, state, axis, config)`

Creates and returns the three pointer event handlers for a given container.

| Parameter | Type | Description |
|---|---|---|
| `container` | `Element` | The scroll container to control |
| `state` | `Object` | State object from `createPanningState()` |
| `axis` | `string` | Scroll axis: `'x'`, `'y'`, or `'xy'` |
| `config` | `Object` | Merged config object from `initPanning()` |

**Returns:** `{ onPointerDown, onPointerMove, onPointerUp }`

---

## panning.state.js

State factory.

### `createPanningState()`

Returns a fresh, isolated state object for one panning container.

- **Parameters:** none
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

## panning.dom.js

All DOM reads, writes, and event binding.
No logic lives here — only direct DOM access.

### `getPanningContainers()`
Returns `NodeList` of all `[data-panning-axis]` elements in the document.

### `getAxis(container)`
Returns the `data-panning-axis` value of `container`, defaulting to `'xy'`.

### `getScrollX(container)`
Returns `container.scrollLeft`.

### `setScrollX(container, value)`
Sets `container.scrollLeft` to `value`.

### `getScrollY(container)`
Returns `container.scrollTop`.

### `setScrollY(container, value)`
Sets `container.scrollTop` to `value`.

### `bind(container, event, handler, options?)`
Calls `container.addEventListener(event, handler, options)`.

### `getNearestYScrollable(element)`
Walks up the DOM from `element` and returns the first ancestor whose computed `overflow-y` is `auto` or `scroll`. Returns `null` if none is found.
