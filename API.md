# Auraq Core — API Reference

Global index of all modules and their public exports.
Each module ships its own detailed API.md within its folder.

---

## Module List

| Module | Status |
|---|---|
| Panning | Live |
| Section Map | Live |
| Skill Tree | Live |
| Skill Accordion | Live |
| COBE | Live |
| COBEv2 | Live |
| Link Preview | Planned |
| Text Selectable in Panning | Planned |
| Dark/Light Theme Toggle | Planned |
| Lightbox | Planned |
| Phase Stepper | Planned |
| Progression Slider | Planned |
| Variant Switcher | Planned |
| Technical Summary | Planned |
| Filter Bar | Planned |
| Gallery Card | Planned |
| Source Profiles | Planned |
| Dispatch Feed | Planned |
| Parallax | Planned |
| Code Block | Planned |
| Data Embed | Planned |
| Status Indicator | Planned |
| Status Badge | Planned |
| Waveform Card | Planned |

---

## Module Details

### Panning
**Path:** `modules/panning/`
**CDN:** `https://cdn.auraq.org/modules/panning/panning.init.js`
**Docs:** [modules/panning/API.md](./modules/panning/API.md)

| Export | File | Description |
|---|---|---|
| `initPanning(options)` | `panning.init.js` | Discovers all `[data-panning-axis]` containers and initialises panning |
| `createPanningState()` | `panning.state.js` | Returns a fresh isolated state object for one container |
| `createPanningController(container, state, axis, config)` | `panning.controller.js` | Returns pointer event handlers and momentum engine for one container |
| `getPanningContainers()` | `panning.dom.js` | Returns all `[data-panning-axis]` elements |
| `getAxis(container)` | `panning.dom.js` | Returns the axis value of a container |
| `getNearestYScrollable(element)` | `panning.dom.js` | Walks up DOM to find nearest y-scrollable ancestor |
| `getScrollX(container)` | `panning.dom.js` | Returns `container.scrollLeft` |
| `setScrollX(container, value)` | `panning.dom.js` | Sets `container.scrollLeft` |
| `getScrollY(container)` | `panning.dom.js` | Returns `container.scrollTop` |
| `setScrollY(container, value)` | `panning.dom.js` | Sets `container.scrollTop` |
| `bindEvent(container, event, handler, options)` | `panning.dom.js` | Adds an event listener to a container |

---

### SectionMap
**Path:** `modules/sectionMap/`
**CDN:** `https://cdn.auraq.org/modules/sectionMap/sectionMap.init.js`
**Docs:** [modules/sectionMap/API.md](./modules/sectionMap/API.md)

