# Auraq Core

**Auraq Core** is a modular frontend templating system. It provides the UI/UX and interaction layer for all of my static portfolio sites. Unique features include direct-manipulation scrolling with momentum, horizontal navigation systems, and a `<noscript>` fallback so sites remain functional even when JavaScript is disabled.

Modules are served via CDN and imported directly by consumer sites — no build step, no submodules.

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
9. [License](#license)

---

## Overview

Auraq provides a clean, reusable foundation for static web projects with the following goals:

- Fully modular architecture — each feature is an independently importable module
- Consistent UI/UX behavior across multiple consumer sites
- Lightweight, ES6-native JavaScript with no bundler required
- Deployed via Cloudflare Pages, served from `cdn.kinu3d.com`
- `templates/` serves as a one-time boilerplate — it does not update when Auraq modules change

---

## Features

- **Panning** — Smooth pointer-based panning with momentum, configurable axis, and nested container support
- **Navigation** *(planned)* — Modular vertical or horizontal nav bars with active indicators
- **Carousel** *(planned)* — Flexible card carousel module
- **Centralized Documentation** — Each module ships with its own `API.md`
- **JavaScript Disabled Fallback** — Core content remains accessible without JS

---

## Repository Structure

```
Auraq/
├─ modules/                        # Shared reusable modules
│   ├─ panning/
│   │   ├─ panning.init.js         # Composition root - Discovery & Wiring
│   │   ├─ panning.controller.js   # Pointer Event Logic and Engine
│   │   ├─ panning.dom.js          # DOM reads/writes and Pointer Capture
│   │   ├─ panning.state.js        # State Factory
│   │   └─ API.md
│   └─ utils/
│       └─ dom.js                  # Shared DOM Helpers ($, $$)
├─ templates/                      # One-time Boilerplate
│   ├─ index.html
│   ├─ css/
│   │   └─ styles.css
│   └─ js/
│       └─ main.js
├─ API.md                          # Global API overview and module index
├─ CONTRIBUTING.md
├─ CODE_OF_CONDUCT.md
└─ README.md
```

---

## Installation

Auraq modules are served from `cdn.kinu3d.com`. Import them directly in your JavaScript — no cloning, no package manager.

```javascript
import { initPanning } from 'https://cdn.kinu3d.com/modules/panning/panning.init.js';
```

To pin to a stable release instead of `main`, use a version branch URL:

```javascript
import { initPanning } from 'https://v1.auraq.pages.dev/modules/panning/panning.init.js';
```

> **Note:** Imports from `cdn.kinu3d.com` (the `main` branch) will always reflect the latest release. Use a version branch URL for production sites where stability matters.

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
import { initPanning } from 'https://cdn.kinu3d.com/modules/panning/panning.init.js';

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
| `main`  | `cdn.kinu3d.com`             | Latest stable release          |
| `v1`    | `v1.auraq.pages.dev`         | Frozen v1 release              |
| `dev`   | `dev.auraq.pages.dev`        | Work in progress — do not import |

Version branches are **write-once** — once cut from a stable `main`, they are never committed to again. Breaking changes to `main` propagate immediately to any site importing from `cdn.kinu3d.com`.

---

## API Documentation

- Global overview: [API.md](./API.md)
- Panning module: [modules/panning/API.md](./modules/panning/API.md)

---

## Contribution Guidelines

- Follow modular ES6 structure — each module is self-contained
- Document every exported function with parameters, return types, and a usage example
- Update the module's `API.md` whenever its public interface changes
- Use descriptive commits
- All features must work across Chrome, Firefox, and Safari
- Do not commit directly to `main` — develop on `dev` and merge when stable

> See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for detailed guidelines.

---

## License

GPL-3.0 License © 2026 Auraq Project
