# Auraq - Contract Phase

The single source of truth for the Contract phase overhaul. This
document is committed at the start of the phase and moved to `archive/`
on completion. `docs(contract):` commits throughout this phase are
exclusively for modifications to this file.

---

## Scope

**Modules in scope:** Panning, SectionMap, SkillTree, SkillAccordion,
COBE (documentation only)
No other planned modules are touched in this phase.

**What this phase delivers:**

- Design system foundation
  - `auraq-tone.css`
  - Primitive tokens
  - Semantic tokens
- Module CSS architecture
  - `injectStyles()` replaced with `@layer` + CSS custom properties
- HTML contract model
  - Every in-scope module has a documented HTML contract in its `API.md`
- No-JS safety
  - Broken page states fixed via a JS gate
- Two-renderer model (no JSON fetch)
  - SkillTree reads from SkillAccordion HTML; JSON fetch removed

**Explicitly out of scope**
- Dark/light mode
- RTL support
- `@property` registrations
- Any module not listed above
- Consumer site CSS migrations beyond `templates/`.

---

## Architectural Principles

These are invariants for this phase and all future Auraq development.

1. **Auraq never delivers HTML.**
The site authors HTML following a documented contract. Auraq discovers
and enhances that HTML. It never fetches or injects HTML content.

2. **Auraq's CDN surface is JS and default, configurable CSS.**
For HTML/CSS category components (SkillAccordion, etc.), Auraq ships
no CSS. The site owns their styling entirely.

3. **Auraq-generated UI defers to site tokens.**
Every aesthetic value in Auraq-injected CSS must be CSS custom property.
Fallback chain: site component token -> site semantic token -> Auraq's
hardcoded value. The site's token wins automatically through the cascade.

4. **The site owns HTML and styles. Auraq owns behavior.**
Auraq ships CSS only for UI it generates - pill bars, toggle buttons,
overlays, popups. Not for HTML the site authors.

5. **No-JS must not break content visibility.**
Any CSS that would clip, hide, or lock content without JS running is
gated behind a `[data-js]` attribute.

---

## Design System Foundations

### Token Hierarchy

```
Primitive tokens  ->  Semantic tokens  ->  Component tokens
(raw values)         (purpose-mapped)     (per-module, optional)
```

- **Primitive**
Raw values, no semantic meaning (`--color-orange-500: #FF9124`)

- **Semantic**
Purpose-mapped to primitives (`--theme-color: var(--color-orange-500)`)

- **Component**
Per-module aliases, defined inside the module's `@layer`
(`--sectionMap-thumb: var(--theme-color, #FF9124)`)

Sites override semantic tokens to retheme all Auraq-generated UI.
Sites override component tokens to retheme one module only.

### auraq-tone.css - This Phase

`auraq-tone.css` lives at the repo root, served from `cdn.auraq.org`,
aliased via `tone.auraq.org`. Consumer sites import it before their own CSS.

Contents for this phase, in order:

```css
/* 1. @layer order - unlayered consumer CSS wins automatically */
@layer auraq.base, auraq.modules, auraq.theme;

/* 2. Primitive color tokens */
:root {
  --color-orange-500: #FF9124;
  --color-orange-600: #F16724;
  --color-orange-400: #FDA40B;
  --color-green-500:  #149B48;
  --color-near-black: #140A0A;
  --color-surface:    #1E1E1E;
  --color-foreground: #EFF9F0;
}

/* 3. Semantic color tokens */
:root {
  --theme-color:   var(--color-orange-500);
  --accent-color:  var(--color-green-500);
  --bg-color:      var(--color-near-black);
  --surface-color: var(--color-surface);
  --text-color:    var(--color-foreground);
}

/* 4. Type scale tokens */
:root {
  --fs-micro: 0.75rem;
  --fs-meta:  0.875rem;
  --fs-base:  1rem;
  --fs-h6: 1.25rem;
  --fs-h5: 1.5625rem;
  --fs-h4: 1.9375rem;
  --fs-h3: 2.4375rem;
  --fs-h2: 3.0625rem;
  --fs-h1: 3.8125rem;
}

/* 5. Font family tokens */
:root {
  --font-primary:     "Exo 2", system-ui, sans-serif;
  --font-heading:     "Faustina", serif;
  --font-heading-alt: "Space Grotesk", system-ui, sans-serif;
  --font-mono:        "Space Mono", monospace;
  --font-display:     "Aldrich", system-ui, sans-serif;
  --font-display-alt: "Orbitron", system-ui, sans-serif;
  --font-arabic:      "Zain", system-ui, sans-serif;
}
```

No `@property` registrations this phase. Those are added per-module
when animatable tokens are needed.

### Module CSS Pattern

Each module's injected CSS follows this exact structure:

