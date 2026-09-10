# Contributing to Auraq Core

Thank you for your interest in contributing. This guide outlines how to
organize, document, and extend the codebase so that modularity does not
compromise discoverability and maintainability.

## 1. Repository Canonicality

The temporary canonical source of truth for this repository is GitHub:
- https://github.com/AuraqLabs/auraq-core

Two mirrors are maintained at:
- https://kinu.tngl.sh/auraq-core
- https://sr.ht/kinucyber/auraq-core

The mirrors are kept in sync automatically.
Do not push directly to the mirror -- all contributions should target
the GitHub remote for now (temporarily).

> [!CAUTION]
> Sourcehut (sr.ht) will become the canonical source of truth in the
> near future.
>
> **DO NOT FILE ISSUES ON GITHUB!**
> Contact **admin@auraq.org** for any issues.

---

## 2. File & Folder Structure

```
auraq-core/
|- data/
|   `- courses.json
|- further-reading/
|   `- resources.md
|- modules/
|   |- panning/
|   |   |- API.md
|   |   |- panning.config.js
|   |   |- panning.controller.js
|   |   |- panning.dom.js
|   |   |- panning.init.js
|   |   `- panning.state.js
|   |- sectionMap/
|   |   |- API.md
|   |   |- sectionMap.controller.js
|   |   |- sectionMap.dom.js
|   |   |- sectionMap.engine.js
|   |   |- sectionMap.init.js
|   |   |- sectionMap.render.js
|   |   `- sectionMap.state.js
|   |- skillAccordion/
|   |   |- API.md
|   |   `- skillAccordion.init.js
|   `- skillTree/
|       |- API.md
|       |- skillTree.controller.js
|       |- skillTree.dom.js
|       |- skillTree.engine.js
|       |- skillTree.init.js
|       |- skillTree.render.js
|       `- skillTree.state.js
|- templates/
|   |- assets/
|   |- index.html
|   |- css/
|   |   `- styles.css
|   `- js/
|       `- main.js
|- vendor/
|   `- cobe/
|       |- cobe.create.js
|       |- cobe.init.js
|       |- cobe.phenomenon.js
|       |- cobe.shader.js
|       `- cobe.texture.js
|- API.md
|- CODE_OF_CONDUCT.md
|- CONTRIBUTING.md
|- LICENSE
`- README.md
```

---

## 3. General Principles

1. **Keep modules focused:** Export count is not the governing rule,
   file archetype is. Two archetypes exist in this codebase:

   - **Singleton files** (`init`, `state`, `controller`) -- export
     exactly one function. Their role is narrow by design.
   - **Collection files** (`dom`, `engine`, `render`) -- export as
     many functions as the module needs, one function per DOM operation,
     geometry computation, or render action.

   The real invariant is **one responsibility per function**. If a
   function has multiple responsibilities, split it. If a singleton
   file is growing, check whether some of its logic belongs in a
   `engine.js` or `render.js`.

2. **Consistent naming:** Name functions by their verb and responsibility.
   - `get` / `set` for DOM reads and writes
   - `compute` for pure math and geometry
   - `create` for factory functions
   - `init` for entry points
   - Singleton files (`init`, `state`, `controller`) always prefix
     exports with the module name; collection files (`dom`, `engine`,
     `render`) never do
   - Disambiguation belongs at the import site via ES6 `as` aliasing,
     not in function names
   - Avoid overly generic names in collection files regardless
     (prefer `bindEvent` over `bind`)

   Example: `initPanning()`, `createSkillTreeController()`

3. **Keep functions short:** Aim for functions to perform **a single 
   responsibility**. If a function has multiple responsibilities, split
   into smaller, atomic functions.

---

## 4. Code Style

- Prefer **ES6+ syntax**: `const`, `let`, arrow functions, `import/export`.
- Keep functions readable and properly indented.
- Add **meaningful comments** where necessary, but avoid cluttering
  obvious logic by proof-reading your comments.

---

## 5. Commit Guidelines

The current workflow is Pull Request based, with plans to migrate
to an email-driven patch workflow for full decentralization.

Commits follow the [Conventional Commits](https://conventionalcommits.org)
specification with the additions below. Key words are interpreted per
[RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

### Format

    <type>(<scope>): <description>

    [optional body]

    [optional footers]

### Types

| Type | When to use |
|---|---|
| `feat` | Adding a new feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes nor adds a feature |
| `style` | Whitespace, formatting, no logic change |
| `test` | Adding or updating tests |
| `build` | Changes affecting the build or data pipeline |
| `chore` | maintenance tasks not touching module source or docs |

For types not listed, contact admin@auraq.org before using them.

### Scope

Scope MUST be the name of the affected module or global file.

    docs(panning): clarify axis configuration
    refactor(sectionMap): extract scroll math to engine.js
    docs(api): add further planned features in root api.md

If a single logical change touches multiple scopes, split into separate
commits so each commit has its own scope -- even if they are committed
in immediate sequence.

### Breaking Changes

Indicate with `!` before `:` or as a footer:

    feat(panning)!: remove xy axis support

    BREAKING CHANGE: xy axis has been removed, use x or y explicitly

### Trailers

Use `Refs:` or `Closes:` to link commits to issues:

    Refs: #42
    Closes: #17

> [!NOTE]
> If a single logical change spans tightly coupled modules -- modules that
> share a DOM surface or where one is a direct enhancement layer of
> another -- commit them together. Splitting would leave the repository
> in a half-wired state between commits. Atomicity of the functional
> change takes precedence over single-scope in these cases. Name the
> scope after the primary module (the one introducing the change) and
> note the secondary module in the body.

---

## 6. Module Documentation

### Header Documentation

Every JS module must begin with a JSDoc header containing:

- `@file` -- file name
- An exports list directly below `@file` (purely project convention)
- `@description` -- purpose and high-level behavior
- `@module` -- logical module path (e.g. `sectionMap/engine`)
- `@author`
- `@license`

Example:

```javascript
/**
 * @file sectionMap.engine.js
 * Exports:
 *   - computeSectionNorms()
 *   - computeThumbPx()
 *   - normalizeScroll()
 *
 * @description Owns all scroll math, coordinate mapping, rAF loops,
 * and pure geometry functions for the sectionMap module.
 *
 * @module sectionMap/engine
 * @author KinuCyber
 * @license GPL-3.0
 */
