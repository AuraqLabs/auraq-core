# SkillTree Module - API Reference

The SkillTree module renders course and skill data from a `[data-skills]` container as an interactive, pannable graph tree.

> See also: [skillAccordion](../skillAccordion/API.md)

---

## HTML Contract

### Required HTML

```html
<div data-skills>

  <details
    data-skill-id="ST1x"
    data-skill-display="Software Testing: Unit Tests, Coverage &amp; Design"
    data-skill-domain="Testing"
    data-skill-branch="Testing"
    data-skill-layer="1"
    data-skill-institute="DelftX"
    data-skill-year="2026"
    data-skill-tags="Unit Testing,Coverage Criteria,Test Design"
    data-skill-link="https://..."
  >
    <summary>Automated Software Testing: Unit Testing, Coverage Criteria and Design for Testability</summary>
    <p>Academic course for applied testing - criteria-driven design that finds real bugs systematically.</p>
  </details>

  <!-- additional <details> per skill -->

</div>
```

The `<summary>` and `<p>` above show the minimal contract. The site may expand their internal markup (e.g. add `.skill-title` / `.skill-subtitle` spans inside `<summary>`, or wrap `<p>` in a `.skill-body` structure for accordion styling). SkillTree reads `summary.textContent` and `details.querySelector('p').textContent`, both of which resolve correctly regardless of internal structure.

### Element Discovery

| Name | Selector | Required | Description |
|---|---|---|---|
| Skills container | `[data-skills]` | Yes | Root element. Discovered via `document.querySelector('[data-skills]')`. `initSkillTree()` warns and exits if absent. |
| Skill nodes | `:scope > details` | Yes | Direct `<details>` children of the container. Each one maps to one tree node. `initSkillTree()` warns and exits if none are found. |

### Attribute Schema

| Name | Required | Values | Description |
|---|---|---|---|
| `data-skill-id` | Yes | String | Unique identifier across all skills. Duplicate IDs warn and skip; first occurrence wins. |
| `data-skill-display` | Yes | String | Short name shown inside the tree node card. |
| `data-skill-domain` | Yes | String | Domain label - drives color coding and the filter bar. |
| `data-skill-branch` | Yes | String | Groups nodes into columns; nodes with the same branch are placed in the same vertical column. |
| `data-skill-layer` | Yes | Integer >= 1 | Tree row - determines vertical position. Non-integer or value less than 1 warns and skips the node. |
| `data-skill-institute` | Yes | String | Institution or publisher name, shown in the node meta row. |
| `data-skill-year` | Yes | Integer | Year completed or in progress, shown in the node meta row. |
| `data-skill-tags` | Yes | String | Comma-separated tag list rendered in the popup. Tag names must not contain commas. |
| `data-skill-link` | Yes | String | URL to course or resource, used for the popup link. |

### Content Mapping

| Source | Used by |
|---|---|
| `data-skill-display` | Tree node card (short name) |
| `<summary>` text content | Popup header (full course name) |
| `<p>` text content | Popup description |

### Corner Cases

- `data-skill-tags` is split on `,` - tag names must not contain commas.
- Duplicate `data-skill-id` - warns and skips the duplicate. First occurrence wins.
- Non-integer `data-skill-layer` or value less than `1` - warns and skips that node. Its `<details>` entry still renders in the accordion.
- Missing any required attribute - warns with the offending `data-skill-id` and skips that node. Its `<details>` entry still renders in the accordion.
- `[data-skills]` with no `<details>` children - `initSkillTree()` warns and exits entirely.
- A `<details>` with no `<p>` - description defaults to empty string in the popup.
- `extractCourses()` returning zero valid nodes on the first Tree click - warns and aborts the build; the tree container remains hidden and the accordion stays visible.
- `buildTree()` throwing an uncaught error - caught by `initSkillTree()`, which warns and aborts; `treeBuilt` stays `false` so the next Tree click retries the build.

---

## No-JS Behavior

`[data-skills]` renders as a list of native `<details>` / `<summary>` elements. All skill content is accessible without JS. The tree is never built and toggle buttons never appear.

---

## Two-Renderer Model

SkillTree and SkillAccordion share one HTML source. The site authors the markup once; each module reads it independently and renders into its own generated DOM.

