# SkillAccordion Module - API Reference

SkillAccordion animates the open and close transitions of the `[data-skills]` accordion.

> See also: [skillTree](../skillTree/API.md)

---

## HTML Contract

### Required HTML

The site authors a `[data-skills]` container with one `<details>` element per skill. SkillAccordion discovers all `<details>` elements inside every `[data-skills]` container on the page. This is the same HTML source shared with SkillTree - the site authors it once and both modules read from it independently.

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
    <summary>
      <span class="skill-title">Automated Software Testing</span>
      <span class="skill-subtitle">Unit Testing, Coverage Criteria and Design for Testability</span>
    </summary>
    <div class="skill-body">
      <div class="skill-body-inner">
        <p class="skill-description">Academic course for applied testing - criteria-driven design that finds real bugs systematically.</p>
        <div class="skill-meta">
          <div class="skill-meta-item">
            <span class="skill-meta-label">Institute</span>
            <span class="skill-meta-value">DelftX</span>
          </div>
          <div class="skill-meta-item">
            <span class="skill-meta-label">Year</span>
            <span class="skill-meta-value">2026</span>
          </div>
          <div class="skill-meta-item">
            <span class="skill-meta-label">Domain</span>
            <span class="skill-meta-value">Testing</span>
          </div>
        </div>
        <div class="skill-tags">
          <span class="skill-tag">Unit Testing</span>
          <span class="skill-tag">Coverage Criteria</span>
          <span class="skill-tag">Test Design</span>
        </div>
        <a class="skill-link" href="https://..." target="_blank" rel="noopener noreferrer">View Course</a>
      </div>
    </div>
  </details>

  <!-- additional <details> per skill -->

</div>
```

`.skill-subtitle` is optional - omit the span and the summary collapses to a single line. All other elements shown above are expected to be present for a complete entry.

`data-*` attributes on `<details>` are not read by SkillAccordion. They are consumed by SkillTree only.

### Element Discovery

| Name | Selector | Required | Description |
|---|---|---|---|
| Skills container | `[data-skills]` | Yes | Discovered via `querySelectorAll('[data-skills]')`. Multiple containers on one page are all wired. |
| Skill entry | `details` | Yes | One per skill. Must be a descendant of `[data-skills]`. |
| Clickable header | `summary` | Yes | Must be a direct child of `details`. Receives the click listener. |
| Animation target | `.skill-body` | Yes | Must be a direct child of `details`, sibling of `summary`. Height is animated on this element. |

All elements inside `.skill-body` -- `.skill-body-inner`, `.skill-description`, `.skill-meta`, `.skill-tags`, `.skill-tag`, `.skill-link`, `.skill-title`, `.skill-subtitle` -- are not queried by SkillAccordion. They are authored by the site and styled via the site's CSS.

### Required Site CSS

`overflow: hidden` on `.skill-body` is the only rule SkillAccordion itself requires -- without it, content remains visible at full height during the close animation.

> [!NOTE]
> Everything below is the complete reference implementation; copy it as-is to get a working, styled entry.

```css
/* Domain accent color -- drives border, tag, and link color per entry.
   Add a selector for each domain value used in data-skill-domain.
   Entries with no matching selector fall back to var(--theme-color). */