| Export | File | Description |
|---|---|---|
| `initSectionMap()` | `sectionMap.init.js` | Discovers `#main` and all `main > section` elements, creates the pill bar, and wires all interaction |
| `createSectionMapController(container, sections, bar, ticks, thumb)` | `sectionMap.controller.js` | Owns all pointer event handling, scroll coordination, and animation state; exposes `bar._cancelSectionMapAnimation()` for cross-module use |
| `createBar(sectionCount)` | `sectionMap.render.js` | Creates and injects the pill bar into `document.body`; returns `{ bar, ticks, thumb }` |
| `updateThumb(thumb, px, normalizedPosition)` | `sectionMap.render.js` | Updates thumb position and ARIA value |
| `computeSectionNorms(offsetTops, scrollable)` | `sectionMap.engine.js` | Maps section `offsetTop` values to normalized 0–1 scroll positions |
| `computeThumbPx(normalizedPosition, tickPositions, sectionNorms)` | `sectionMap.engine.js` | Returns the thumb center pixel X via per-segment interpolation |
| `normalizeScroll(container)` | `sectionMap.engine.js` | Returns the container's current scroll position as a 0–1 value |
| `createTrackingLoop(container, onUpdate)` | `sectionMap.engine.js` | Starts a rAF loop calling `onUpdate` on each `scrollTop` change; returns a stop function |
| `createLerpScroller(container)` | `sectionMap.engine.js` | Returns `{ setTarget, cancel }` for lerp-based drag following |
| `createMomentumScroller(container)` | `sectionMap.engine.js` | Returns `{ kick, cancel }` for velocity-based post-drag momentum |
| `createSectionMapState()` | `sectionMap.state.js` | Returns a fresh isolated pointer and animation state object |
| `getScrollContainer()` | `sectionMap.dom.js` | Returns `#main` |
| `getSections()` | `sectionMap.dom.js` | Returns all `main > section` elements |
| `measureTickPositions(ticks)` | `sectionMap.dom.js` | Returns centre X of each tick in px from the rendered DOM |
| `getSectionOffsetTops(sections)` | `sectionMap.dom.js` | Returns `offsetTop` of each section |
| `getScrollable(container)` | `sectionMap.dom.js` | Returns `scrollHeight - clientHeight` |
| `getBarRect(bar)` | `sectionMap.dom.js` | Returns the pill bar's bounding client rect |
| `setScrollTop(container, value)` | `sectionMap.dom.js` | Writes `container.scrollTop` |
| `setThumbPosition(thumb, px)` | `sectionMap.dom.js` | Writes `thumb.style.transform` |
| `setAriaValue(element, value)` | `sectionMap.dom.js` | Writes `aria-valuenow` on the bar |

---

### SkillTree
**Path:** `modules/skillTree/`
**CDN:** `https://cdn.auraq.org/modules/skillTree/skillTree.init.js`
**Docs:** [modules/skillTree/API.md](./modules/skillTree/API.md)

> **Rename notice:** The entry point has been renamed from `initSkillTree()` to `initSkills()`. Update all import sites and `main.js` accordingly.

| Export | File | Description |
|---|---|---|
| `initSkills()` | `skillTree.init.js` | Discovers `[data-skills]`, extracts course data from `<details>` nodes, injects toggle buttons, and wires lazy tree initialisation on first Tree click |
| `createSkillTreeController(state, nodes, popups, filters)` | `skillTree.controller.js` | Returns `{ bindAll }` — binds node click, popup close, and filter toggle listeners |
| `getSkillsContainer()` | `skillTree.dom.js` | Returns the `[data-skills]` container element |
| `getSkillNodes(container)` | `skillTree.dom.js` | Returns all direct `<details>` children of the container |
| `setActive(el, active)` | `skillTree.dom.js` | Toggles `.active` on nodes, filter buttons, and popups |
| `setCanvasDimensions(canvasEl, canvasWidth, canvasHeight)` | `skillTree.dom.js` | Sets inline `width` and `height` on the canvas element |
| `setNodePosition(nodeEl, x, y)` | `skillTree.dom.js` | Sets inline `left` and `top` on a node element |
| `setNodeDimmed(nodeEl, dimmed)` | `skillTree.dom.js` | Toggles `.dimmed` on a node |
| `setPopupVisible(popupEl, visible)` | `skillTree.dom.js` | Toggles `.visible` on a popup |
| `setPopupPosition(popupEl, left, top)` | `skillTree.dom.js` | Sets inline `left` and `top` on a popup |
| `getNodeRect(nodeEl)` | `skillTree.dom.js` | Returns `{ nodeLeft, nodeTop, nodeWidth, nodeHeight }` from inline style and offsets |
| `getViewportWidth()` | `skillTree.dom.js` | Returns `window.innerWidth` |
| `getPopupSide(popupEl)` | `skillTree.dom.js` | Returns the popup's placement side (`'left' \| 'right' \| 'below'`) from its class |
| `computeNodeCoords(courses, nodeWidth, nodeHeight, gapX, gapY)` | `skillTree.engine.js` | Assigns canvas coordinates per course; returns `{ id, x, y }[]` |
| `computeEdgePoints(sourcePos, targetPos, nodeWidth, nodeHeight)` | `skillTree.engine.js` | Returns `{ x1, y1, x2, y2 }` anchor points for an edge path |
| `inferEdges(courses)` | `skillTree.engine.js` | Infers edges connecting same-branch courses with adjacent layers; returns `{ fromId, toId }[]` |
| `computeCanvasDimensions(positions, nodeWidth, nodeHeight, gapX, gapY)` | `skillTree.engine.js` | Returns `{ canvasWidth, canvasHeight }` bounding box for all nodes |
| `computePopupCoords(nodeLeft, nodeTop, nodeWidth, nodeHeight, side, popupWidth, gap)` | `skillTree.engine.js` | Returns `{ left, top }` for placing a popup adjacent to its node |
| `computePopupSide(nodeX, canvasWidth, viewportWidth)` | `skillTree.engine.js` | Returns `'left' \| 'right' \| 'below'` popup placement side |
| `createToggleButtons(container)` | `skillTree.render.js` | Creates and prepends the Accordion/Tree toggle button pair; returns `{ accordionBtn, treeBtn }` |
| `initContainer(container)` | `skillTree.render.js` | Adds `.skillTreeContainer`, creates `#skillTreeCanvas`; returns the canvas element |
| `createFilters(container, domains)` | `skillTree.render.js` | Creates the filter bar and filter buttons; returns `{ filterBar, filters }` |
| `createNodes(container, nodesData, positions)` | `skillTree.render.js` | Creates all node cards; returns `{ nodes }` |
| `createEdge(canvas, x1, y1, x2, y2)` | `skillTree.render.js` | Creates a single cubic-bezier SVG path between two anchor points; returns `SVGPathElement` |
| `createEdges(canvas, edges, positions, nodeWidth, nodeHeight)` | `skillTree.render.js` | Creates the SVG overlay and draws all inferred edges |
| `createPopups(container, courses, positions, canvasWidth)` | `skillTree.render.js` | Creates all popup cards; returns `{ popups }` |
| `createSkillTreeState()` | `skillTree.state.js` | Returns a fresh isolated state object `{ activeFilter, selectedNodeId, canvasWidth }` |

