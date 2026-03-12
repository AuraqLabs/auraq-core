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

## panning.init.js

Entry point. Discovers all panning containers then wires state, controller, and input handlers.

### `initPanning()`

Queries the DOM for all `[data-panning-axis]` elements and initialises pointer-based panning and wheel redirection on each.

- **Parameters:** none
- **Returns:** void
- **Side effects:**
  - Binds `pointerdown`, `pointermove`, `pointerup`, `pointercancel` on every container
  - Binds a `wheel` handler on `x`-axis containers that redirects vertical wheel delta to the nearest y-scrollable ancestor, preserving native horizontal scrolling via touchpad and shift+wheel

---

## panning.controller.js

Pointer event logic and momentum physics engine.

### `createPanningController(container, state, axis, nestedContainerSelector)`

Creates and returns the three pointer event handlers for a given container.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `container` | `Element` | — | The scroll container to control |
| `state` | `Object` | — | State object from `createPanningState()` |
| `axis` | `string` | `'xy'` | Scroll axis: `'x'`, `'y'`, or `'xy'` |
| `nestedContainerSelector` | `string` | `'[data-panning-axis]'` | Selector used to detect nested panning containers and skip pointer capture |

**Returns:** `{ onPointerDown, onPointerMove, onPointerUp }`

**Physics constants** (intentionally non-configurable — tuning causes jitter):

| Constant | Value | Role |
|---|---|---|
| `friction` | `0.85` | Velocity decay per frame |
| `minVelocity` | `0.02` | Threshold below which momentum stops |
| `momentumScale` | `20` | Multiplier applied to velocity when advancing scroll |

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

All DOM reads, writes, pointer capture, and event binding.
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

### `capturePointer(container, pointerId)`
Calls `container.setPointerCapture(pointerId)`.

### `bind(container, event, handler, options?)`
Calls `container.addEventListener(event, handler, options)`.

### `getNearestYScrollable(element)`
Walks up the DOM from `element` and returns the first ancestor whose computed `overflow-y` is `auto` or `scroll`. Returns `null` if none is found.
