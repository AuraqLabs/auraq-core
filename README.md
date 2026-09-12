# Auraq Core

**Auraq Core** is a modular frontend templating system. It provides the UI/UX and interaction layer for all of my static portfolio sites. Unique features include direct-manipulation scrolling with momentum, horizontal navigation systems, and a `[data-js]` progressive enhancement model -- no-JS is the base rendering layer, not a fallback.

Modules are served via CDN and imported directly by consumer sites during build.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Repository Structure](#repository-structure)
4. [Installation](#installation)
5. [Usage](#usage)
6. [Versioning](#versioning)
7. [API Documentation](#api-documentation)
8. [Contribution Guidelines](#contribution-guidelines)
9. [Contact](#contact)
10.[License](#license)

---

## Overview

Auraq provides a clean, reusable foundation for static web projects with the following goals:

- Fully modular architecture -- each feature is an independently importable module
- Consistent UI/UX behavior across multiple consumer sites
- Lightweight, ES6-native JavaScript with no bundler required
- Deployed via Cloudflare Pages, served from `cdn.auraq.org`
- `templates/` serves as a one-time boilerplate -- it does not update when Auraq modules change

---

## Features

- **Panning** -- Smooth pointer-based panning with momentum, configurable axis, and nested container support
- **Section Map** -- Modular bar at bottom of page, acting as a map of sections
- **Skill Accordion** -- List-based nodes of courses and projects.
- **Skill Tree** -- Graph-based nodes of courses and projects.
- **Minimal Build**: Data injection from auraq-hive and auraq-core as the only build step
- **Centralized Data**: All sites' dynamic data (courses, projects, blogs, etc) are stored on auraq-hive
- **Documentation** -- Each module ships with its own `API.md`
- **Progressive Enhancement** -- No-JS is the base rendering layer. An inline gate script sets `data-js` on the document root when JS is available; all JS-dependent behaviour and CSS is scoped behind `[data-js]` selectors. Sites are fully structural without JS -- JavaScript enhances on top.

---

## Repository Structure

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
|   |
|   |- sectionMap/
|   |   |- API.md
|   |   |- sectionMap.controller.js
|   |   |- sectionMap.dom.js
|   |   |- sectionMap.engine.js
|   |   |- sectionMap.init.js
|   |   |- sectionMap.render.js
|   |   `- sectionMap.state.js
|   |
|   |- skillAccordion/
|   |   |- API.md
|   |   `- skillAccordion.init.js
|   |
|   `- skillTree/
|       |- API.md
|       |- skillTree.controller.js
|       |- skillTree.dom.js
|       |- skillTree.engine.js
|       |- skillTree.init.js
|       |- skillTree.render.js
|       `- skillTree.state.js
|
|- templates/
|   |- assets/
|   |- index.html
|   |- css/
|   |   `- styles.css
|   `- js/
|       `- main.js
|
|- vendor/
|   |- cobe/
|   |   |- API.md
|   |   |- cobe.create.js
|   |   |- cobe.init.js
|   |   |- cobe.phenomenon.js
|   |   |- cobe.shader.js
|   |   `- cobe.texture.js
|   |
|   `- cobev2/
|       |- API.md
|       |- cobe.anchor.js
|       |- cobe.create.js
|       |- cobe.init.js
|       |- cobe.shader.js
|       |- cobe.texture.js
|       `- cobe.webgl.js
|
|- API.md
|- CODE_OF_CONDUCT.md
|- CONTRIBUTING.md
|- LICENSE
`- README.md
```

---

## Installation

### Prerequisite: `[data-js]` gate

Before importing any Auraq module, the `[data-js]` progressive enhancement gate must be present in your HTML. Copy the inline gate script from `templates/index.html` into the `<head>` of your page - it must execute before any module initialises.

The gate sets `data-js` on the document root when JS is available. CSS rules that modules depend on (such as the `overflow-x` constraints required by panning) are gated behind `[data-js]` so they do not apply when JS is off and the module is not running. Without the gate script, `data-js` is never set under any conditions: those rules never activate, and modules will run against the wrong CSS baseline.

### Importing modules

Auraq modules are served from `cdn.auraq.org`. Import them directly in your JavaScript -- no cloning, no package manager.

```javascript
import { initPanning } from 'https://cdn.auraq.org/modules/panning/panning.init.js';
```

To pin to a stable release instead of `main`, use a version branch URL:

```javascript
import { initPanning } from 'https://v1.auraq.org/modules/panning/panning.init.js';
```

> **Note:** Imports from `cdn.auraq.org` (the `main` branch) will always reflect the latest release. Use a version branch URL for production sites where stability matters.

---

## Usage

### Panning

Add `data-panning-axis` to any scrollable container in your HTML and call `initPanning()` on load:

```html
<!-- Vertical panning -->
<div class="scrollContainer" data-panning-axis="y"> ... </div>

<!-- Horizontal panning (nested) -->
<div class="scrollContainer" data-panning-axis="x"> ... </div>
```

```javascript
import { initPanning } from 'https://cdn.auraq.org/modules/panning/panning.init.js';

document.addEventListener('DOMContentLoaded', () => {
  initPanning();
});
```

`initPanning()` automatically discovers all `[data-panning-axis]` elements on the page, reads their axis value, and binds the appropriate pointer event handlers. No manual container references needed.

> See `modules/panning/API.md` for the full function reference, axis options, and nested container behaviour.

---

## Versioning

Auraq uses **Cloudflare Pages branch deployments** for versioning:

| Branch  | URL                          | Purpose                        |
|---------|------------------------------|--------------------------------|
| `main`  | `cdn.auraq.org`              | Latest stable release          |
| `v1`    | `v1.auraq.org`               | Frozen v1 release              |
| `dev`   | `dev.auraq.org`              | WIP -- do not import            |

Version branches are **write-once** -- once cut from a stable `main`, they are never committed to again. Breaking changes to `main` propagate immediately to any site importing from `cdn.auraq.org`.

---

## API Documentation

- Global overview: [API.md](./API.md)
- Panning module: [modules/panning/API.md](./modules/panning/API.md)

---

## Contribution Guidelines

- Follow modular ES6 structure -- each module is self-contained
- Document every exported function with parameters, return types, and a usage example
- Update the module's `API.md` whenever its public interface changes
- Use descriptive commits
- All features must work across Chrome, Firefox, and Safari
- Do not commit directly to `main` -- develop on `dev` and merge when stable

> See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for detailed guidelines.

---

## Contact

For any inquiries: contact@auraq.org

## License

GPL-3.0 License © 2026 Auraq Project