| State | Accordion | Tree |
|---|---|---|
| No JS | Visible (native `<details>`) | Never rendered |
| JS, page load | Visible | Not yet built |
| First "Tree" click | Hidden | Built from DOM, shown |
| "Accordion" click | Shown | Hidden (stays in memory) |
| Subsequent "Tree" clicks | Hidden | Shown - no rebuild |

Toggle buttons are injected by `createToggleButtons()` on `initSkillTree()`. Without JS, no buttons appear and the accordion is the only renderer.

Layout constants used during tree build - value, unit, and behavioral effect:

```javascript
const NODE_WIDTH  = 300; // px - node card width; used in all coordinate and canvas calculations
const NODE_HEIGHT = 150; // px - node card height; used in all coordinate and canvas calculations
const GAP_X       =  60; // px - horizontal space between nodes in adjacent columns
const GAP_Y       =  80; // px - vertical space between nodes in adjacent layers
```

Panning constants passed to `createPanningController()` during tree build:

```javascript
{
  dragThreshold: 5,   // px - pointer must travel this far before a drag is registered
  friction:      0.85, // momentum multiplier per frame - higher value = longer coast
  minVelocity:   0.02, // px/frame - momentum stops below this threshold
  momentumScale: 20,   // scales release velocity into initial momentum distance
}
```

---

## Exports

### skillTree.init.js

#### `initSkillTree()`

Entry point. Discovers `[data-skills]`, reads all `<details>` nodes, injects toggle buttons, and wires lazy tree initialisation on first Tree click.

**Returns:** `void`

**Side effects:**
- Creates a `.skillTree-tree` div and appends it to `[data-skills]`.
- Calls `createToggleButtons()`, which prepends `.skillTree-toggles` to `[data-skills]` and injects the module stylesheet into `<head>`.
- On first Tree click: runs the full build pipeline - canvas, panning, filters, nodes, edges, popups, controller - and sets `hidden` on all `<details>` nodes.
- On subsequent Tree clicks: sets `hidden` on all `<details>` nodes and removes `hidden` from `.skillTree-tree`. No rebuild.
- On Accordion click: removes `hidden` from all `<details>` nodes and sets `hidden` on `.skillTree-tree`.

**Initialisation flow:**

1. `getSkillsContainer()` - find `[data-skills]` or warn and exit.
2. `getSkillNodes(container)` - find all `<details>` or warn and exit.
3. Create `.skillTree-tree` div, append to container, set `hidden`.
4. `createToggleButtons(container)` - inject Accordion / Tree button pair.
5. On Tree click: `extractCourses()` -> `buildTree()`. Subsequent Tree clicks show the already-built tree without rebuilding.
6. On Accordion click: show `<details>` nodes, hide tree.

---

### skillTree.dom.js

All DOM reads and writes for the SkillTree module. No other file touches the DOM directly.

#### `getSkillsContainer()`

Returns the `[data-skills]` container element, or `null` if not present.

**Returns:** `Element | null`

---

#### `getSkillNodes(container)`

Returns all direct `<details>` children of the given container.

**Returns:** `Element[]`

| Parameter | Type | Description |
|---|---|---|
| `container` | `Element` | The `[data-skills]` container element. |

---

#### `setActive(el, active)`

Toggles `.active` on nodes, filter buttons, and popups.

**Returns:** `void`

**Side effects:** Adds or removes `.active` class on `el`.

| Parameter | Type | Description |
|---|---|---|
| `el` | `Element` | Target element. |
| `active` | `boolean` | `true` adds `.active`; `false` removes it. |

---

#### `setCanvasDimensions(canvasEl, canvasWidth, canvasHeight)`

Sets `width` and `height` as inline `px` on the canvas element.

**Returns:** `void`

**Side effects:** Mutates `style.width` and `style.height` on `canvasEl`.

| Parameter | Type | Description |
|---|---|---|
| `canvasEl` | `Element` | The `#skillTreeCanvas` element. |
| `canvasWidth` | `number` | Width in pixels. |
| `canvasHeight` | `number` | Height in pixels. |

---

#### `setNodePosition(nodeEl, x, y)`

Sets `left` and `top` as inline `px` on a node element.

**Returns:** `void`

**Side effects:** Mutates `style.left` and `style.top` on `nodeEl`.

| Parameter | Type | Description |
|---|---|---|
| `nodeEl` | `Element` | The `.skillTree-node` element. |
| `x` | `number` | Left position in pixels. |
| `y` | `number` | Top position in pixels. |

---

#### `setNodeDimmed(nodeEl, dimmed)`

