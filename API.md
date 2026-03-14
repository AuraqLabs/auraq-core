// API.md

# Auraq Core — API Reference

Global index of all modules and their public exports.
Each module ships its own detailed API.md within its folder.

---

## Modules

### Panning
**Path:** `modules/panning/`
**CDN:** `https://cdn.auraq.org/modules/panning/panning.init.js`
**Docs:** [modules/panning/API.md](./modules/panning/API.md)

| Export | File | Description |
|---|---|---|
| `initPanning()` | `panning.init.js` | Discovers all `[data-panning-axis]` containers and initialises panning |
| `createPanningController(container, state, axis, nestedContainerSelector)` | `panning.controller.js` | Returns pointer event handlers and momentum engine for one container |
| `createPanningState()` | `panning.state.js` | Returns a fresh isolated state object for one container |
| `getPanningContainers()` | `panning.dom.js` | Returns all `[data-panning-axis]` elements |
| `getAxis(container)` | `panning.dom.js` | Returns the axis value of a container |
| `getScrollX/Y(container)` | `panning.dom.js` | Reads scroll position |
| `setScrollX/Y(container, value)` | `panning.dom.js` | Writes scroll position |
| `capturePointer(container, pointerId)` | `panning.dom.js` | Captures pointer to container |
| `bind(container, event, handler, options?)` | `panning.dom.js` | Adds an event listener |
| `getNearestYScrollable(element)` | `panning.dom.js` | Walks up DOM to find nearest y-scrollable ancestor |

---

## Planned Modules

| Module | Status |
|---|---|
| Panning | Live |
| Navigation | Planned |
| Carousel | Planned |