```

### Function Documentation

All function comments must follow JSDoc syntax:

- A plain text description of the function's responsibility
- `@param {type} name - description` for each parameter
- `@returns {type} description` (where applicable)
- `@throws {type} description` (where applicable)

Example:

```javascript
/**
 * Approximates cubic-bezier(0.22, 1, 0.36, 1) from the design system.
 * @param {number} t - normalized time, 0 to 1
 * @returns {number} eased value between 0 and 1
 */
```

For details on JSDoc, see https://jsdoc.app/

---

## 7. Theming Documentation

Theming is a combination of CSS Custom Properties and Design Token
Hierarchy.

Read about CSS Custom Properties:
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties
- https://web.dev/learn/css/custom-properties
- https://css-tricks.com/css-custom-properties-theming/

Read about Design Token Hierarchy:
- https://piccalil.li/blog/how-were-approaching-theming-with-modern-css/
- https://dev.to/whoisryosuke/theming-in-modern-design-systems-2034

Further reading on CSS `@layer`:
- https://www.smashingmagazine.com/2022/01/introduction-css-cascade-layers/
- https://www.smashingmagazine.com/2025/09/integrating-css-cascade-layers-existing-project/
- https://ishadeed.com/article/cascade-layers/

Further reading on CSS `@property`:
- https://web.dev/blog/at-property-baseline
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@property
- https://moderncss.dev/providing-type-definitions-for-css-with-at-property/

Reference implementations:
- https://github.com/material-components/material-web/blob/mwc/docs/theming.md
- https://mui.com/material-ui/customization/css-layers/

Icons: https://fonts.google.com/icons

> Note: Theming is planned but not yet implemented.

---

## 8. API Reference Files

### 8.1 Module API.md

Every module ships one `API.md` in its own folder. The standard
structure is defined below. Conditional sections are marked -- include
them with a one-line absence note rather than omitting silently, unless
the section is categorically not applicable to the module's type (e.g.
"Generated DOM" for a pure behavior module that injects no elements).

---

#### Standard Header

The title of the file.
```
# <moduleName> Module - API Reference
```

#### One-sentence description

The very first paragraph of the file, right after first heading.
States what the module does in one sentence.

---

#### `> See also:`

Link to the API.md of any tightly coupled module -- one that shares a
DOM surface, scroll container, or must be initialized in a specific
order. Omit if the module is fully independent.

---

#### `## HTML Contract`

What the site must author for this module to function. This is the
module's contract with the consumer site. Subsections:

**Required HTML** -- minimal working example as an HTML code block.

**Of the following three tables, at least one is mandatory.**

**Element Discovery table** *(conditional -- include for modules that
                               scan for specific elements in the DOM)*