[data-skills] details[data-skill-domain="Testing"]  { --nc: #149B48; }
[data-skills] details[data-skill-domain="Security"] { --nc: #e05252; }
[data-skills] details[data-skill-domain="Frontend"] { --nc: #FF9124; }
[data-skills] details[data-skill-domain="Cloud"]    { --nc: #38bdf8; }

/* Container */
[data-skills] {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Entry card */
[data-skills] details {
  width: 100%;
  background-color: var(--surface-color-2);
  border: 1px solid color-mix(in srgb, var(--text-color) 8%, transparent);
  border-left: 3px solid var(--nc, var(--theme-color));
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 180ms ease, border-left-color 180ms ease;
}

[data-skills] details[open] {
  border-color: color-mix(in srgb, var(--nc, var(--theme-color)) 35%, transparent);
  border-left-color: var(--nc, var(--theme-color));
}

/* Summary -- clickable header */
[data-skills] details summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 52px 14px 20px;
  position: relative;
  cursor: pointer;
  list-style: none;
  transition: background-color 150ms ease;
}

[data-skills] details summary::-webkit-details-marker {
  display: none;
}

[data-skills] details summary:hover {
  background-color: color-mix(in srgb, var(--text-color) 4%, transparent);
}

[data-skills] details summary:focus-visible {
  outline: 2px solid var(--nc, var(--theme-color));
  outline-offset: -2px;
}

/* Chevron */
[data-skills] details summary::after {
  content: "\25B6";
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%) rotate(0deg);
  font-size: var(--fs-micro);
  color: var(--theme-color);
  transition: transform 200ms ease;
}

[data-skills] details[open] summary::after {
  transform: translateY(-50%) rotate(90deg);
}

/* Title -- primary line in summary */
[data-skills] details summary .skill-title {
  font-family: var(--font-heading);
  font-size: var(--fs-h5);
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.2;
}

/* Subtitle -- secondary line in summary; omit the span to suppress */
[data-skills] details summary .skill-subtitle {
  font-family: var(--font-primary);
  font-size: var(--fs-meta);
  color: color-mix(in srgb, var(--text-color) 60%, transparent);
  line-height: 1.3;
}

/* Animation target -- overflow: hidden is required by SkillAccordion */
[data-skills] details .skill-body {
  overflow: hidden;
}

/* Inner content wrapper */
[data-skills] details .skill-body-inner {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px 20px;
  border-top: 1px solid color-mix(in srgb, var(--text-color) 7%, transparent);
}

/* Description */
[data-skills] details .skill-description {
  font-family: var(--font-primary);
  font-size: var(--fs-base);
  color: color-mix(in srgb, var(--text-color) 80%, transparent);
  line-height: 1.6;
}

/* Meta row */
[data-skills] details .skill-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

[data-skills] details .skill-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

[data-skills] details .skill-meta-label {
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  color: color-mix(in srgb, var(--text-color) 45%, transparent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

[data-skills] details .skill-meta-value {
  font-family: var(--font-primary);
  font-size: var(--fs-meta);
  color: var(--text-color);
}

/* Tags */
[data-skills] details .skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

[data-skills] details .skill-tag {
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  color: var(--nc, var(--theme-color));
  background-color: color-mix(in srgb, var(--nc, var(--theme-color)) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--nc, var(--theme-color)) 28%, transparent);
  border-radius: 4px;
  padding: 3px 8px;
}

/* Course link */
[data-skills] details .skill-link {
  align-self: flex-start;
  font-family: var(--font-mono);
  font-size: var(--fs-meta);
  color: var(--nc, var(--theme-color));
  text-decoration: none;
  border: 1px solid var(--nc, var(--theme-color));
  border-radius: 4px;
  padding: 6px 14px;
  transition: background-color 150ms ease, color 150ms ease;
}

[data-skills] details .skill-link:hover {
  background-color: var(--nc, var(--theme-color));
  color: var(--bg-color);
}

@media (max-width: 800px) {
  [data-skills] details summary .skill-title {
    font-size: var(--fs-h6);
  }
}
```

The `--nc` custom property is set per entry via the domain selector block at the top. Entries whose `data-skill-domain` value has no matching selector leave `--nc` unset; all domain-colored elements then fall back to `var(--theme-color)`.

### Corner Cases

- No `[data-skills]` containers found - `initSkillAccordion()` emits a `console.warn` and returns early. No listeners are registered.
- A `<details>` with no `summary` - that entry is silently skipped. Its `<details>` still renders natively.
- A `<details>` with no `.skill-body` - that entry is silently skipped. Its `<details>` still renders natively; open and close are instant with no animation.

---

## No-JS Behavior

`<details>` / `<summary>` is native HTML. Without JS, open and close are instant with no animation. All skill content -- description, meta row, tags, and course link -- remains fully accessible. No fallback is needed.

---

## Animation

SkillAccordion uses the Web Animations API (`element.animate()`), not CSS transitions or `@starting-style`. This guarantees the open animation fires on every open, including reopens after a close - which CSS `@starting-style` does not reliably provide for `<details>` in Firefox due to the browser's internal handling of the element's hidden state.

### Open sequence

1. `details.open = true` is set before the animation starts so the browser renders `.skill-body` content into the DOM and `scrollHeight` is readable.
2. `fill: 'backwards'` applies the first keyframe (`height: 0px`) immediately, preventing a one-frame flash of content at full height before the animation begins.
3. Animation runs: `height: 0px` -> `height: scrollHeight`.
4. `onfinish`: animation is cancelled and the reference cleared. Cancelling after finish removes the fill effect from the element so it does not interfere with subsequent animations.

### Close sequence

1. Animation runs: `height: scrollHeight` -> `height: 0px`. No `fill: 'forwards'` - the finished state is committed by the next step, not by fill.
2. `onfinish`: `details.open = false` hides the content. Animation is then cancelled and the reference cleared.

### Interruption

If a second click arrives while an animation is running, the in-progress animation is cancelled before the new one starts. The element snaps to its current rendered state, which is a clean starting point for the next animation. No stale fill effects remain.

### Constants

```javascript
const DURATION = 350; // ms
const EASING   = 'cubic-bezier(0.22, 1, 0.36, 1)';
```

These are module-level constants, not configurable at call time. To change them, edit the module source.

---

## Drag Guard

SkillAccordion includes a self-contained drag guard that prevents accordion toggling when the pointer has moved more than 5px before release. This mirrors the drag threshold of the Panning module (`dragThreshold: 5`) so that a panning gesture whose pointer happens to land on a `<summary>` does not accidentally open or close the accordion.

The guard is document-level and operates independently of the Panning module - it imports nothing from Panning and requires no coordination with it. Three document-level listeners manage it:

| Event | Action |
|---|---|
| `pointerdown` | Records start coordinates, resets `gestureWasDrag` to `false` |
| `pointermove` | Sets `gestureWasDrag = true` if displacement exceeds 5px on either axis |
| `click` on `summary` | If `gestureWasDrag` is `true`, calls `e.preventDefault()` and returns |

The guard is registered once per `initSkillAccordion()` call on `document`, not once per `<details>`.

---

## Exports

### skillAccordion.init.js

| Export | Description |
|---|---|
| `initSkillAccordion()` | Entry point. Discovers all `[data-skills]` containers, registers the document-level drag guard, and attaches animated open/close behavior to every `<details>` found inside them. Warns and returns if no `[data-skills]` containers are found. |

**Initialisation flow:**

1. `querySelectorAll('[data-skills]')` - find all containers or warn and return.
2. Register drag guard listeners on `document`.
3. For each container, for each `<details>`:
   - Find `summary` and `.skill-body`. Skip this entry if either is absent.
   - Attach `click` listener to `summary` with drag guard check and WAAPI animation logic.

**Side effects:**

- Emits a `console.warn` and returns early if no `[data-skills]` containers are found
- Registers `pointerdown` and `pointermove` on `document` for the drag guard
- Registers a `click` listener on every `summary` inside every `[data-skills]` container

---

## CSS Shipped by Auraq

None. Per Auraq architectural principle 2: for HTML/CSS category components, Auraq ships no CSS. The site owns all visual treatment of `[data-skills]`, `details`, `summary`, `.skill-title`, `.skill-subtitle`, `.skill-body`, `.skill-body-inner`, `.skill-description`, `.skill-meta`, `.skill-meta-item`, `.skill-meta-label`, `.skill-meta-value`, `.skill-tags`, `.skill-tag`, `.skill-link`, and their descendants.

The only CSS requirement Auraq imposes is `overflow: hidden` on `.skill-body`, documented above.

---

## Module Architecture

Single-file module -- no import graph.

```
skillAccordion.init.js  <- composition root -- discovery, drag guard, animation wiring
```

---

## Relationship to SkillTree

Both modules read from the same `[data-skills]` HTML and operate independently. `initSkillAccordion()` and `initSkillTree()` are called separately in `main.js` and have no coupling.

When SkillTree's toggle is active and the tree view is shown, the `<details>` elements are hidden via `hidden` attribute. SkillAccordion's listeners remain attached but do not fire while the elements are hidden - the `click` listener on `summary` cannot receive events through `hidden`. No cleanup or coordination is needed between the two modules.