---

### SkillAccordion
**Path:** `modules/skillAccordion/`
**CDN:** `https://cdn.auraq.org/modules/skillAccordion/skillAccordion.init.js`
**Docs:** [modules/skillAccordion/API.md](./modules/skillAccordion/API.md)

| Export | File | Description |
|---|---|---|
| `initSkillAccordion()` | `skillAccordion.init.js` | Discovers all `[data-skills]` containers, registers the drag guard, and attaches animated open/close to every `<details>` inside them |

---

### COBE
**Path:** `vendor/cobe/`
**CDN:** `https://cdn.auraq.org/vendor/cobe/cobe.init.js`
**Docs:** [vendor/cobe/API.md](./vendor/cobe/API.md)

| Export | File | Description |
|---|---|---|
| `initGlobe(opts?)` | `cobe.init.js` | Discovers all `.cobe` canvases, applies the mobile guard, and starts a Phenomenon-backed WebGL globe on each |
| `createGlobe(canvas, opts)` | `cobe.create.js` | Core factory — wires GLSL shader uniforms, loads the map texture, and starts the render loop; returns the `Phenomenon` instance |

---

### COBEv2
**Path:** `vendor/cobev2/`
**CDN:** `https://cdn.auraq.org/vendor/cobev2/cobe.init.js`
**Docs:** [vendor/cobev2/API.md](./vendor/cobev2/API.md)

| Export | File | Description |
|---|---|---|
| `initGlobeV2(opts?)` | `cobe.init.js` | Discovers all `.cobev2` canvases, applies the mobile guard, and manages the rAF loop; returns `Array<{ globe, cancel }>` or `null` |
| `createGlobe(canvas, opts)` | `cobe.create.js` | Core factory — three-pass WebGL rendering (globe, arcs, markers) with CSS anchor system; returns `{ update, destroy }` |