| Column | Description |
|---|---|
| Name | Human-readable element name |
| Selector | The actual CSS selector used to discover it |
| Required | Yes / No |
| Description | What the module does with it |

**Attribute Schema** *(conditional -- include for modules that read
                      `data-\*` attributes)*

| Column | Description |
|---|---|
| Name | Attribute name |
| Required | Yes / No |
| Values | String / Integer / etc. |
| Description | Meaning and constraints |

**Content Mapping** *(conditional -- include for modules that read
                      element text content)*

| Source | Used by |
|---|---|
| e.g. `<summary>` text content | Popup header |

**Required Site CSS** *(conditional -- include when the module requires
specific CSS to be present on the site)*
Code block with the required rules, followed by a brief explanation of
why each rule is necessary.

**Corner Cases** *(conditional -- include whenever meaningful)*
List every meaningful edge case. Document what the module does, not
what the site should do. Examples: duplicate attribute values, missing
optional elements, invalid types.

---

#### `## No-JS Behavior`

One to three sentences. What the HTML renders when JS is disabled.
Never omit this section and never write "N/A" -- every module has a
no-JS state, even if it is "nothing renders and the HTML is inert."

---

#### `## <Primary Behavior Section(s)>`

Name and count vary by module. Documents how module works at runtime.
Use a table when the behavior is a matrix of states or inputs; use prose
and numbered lists for sequential logic.

Examples from existing modules:
- **Navigation Behavior** (sectionMap) -- Gesture / Mode / Behavior table
- **Animation** (skillAccordion) -- open/close sequences, interrupt
  handling, constants
- **Two-Renderer Model** (skillTree) -- state table with Accordion / Tree
  column per state

**Internal constants** must be documented per-function or per-section,
not in a separate section. Include value, unit, and behavioral effect:

```javascript
const LERP_FACTOR = 0.14; // 14% of remaining distance per frame (~300ms settle at 60fps)
```

---

#### `## Exports`

One subsection (`###`) per JS file in the module. List files in the same
order as the import graph. Each exported function must document:

- **Parameter table** (`Parameter | Type | Description`) for functions
  with two or more parameters
- **Returns** for functions that return a non-void value
- **Side effects** list for functions with observable side effects beyond
  their return value
- **ARIA attributes** table for functions that set accessibility attributes

Do not document module-internal helpers unless they are exported for
cross-module use.

---

#### `## CSS Custom Properties` *(conditional)*

For UI modules that inject CSS via `injectStyles()` or equivalent.
List every custom property the module exposes. Three-column table:

| Property | Default | Controls |
|---|---|---|

Default must show the full fallback chain:
`var(--component-token, var(--semantic-token, hardcoded-value))`.

---

#### `## CSS Shipped by Auraq` *(conditional)*

For behavior modules that inject no CSS. One line stating "None" and the
reason. Do not omit this section silently -- the absence is intentional
and should be recorded.

Example:
> None. For behavior-only modules. This module ships no CSS.
> All visual treatment is the site's responsibility.

---

#### `## Generated DOM` *(conditional)*

For modules that create and inject elements into the page. List every
element Auraq generates. Two-column table:

| Element | Description |
|---|---|

The site must not author these elements directly.

---

#### `## Module Architecture`

Required for multi-file modules. Single-file modules include this
section with a one-line note ("Single-file module -- no import graph.").

File list with one-line role per file:

```
<module>.init.js        <-  composition root -- discovery and wiring
<module>.controller.js  <-  event handling and state coordination
<module>.dom.js         <-  all DOM reads and writes
<module>.state.js       <-  state factory
<module>.engine.js      <-  pure math and geometry, no DOM access
<module>.render.js      <-  DOM creation and visual updates
```

Followed by an ASCII import graph showing one-directional dependencies:

```
init.js -> dom.js
init.js -> controller.js -> engine.js -> dom.js
                         -> dom.js
```

---

#### `## Relationship to <ModuleName>` *(conditional)*

When two modules share a DOM surface, coordinate scroll ownership, or
require a specific initialization order in `main.js`, document the
relationship explicitly. Cover:

- What each module owns
- Yielding logic (which module yields to which and when)
- Cross-module cancellation API, if one exists (with code example)
- Any ordering constraint for `main.js`

---

### 8.2 Root API.md

Index of all modules. Updated whenever a module is added, removed, or
promoted from Planned to Live.

Per module entry:
- Path under `modules/` or `vendor/`
- CDN import URL
- Link to the module's own `API.md`
- Export table: `Export | File | Description`