```css
@layer auraq.moduleName {

  /* Structural - not customizable */
  .module-element {
    position: absolute;
    z-index: 9999;
    display: flex;
    /* layout, positioning, overflow, pointer-events */

    /* Aesthetic - always a custom property */
    background: var(--moduleName-bg, var(--bg-color, #140A0A));
    color:      var(--moduleName-text, var(--text-color, #EFF9F0));
    border: 1px solid var(--moduleName-border, rgba(255,255,255,0.22));
  }
}
```

**Structural CSS** - layout, position, z-index, overflow, display,
flex/grid setup, pointer-events, dimensions that are load-bearing.
Not overridable by the site.

**Aesthetic CSS** - color, background, typography, border, border-radius, shadow,
opacity, transition duration/easing. Always exposed as a `--moduleName-property`
custom property. Fallback chain must have at least two levels: a semantic token
and a hardcoded value.

### Deprecated Color Pattern

The `rgb(var(--primary-color))` tuple pattern (where
`--primary-color: 20, 10, 10`) is deprecated.
Replace with standard hex tokens and `color-mix()` for opacity:

```css
/* Deprecated */
background: rgba(var(--primary-color), 0.88);

/* Replacement */
background: color-mix(in srgb,
  var(--bg-color, #140A0A) 88%, transparent);
```

`color-mix()` support: Chrome 111+, Firefox 113+, Safari 16.2+.

Any consumer site CSS using the old tuple pattern must be migrated. Since all
consumer sites are first-party, this is tracked per site, not in this document.

---

## No-JS Strategy

### The JS Gate

A `data-js` attribute on `<html>` gates all CSS that would break the
page without JS. It is set by an inline script in `<head>` (before any
rendering) in each consumer site:

```html
<head>
  <script>document.documentElement.setAttribute('data-js','')</script>
  <!-- rest of head -->
</head>
```

This script is authored per consumer site. Auraq does not deliver it.

CSS that must not apply without JS is scoped under `[data-js]`:

```css
/* Applied only when JS is confirmed running */
[data-js] .scrollContainer { touch-action: none; }

/* Always present - native scroll works without JS */
.scrollContainer { overflow-y: auto; }
```

> [!NOTE]
> JS Gate [data-js] is purely the site Author's concern and is not a
> deliverable of either this overhaul or Auraq

### Per-Module No-JS Behavior

| Module | No-JS behavior |
|---|---|
| Panning | Native scroll via `overflow`. `touch-action: none` gate removed. |
| SectionMap | Pill bar never renders. Sections scroll natively. No fallback needed. |
| SkillTree | Tree never renders. SkillAccordion is visible and functional by default. |
| SkillAccordion | Renders natively as `<details>`/`<summary>`. No JS required. |
| COBE | Canvas is present but empty. Decorative - no fallback required. If a canvas conveys meaningful content (location marker), the site authors an adjacent `<noscript>` element. |

---

## HTML Contracts

### Panning

```html
<div class="scrollContainer" data-panning-axis="y">
  <!-- content -->
</div>
```

**Required attribute:** `data-panning-axis` - value `x`, `y`, or `xy`.

**Required site CSS per axis:**

```css
.scrollContainer {
  scrollbar-width: none;
}
.scrollContainer::-webkit-scrollbar { display: none; }

[data-panning-axis="y"]  { overflow-y: auto; overflow-x: hidden; }
[data-panning-axis="x"]  { overflow-x: auto; overflow-y: clip; }
[data-panning-axis="xy"] { overflow: auto; }
```

`touch-action: none` must not be in the site's base CSS. It is applied
by Auraq under `[data-js]` only. `overflow-y: clip` on x-axis containers
is intentional - `hidden` creates an implicit scroll context that
swallows wheel events and breaks scroll chaining.

No-JS: native scroll via the `overflow` properties above.

---

### SectionMap

```html
<div class="scrollContainer" id="main" data-panning-axis="y">
  <main>
    <section id="hero">...</section>
    <section id="work">...</section>
    <!-- one <section> per scroll destination -->
  </main>
</div>
```

**Requirements:**
- Container must have `id="main"` - SectionMap discovers it by this ID.
- Sections must be direct children of `<main>`.
- Container must have `scroll-behavior: auto`, all three scrollers write
`scrollTop` directly and must not compete with a browser-managed scroll.

**Auraq generates:** pill bar, tick marks, thumb. These are Auraq UI and
are styled by Auraq's module CSS under `@layer auraq.sectionMap`,
overridable via custom properties.

No-JS: the pill bar never exists.

---

### Skills (SkillTree + SkillAccordion)

The Skills component has two renderers sharing one HTML source. The site
authors the HTML once. Without JS, it is a native accordion. With JS, a
toggle pair of buttons appears and the user can switch to the tree view.

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

**Attribute schema:**