Toggles `.dimmed` on a node. Dimmed nodes are faded and non-interactive.

**Returns:** `void`

**Side effects:** Adds or removes `.dimmed` class on `nodeEl`.

| Parameter | Type | Description |
|---|---|---|
| `nodeEl` | `Element` | The `.skillTree-node` element. |
| `dimmed` | `boolean` | `true` adds `.dimmed`; `false` removes it. |

---

#### `setPopupVisible(popupEl, visible)`

Toggles `.visible` on a popup, which drives `display` and the pop-in animation.

**Returns:** `void`

**Side effects:** Adds or removes `.visible` class on `popupEl`.

| Parameter | Type | Description |
|---|---|---|
| `popupEl` | `Element` | The `.skillTree-popup` element. |
| `visible` | `boolean` | `true` adds `.visible`; `false` removes it. |

---

#### `setPopupPosition(popupEl, left, top)`

Sets `left` and `top` as inline `px` on a popup.

**Returns:** `void`

**Side effects:** Mutates `style.left` and `style.top` on `popupEl`.

| Parameter | Type | Description |
|---|---|---|
| `popupEl` | `Element` | The `.skillTree-popup` element. |
| `left` | `number` | Left position in pixels. |
| `top` | `number` | Top position in pixels. |

---

#### `setPopupArrowPosition(popupArrEl, x, y, side)`

**Stub - not yet implemented.** Reserved for the popup arrow feature.

**Returns:** `void`

| Parameter | Type | Description |
|---|---|---|
| `popupArrEl` | `Element` | The popup arrow element. |
| `x` | `number` | Horizontal position in pixels. |
| `y` | `number` | Vertical position in pixels. |
| `side` | `string` | Side the arrow points from - `'left'`, `'right'`, or `'below'`. |

---

#### `getNodeRect(nodeEl)`

Reads position from inline style and `offsetWidth` / `offsetHeight`. Falls back to `300 x 150` if the node has not yet been laid out.

**Returns:** `{ nodeLeft: number, nodeTop: number, nodeWidth: number, nodeHeight: number }`

| Parameter | Type | Description |
|---|---|---|
| `nodeEl` | `Element` | The `.skillTree-node` element. |

---

#### `getViewportWidth()`

Returns `window.innerWidth`.

**Returns:** `number`

---

#### `getPopupSide(popupEl)`

Reads the popup's placement side from its `popup-left` / `popup-right` class. Defaults to `'below'` if neither class is present.

**Returns:** `'left' | 'right' | 'below'`

| Parameter | Type | Description |
|---|---|---|
| `popupEl` | `Element` | The `.skillTree-popup` element. |

---

### skillTree.engine.js

Pure geometry. No DOM access. All functions are side-effect free.

#### `computeNodeCoords(courses, nodeWidth, nodeHeight, gapX, gapY)`

Assigns canvas coordinates to each course. Branches map to columns; layers map to rows. Sub-groups within the same branch and layer are centered within their column.

**Returns:** `{ id: string, x: number, y: number }[]`

| Parameter | Type | Description |
|---|---|---|
| `courses` | `object[]` | Extracted course data array. |
| `nodeWidth` | `number` | Node card width in pixels. |
| `nodeHeight` | `number` | Node card height in pixels. |
| `gapX` | `number` | Horizontal gap between nodes in pixels. |
| `gapY` | `number` | Vertical gap between layers in pixels. |

---

#### `computeEdgePoints(sourcePos, targetPos, nodeWidth, nodeHeight)`

Returns the bottom-center of the source node and the top-center of the target node - the two anchor points for a cubic-bezier edge path.

**Returns:** `{ x1: number, y1: number, x2: number, y2: number }`

| Parameter | Type | Description |
|---|---|---|
| `sourcePos` | `{ x: number, y: number }` | Canvas position of the source node. |
| `targetPos` | `{ x: number, y: number }` | Canvas position of the target node. |
| `nodeWidth` | `number` | Node card width in pixels. |
| `nodeHeight` | `number` | Node card height in pixels. |

---

#### `inferEdges(courses)`

Infers edges by connecting every course to every course that shares the same `branch` and has a `layer` exactly one greater. Branches with no adjacent layer produce no edge.

**Returns:** `{ fromId: string, toId: string }[]`

| Parameter | Type | Description |
|---|---|---|
| `courses` | `object[]` | Extracted course data array. |

---

#### `computeCanvasDimensions(positions, nodeWidth, nodeHeight, gapX, gapY)`