Only list exports a consumer or sibling module would import. Do not list
module-internal files (e.g. `panning.config.js`).

Planned modules table: `Module | Status` with values `Live` or `Planned`
Update status to `Live` as part of the commit that ships the module --
never leave a shipped module in the Planned table.

---

### 8.3 design.md (pre-implementation)

A planned module may have a `design.md` in its module folder before
implementation begins. This is an informal design spec -- it may be
as brief as a list of data attributes or as detailed as a full behavior
description. No required format.

**Lifecycle:**

1. Created when the module is planned and its intended behavior is
   sufficiently clear to write down.
2. Lives in the module folder alongside any in-progress implementation.
3. **Deleted when the module ships.** The commit that deletes it must
   state explicitly in its message that `design.md` is being deleted and
   superseded by `API.md`. This makes it easily findable in git log.
   Commit history is the archive -- no separate archiving is needed.

Do not delete `design.md` before the module ships.
Do not keep `design.md` after the module ships.

---

## 9. Adding Features

Before adding a new feature, review the root `API.md` to understand the
existing module landscape and determine the right approach.

---

### Extend an existing module

If all of the following are true, add the function to an existing module:

- The feature's responsibility clearly belongs to an existing module.
- The target file stays within the archetype's expected scope.
  - See section 3 for details on archetype's scope.
- The feature shares the module's
  - existing state
  - DOM surface
  - lifecycle

**Steps:**

1. Add the function to the correct module file.
2. Document it with a JSDoc block -- description, `@param`, `@returns`,
   `@throws` where applicable.
3. Update the exports list in the file header.
4. Update the module's `API.md`.
5. Update the root `API.md`.

---

### Create a new module

If any of the following are true, a new module is likely the right call:

- The feature has a distinct responsibility that doesn't belong to any
  existing module
- Adding it would push a singleton file beyond its single responsibility
- It requires its own state, DOM surface, or lifecycle
- It could conceivably be used independently by a consumer site

**Steps:**

1. Create a folder under `modules/<moduleName>/` with the files the
   module warrants. Not every module needs all five standard files,
   a purely computational module may not need `dom.js` or `state.js`,
   complex UI module may need a separate `render.js` and `engine.js`.

   ```
   modules/<moduleName>/
   |- <moduleName>.init.js    : the main entry points + routing logic
   |- <moduleName>.controller.js: if event handling is needed
   |- <moduleName>.dom.js     : if DOM access is needed
   |- <moduleName>.state.js   : if stateful
   |- <moduleName>.engine.js  : if pure math is needed
   |- <moduleName>.render.js  : if DOM creation is separate from updates
   `- API.md
   ```

2. Write a JSDoc header in each new file:

```javascript
/**
 * @file <moduleName>.dom.js
 * Exports:
 *   - functionOne()
 *   - functionTwo()
 *
 * @description Owns all DOM reads and writes for the <moduleName> module
 * @module <moduleName>/dom
 * @author <author>
 * @license GPL-3.0
 */
```

3. Document every exported function with a JSDoc block.

4. Create the module's `API.md` following the standard in Section 8.1.
   Use an existing module's `API.md` as a reference - SkillAccordion and
   SkillTree are the most complete current examples.

5. Update the root `API.md` module index and promote the module to
   `Live` in the Planned table on ship.

6. Update the repository structure in `README.md`.

7. If a `design.md` existed for this module, delete it per the lifecycle
   in Section 8.3 -- note the deletion explicitly in the commit message.

---

## 10. Navigation and Discoverability (for vim users)

1. **Use `ctags` for fast navigation:**

   ```bash
   ctags -R .
   ```

   Jump to function definitions:

   ```
   :tag functionName
   ```

2. **Vim search patterns:** Use consistent function prefixes for quick searches:

   ```vim
   :vimgrep /initPanning/ **/*.js
   ```

3. **Avoid scattering logic unnecessarily:** Keep related modules logically
   grouped in folders (`panning/panning.init.js`, `panning/panning.dom.js`).

---

## 11. Testing

- Test each module independently before integrating with other modules.
- Verify cross-browser behavior, especially for scroll and drag
  interactions (Chrome, Firefox, Safari).
- Ensure animation & transition feel smooth (momentum, elasticity, etc).

> Note: Formal test infrastructure is not yet implemented.

---

## 12. Summary

- **Document everything** -- module headers, function docs, API.md
- **Use consistent names** for discoverability
- **Keep modules small and focused**
- **Update documentation with every change**
- **GitHub repository is the temporary canonical repository**

For any inquiries: **admin@auraq.org**
© 2026 Auraq Project