| Attribute | Required | Type | Description |
|---|---|---|---|
| `data-skill-id` | Yes | String | Unique identifier across all skills |
| `data-skill-display` | Yes | String | Short name shown in tree node card |
| `data-skill-domain` | Yes | String | Domain - drives color coding and filter |
| `data-skill-branch` | Yes | String | Tree column grouping |
| `data-skill-layer` | Yes | Integer ≥ 1 | Tree row; determines vertical position |
| `data-skill-institute` | Yes | String | Institution name |
| `data-skill-year` | Yes | Integer | Year completed or in progress |
| `data-skill-tags` | Yes | String | Comma-separated tag list |
| `data-skill-link` | Yes | String | URL to course or resource |

**Content mapping:**

- `<summary>` text - full course name, shown in popup
- `<p>` text - description, shown in popup
- `data-skill-display` - short name, shown in tree node card

**Corner cases:**

- `data-skill-tags` is split on `,` - tag names must not contain commas.
- Duplicate `data-skill-id` values - warns and skips the duplicate.
  First occurrence wins.
- Non-integer `data-skill-layer` - warns and skips that node.
  Accordion entry still renders.
- Missing any required attribute - warns with the offending
`data-skill-id` and skips that node. The `<details>` entry
still renders in the accordion.
- `[data-skills]` with no `<details>` children - `initSkills()` warns
and exits entirely.
- A `<details>` with no `<p>` - description defaults to empty string
in the popup.

**Auraq generates:** view toggle buttons, tree canvas, node cards,
popups, filter bar, SVG edges. These are Auraq UI.

**View toggle logic:**

- Default state: accordion visible, tree not yet built.
- First "Tree" click: tree built from DOM reading, accordion hidden.
- "Accordion" click: tree hidden, accordion shown. Tree stays in memory.
- Subsequent "Tree" clicks: no rebuild. Show the already-built tree.

Toggle buttons are only injected when JS runs. Without JS, no buttons
appear and the accordion is the only renderer.

No-JS: `[data-skills]` renders as a list of native `<details>` elements.
All skill content is accessible.

---

### COBE

```html
<canvas
  class="cobe"
  style="width: 500px; height: 500px"
  width="1000"
  height="1000"
></canvas>
```

Discovery: `class="cobe"`. Multiple canvases on one page are all initialized
via `querySelectorAll('.cobe')`.

No-JS: canvas is present but empty. For decorative use this is acceptable. If
the globe conveys meaningful content, the site authors an adjacent `<noscript>`:

```html
<canvas class="cobe" ...></canvas>
<noscript>
  <p>Located in Islamabad, Pakistan.</p>
</noscript>
```

---

## Module Changes

### auraq-tone.css (new file)

- Create `auraq-tone.css` at repo root per the token block defined above.
- Served from `cdn.auraq.org/auraq-tone.css`, alias as `tone.auraq.org`.

### Panning

No changes to JS. Panning is behavior-only and ships no CSS.

- **`templates/index.html`** - add JS gate inline script in `<head>`.
- **`templates/css/styles.css`** - remove `touch-action: none` from base
  `.scrollContainer`. Apply only under `[data-js]`. Remove token
  definitions now covered by `auraq-tone.css`.
  Add import of tone (or relative path for template).
- **`modules/panning/API.md`** - update HTML contract section, CSS
  requirements (note the `touch-action` gate), no-JS behavior.

### SectionMap

No changes to JS logic.

- **`modules/sectionMap/sectionMap.render.js`** - refactor `injectStyles()`:
  - Wrap all CSS in `@layer auraq.sectionMap {}`
  - Replace every hardcoded aesthetic value with a CSS custom property
  - Custom properties to expose (with two-level fallback each):

    | Property | Controls |
    |---|---|
    | `--sectionMap-bar-bg` | Bar background |
    | `--sectionMap-bar-border` | Bar border color |
    | `--sectionMap-bar-radius` | Bar border-radius |
    | `--sectionMap-bar-opacity` | Bar default opacity |
    | `--sectionMap-tick-color` | Tick mark color |
    | `--sectionMap-thumb-color` | Thumb color |
    | `--sectionMap-thumb-radius` | Thumb border-radius |

- **`modules/sectionMap/API.md`** - add HTML contract section, add CSS custom
  properties reference table.

### Skills (SkillTree)

Major rewrite of `init.js`. Render and DOM files get additions. Engine
remains unchanged.

The module folder stays `modules/skillTree/`. The exported init function
is renamed `initSkills()` for clarity, but the file name stays
`skillTree.init.js`. The existing `modules/skillTree/design.md` is
deleted - its content is superseded by the updated `API.md`.

**`modules/skillTree/skillTree.dom.js`** - add two functions:

```javascript
// Returns the [data-skills] container
export function getSkillsContainer() {
  return document.querySelector('[data-skills]');
}

// Returns all <details> children of the container
export function getSkillNodes(container) {
  return Array.from(container.querySelectorAll(':scope > details'));
}
```

**`modules/skillTree/skillTree.init.js`** - full rewrite:

- Remove JSON fetch entirely.
- Read `[data-skills]` via `getSkillsContainer()`.
- Read all `<details>` via `getSkillNodes()`.
- Extract course data from `data-*` attributes and element text content.
- Pass extracted array to the existing engine functions (engine unchanged).
- Call `createToggleButtons()` from render.js on init.
- Guard: warn and exit if container not found or no skill nodes found.
- Guard: warn and skip nodes with missing required attributes or invalid
  `data-skill-layer`.
- Lazy tree init: tree is built only on first "Tree" button click, not
  on page load.

**`modules/skillTree/skillTree.render.js`** - two additions, one refactor:

1. Add `createToggleButtons(container)` - creates and appends the
   Accordion/Tree button pair to the container.
   Returns `{ accordionBtn, treeBtn }`.
2. Refactor `injectStyles()`:
   - Wrap all CSS in `@layer auraq.skillTree {}`
   - Replace hardcoded aesthetic values with CSS custom properties:

     | Property | Controls |
     |---|---|
     | `--skillTree-node-bg` | Node card background |
     | `--skillTree-node-border` | Node card border |
     | `--skillTree-node-radius` | Node card border-radius |
     | `--skillTree-edge-color` | SVG edge stroke color |
     | `--skillTree-popup-bg` | Popup background |
     | `--skillTree-popup-border` | Popup border |
     | `--skillTree-filter-active-bg` | Active filter button background |
     | `--skillTree-toggle-bg` | Toggle button group background |

3. Add CSS for the toggle buttons inside the same
   `@layer auraq.skillTree {}` block.

**`modules/skillTree/skillTree.engine.js`** - no changes.

**`modules/skillTree/skillTree.controller.js`** - no changes to
filter/node/popup logic. Toggle button event binding is wired in
`skillTree.init.js`, not here.
Controller concern remains: node click, popup close, filter toggle.

**`modules/skillTree/API.md`** - full rewrite to reflect:
- New HTML contract (the `[data-skills]` / `<details>` model)
- Two-renderer model description
- Updated module architecture (new functions in dom.js, new init flow)
- CSS custom properties reference

**`data/courses.json`** - retained at repo root as reference schema only.
Not used at runtime. A comment at the top of the file notes this.

### COBE

No JS changes. No CSS changes (renders to canvas).

- **`vendor/cobe/API.md`** - create if not present: HTML contract, no-JS
  behavior, `initGlobe()` options reference (already documented in JSDoc
  but should be surfaced here for consistency with other modules).

---

## Implementation Sequence

Each step is independently committable.
Steps within a block can be batched into one commit if they are tightly
coupled; otherwise one step per commit.

**Block 1 - No-JS gate (unblocks everything else)**

1. `templates/index.html` - add JS gate inline script in `<head>`
2. `templates/css/styles.css` - gate `touch-action: none` under
   `[data-js]`, remove other no-JS-breaking CSS from `.scrollContainer`

**Block 2 - Design system foundation**

3. `auraq-tone.css` - create file with `@layer` declaration, primitive
   tokens, semantic tokens, type scale, font families (in that order
   within the file)
4. `templates/css/styles.css` - import `auraq-tone.css`, remove token
   definitions now covered by it, migrate any `rgb(var(--x))` tuple
   usage to standard values

**Block 3 - SectionMap**

5. `modules/sectionMap/sectionMap.render.js` - refactor `injectStyles()`
   to `@layer auraq.sectionMap` + custom properties
6. `modules/sectionMap/API.md` - add HTML contract section, CSS custom
   properties table

**Block 4 - Skills**

7. `modules/skillTree/skillTree.dom.js` - add `getSkillsContainer()` and
   `getSkillNodes()`
8. `modules/skillTree/skillTree.init.js` - full rewrite: DOM reader,
   lazy tree init, toggle wiring, guards
9. `modules/skillTree/skillTree.render.js` - add `createToggleButtons()`,
   refactor `injectStyles()` to `@layer auraq.skillTree` + custom CSS
10. `modules/skillTree/design.md` - delete (superseded by API.md)
11. `modules/skillTree/API.md` - full rewrite

**Block 5 - Documentation pass**

12. `modules/panning/API.md` - update HTML contract and CSS requirements
13. `vendor/cobe/API.md` - create with HTML contract and no-JS behavior
14. Root `API.md` - update module index; note `initSkills()` rename
15. `README.md` - update repository structure if directory layout changed

**Note on `templates/js/skillTree/`:**
These files are frozen one-time boilerplate and are not updated in this
phase. `templates/` does not track live module changes.