Returns the minimum bounding box needed to contain all positioned nodes, with `gapX` and `gapY` as right and bottom padding respectively.

**Returns:** `{ canvasWidth: number, canvasHeight: number }`

| Parameter | Type | Description |
|---|---|---|
| `positions` | `{ x: number, y: number }[]` | Position array from `computeNodeCoords`. |
| `nodeWidth` | `number` | Node card width in pixels. |
| `nodeHeight` | `number` | Node card height in pixels. |
| `gapX` | `number` | Horizontal gap in pixels - applied as right-side canvas padding. |
| `gapY` | `number` | Vertical gap in pixels - applied as bottom canvas padding. |

---

#### `computePopupCoords(nodeLeft, nodeTop, nodeWidth, nodeHeight, side, popupWidth, gap)`

Returns absolute canvas coordinates for placing a popup adjacent to its node on the given side.

**Returns:** `{ left: number, top: number }`

| Parameter | Type | Description |
|---|---|---|
| `nodeLeft` | `number` | Node's inline left position in pixels. |
| `nodeTop` | `number` | Node's inline top position in pixels. |
| `nodeWidth` | `number` | Node card width in pixels. |
| `nodeHeight` | `number` | Node card height in pixels. |
| `side` | `string` | Placement side - `'left'`, `'right'`, or `'below'`. |
| `popupWidth` | `number` | Popup width in pixels. |
| `gap` | `number` | Gap between the node edge and the popup in pixels. |

---

#### `computePopupSide(nodeX, canvasWidth, viewportWidth)`

Returns `'below'` when `viewportWidth <= 800`. Otherwise returns `'left'` for nodes past the canvas midpoint and `'right'` for nodes before it.

**Returns:** `'left' | 'right' | 'below'`

| Parameter | Type | Description |
|---|---|---|
| `nodeX` | `number` | Node's x position on the canvas in pixels. |
| `canvasWidth` | `number` | Total canvas width in pixels. |
| `viewportWidth` | `number` | Current viewport width in pixels. |

---

### skillTree.render.js

DOM creation for all tree elements. Imports from `skillTree.dom.js` and `skillTree.engine.js`.

#### `createToggleButtons(container)`

Creates the Accordion / Tree view-toggle button pair and prepends it to `[data-skills]`. Calls `injectStyles()` so the buttons are styled immediately at page load without waiting for the first Tree click.

**Returns:** `{ accordionBtn: HTMLButtonElement, treeBtn: HTMLButtonElement }`

**Side effects:**
- Prepends a `.skillTree-toggles` div containing two `.skillTree-toggle-btn` buttons to `container`.
- Calls `injectStyles()`, which appends `<style id="skillTree-styles">` to `<head>` (idempotent - no-op if already present).

| Parameter | Type | Description |
|---|---|---|
| `container` | `Element` | The `[data-skills]` element. |

---

#### `initContainer(container)`

Adds `.skillTreeContainer` to the tree div and creates `#skillTreeCanvas` inside it. Returns the canvas element.

**Returns:** `Element` - the `#skillTreeCanvas` div.

**Side effects:**
- Adds `.skillTreeContainer` class to `container`.
- Appends `<div id="skillTreeCanvas">` to `container`.
- Calls `injectStyles()` (no-op if already injected by `createToggleButtons`).

| Parameter | Type | Description |
|---|---|---|
| `container` | `Element` | The `.skillTree-tree` div. |

---

#### `createFilters(container, domains)`

Creates `.skillTree-filterBar` and one `.skillTree-filterButton` per domain. Sets `--nc` on each button from `DOMAIN_COLORS`.

**Returns:** `{ filterBar: Element, filters: Element[] }`

**Side effects:** Appends `.skillTree-filterBar` and all filter buttons to `container`.

| Parameter | Type | Description |
|---|---|---|
| `container` | `Element` | The `.skillTree-tree` div. |
| `domains` | `string[]` | Ordered list of unique domain name strings. |

---

#### `createNodes(container, nodesData, positions)`

Creates one `.skillTree-node` per course. Sets `--nc` and inline position on each node via `setNodePosition()`.

**Returns:** `{ nodes: Element[] }`

**Side effects:** Appends one `.skillTree-node` per course to `container`.

| Parameter | Type | Description |
|---|---|---|
| `container` | `Element` | The `#skillTreeCanvas` div. |
| `nodesData` | `object[]` | Extracted course data array. |
| `positions` | `{ id: string, x: number, y: number }[]` | Position array from `computeNodeCoords`. |

---

#### `createEdge(canvas, x1, y1, x2, y2)`

Creates a single cubic-bezier SVG `<path>` between two anchor points, with both control points set to the vertical midpoint of `y1` and `y2` to produce a smooth S-curve.

**Returns:** `SVGPathElement`

**Side effects:** Appends the `<path>` to `canvas`.

| Parameter | Type | Description |
|---|---|---|
| `canvas` | `SVGElement` | The `#skillTreeEdges` SVG overlay. |
| `x1` | `number` | Source anchor x in pixels - bottom-center of the source node. |
| `y1` | `number` | Source anchor y in pixels - bottom-center of the source node. |
| `x2` | `number` | Target anchor x in pixels - top-center of the target node. |
| `y2` | `number` | Target anchor y in pixels - top-center of the target node. |

---

#### `createEdges(canvas, edges, positions, nodeWidth, nodeHeight)`

Creates the `#skillTreeEdges` SVG overlay and draws all inferred edges by calling `createEdge()` once per edge.

**Returns:** `void`

**Side effects:**
- Creates `<svg id="skillTreeEdges">` (absolute, full-size, `pointer-events: none`) and appends it to `canvas`.
- Calls `createEdge()` once per edge, appending a `.skillTree-edge` path to the SVG.

| Parameter | Type | Description |
|---|---|---|
| `canvas` | `Element` | The `#skillTreeCanvas` div. |
| `edges` | `{ fromId: string, toId: string }[]` | Edge definitions from `inferEdges`. |
| `positions` | `{ id: string, x: number, y: number }[]` | Position array from `computeNodeCoords`. |
| `nodeWidth` | `number` | Node card width in pixels - passed to `computeEdgePoints`. |
| `nodeHeight` | `number` | Node card height in pixels - passed to `computeEdgePoints`. |

---

#### `createPopups(container, courses, positions, canvasWidth)`

Creates one `.skillTree-popup` per course. Placement side is determined per node by calling `computePopupSide()`.

**Returns:** `{ popups: Element[] }`

**Side effects:** Appends one `.skillTree-popup` per course to `container`.

| Parameter | Type | Description |
|---|---|---|
| `container` | `Element` | The `#skillTreeCanvas` div. |
| `courses` | `object[]` | Extracted course data array. |
| `positions` | `{ id: string, x: number, y: number }[]` | Position array from `computeNodeCoords`. |
| `canvasWidth` | `number` | Total canvas width in pixels - passed to `computePopupSide`. |

---

### skillTree.state.js

#### `createSkillTreeState()`

Returns a fresh isolated state object for one tree instance. Each call returns a new object - state is never shared between instances.

**Returns:** `{ activeFilter: null, selectedNodeId: null, canvasWidth: null }`

---

### skillTree.controller.js

#### `createSkillTreeController(state, nodes, popups, filters)`

Returns `{ bindAll }`. All event listeners for the tree are bound via `bindAll()`. All DOM mutations are delegated to `skillTree.dom.js`.

Popup positioning constants used inside `onNodeClick`:

```javascript
const popupWidth = 300; // px - matches .skillTree-popup width in injected CSS
const gap        =  20; // px - space between node edge and popup
```

**Returns:** `{ bindAll: () => void }`

| Parameter | Type | Description |
|---|---|---|
| `state` | `object` | State object from `createSkillTreeState`. |
| `nodes` | `Element[]` | Node elements from `createNodes`. |
| `popups` | `Element[]` | Popup elements from `createPopups`. |
| `filters` | `Element[]` | Filter button elements from `createFilters`. |

**`bindAll()` binds:**

- `click` on each node - opens that node's popup; closes the previously active one. Clicking the active node again closes it. Popup is positioned by reading the node rect via `getNodeRect()` and calling `computePopupCoords()`.
- `click` on each popup's `.popup-close` - closes the active popup.
- `click` on each filter button - activates domain filter; dims all non-matching nodes; closes the active popup if its node was just dimmed. Clicking the active filter again deactivates it and restores all nodes.

---

## CSS Custom Properties

Injected by `injectStyles()` inside `@layer auraq.skillTree`. All aesthetic values are custom properties. Fallback chain: component token -> semantic token -> hardcoded value.

### Node Card

| Property | Default | Controls |
|---|---|---|
| `--skillTree-node-bg` | `var(--surface-color, #1E1E1E)` | Node card background |
| `--skillTree-node-border` | `color-mix(in srgb, var(--text-color, #EFF9F0) 7%, transparent)` | Node card border color |
| `--skillTree-node-radius` | `10px` | Node card border-radius |

### Edges

| Property | Default | Controls |
|---|---|---|
| `--skillTree-edge-color` | `color-mix(in srgb, var(--text-color, #EFF9F0) 10%, transparent)` | SVG edge stroke color |

### Popup

| Property | Default | Controls |
|---|---|---|
| `--skillTree-popup-bg` | `var(--surface-color, #1E1E1E)` | Popup background |
| `--skillTree-popup-border` | `color-mix(in srgb, var(--text-color, #EFF9F0) 13%, transparent)` | Popup border color |

### Filter Bar and Toggle Buttons

| Property | Default | Controls |
|---|---|---|
| `--skillTree-filter-active-bg` | `var(--nc, #FF9124)` | Active filter button background |
| `--skillTree-toggle-bg` | `var(--surface-color-2, #272727)` | Toggle button group background |

### Domain Color (`--nc`)

`--nc` is an inline style set per element by `createNodes()`, `createPopups()`, and `createFilters()`. It is not a global token - it is scoped to each element individually. Default domain colors:

| Domain | Color |
|---|---|
| Testing | `#149B48` |
| Security | `#e05252` |
| Frontend | `#FF9124` |
| Cloud | `#38bdf8` |

To override a domain color from the site, set `--nc` on the relevant `<details>` in site CSS:

```css
[data-skills] details[data-skill-domain="Cloud"] { --nc: #your-color; }
```

---

## Generated DOM

SkillTree generates the following elements. The site must not author them directly.

| Element | Description |
|---|---|
| `.skillTree-toggles` | Button group prepended to `[data-skills]` |
| `.skillTree-toggle-btn` | Accordion and Tree buttons inside the group |
| `.skillTree-tree` | Tree container div appended to `[data-skills]` |
| `.skillTreeContainer` | Class added to `.skillTree-tree` by `initContainer()` |
| `#skillTreeCanvas` | Positioned canvas div inside `.skillTreeContainer` |
| `#skillTreeEdges` | SVG overlay inside `#skillTreeCanvas`; `pointer-events: none` |
| `.skillTree-edge` | SVG `<path>` elements inside the SVG overlay |
| `.skillTree-node` | Node cards inside `#skillTreeCanvas` |
| `.skillTree-filterBar` | Filter pill bar appended to `.skillTree-tree` |
| `.skillTree-filterButton` | Filter buttons inside the bar |
| `.skillTree-popup` | Popup cards inside `#skillTreeCanvas` |

---

## Module Architecture

```
skillTree.init.js        <- composition root -- discovery, extraction, lazy build, view switching
skillTree.controller.js  <- event handling for node click, filter toggle, and popup close
skillTree.dom.js         <- all DOM reads and writes
skillTree.engine.js      <- pure coordinate math and geometry; no DOM access
skillTree.render.js      <- DOM creation for nodes, edges, popups, filters, and toggle buttons
skillTree.state.js       <- state factory
```

Import graph:

```
init.js  -> dom.js
         -> engine.js
         -> render.js  -> dom.js
                       -> engine.js
         -> state.js
         -> controller.js  -> dom.js
                           -> engine.js
```

---

## Relationship to SkillAccordion

SkillTree and SkillAccordion share the `[data-skills]` DOM surface. Each module discovers the container independently and reads the `<details>` nodes without calling into the other.

| Concern | Owner |
|---|---|
| `[data-skills]` container | Shared - both modules discover it via `document.querySelector('[data-skills]')` |
| `<details>` node visibility (`hidden`) | SkillTree - sets and clears `hidden` on each `<details>` node when switching views |
| Toggle button injection | SkillTree - prepends `.skillTree-toggles` to `[data-skills]` |
| Accordion open/close animation | SkillAccordion - drives height animation on each `<details>` body |

There is no cross-module cancellation API. SkillTree does not call into SkillAccordion and SkillAccordion does not call into SkillTree. Initialization order in `main.js` is not constrained - both modules independently discover the same container without coordination. SkillTree takes `hidden` ownership of the `<details>` nodes only after the first Tree click; before that click the accordion is the active renderer and SkillAccordion operates normally.
