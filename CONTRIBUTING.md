# Contributing to Auraq Core

Thank you for your interest in contributing! This guide outlines how to organize, document, and extend the codebase efficiently so that modularity does not compromise discoverability and maintainability.

## 1. Repository Canonicality

The canonical source of truth for this repository is GitHub:
- https://github.com/AuraqLabs/auraq-core

Two mirrors are maintained at: 
- https://kinu.tngl.sh/auraq-core
- https://sr.ht/kinucyber/auraq-core

The mirrors are kept in sync automatically.
Do not push directly to the mirror - all contributions should target the GitHub remote.

## 2. General Principles

1. **Keep modules focused:** Each module file should ideally export **3-5 functions**.
   - If a module file grows beyond this, split it into smaller, logically coherent files.

2. **Use consistent naming:** Name functions by their verb and responsibility
   - `get`/`set` for DOM reads and writes
   - `compute` for pure math
   - `create` for factory functions
   - `init` for entry points
   - Module-prefix only public entry points where disambiguation across modules is needed.

   - Example: `initPanning()`

3. **Keep functions short:** Aim for functions to perform **a single responsibility**. This makes modules easier to understand, test, and reuse.
   - If a function has multiple responsibilities, split into smaller, atomic functions

## 3. Module Documentation

### **Header Comments**

Every JS module should begin with a header comment as per JSDocs spec (@) containing following
- `@file`
- Exported Functions (manually, not part of JSDocs specs)
- `@description`: Purpose and high-level behavior
- `@module`
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
 *   ...

 * @description Owns all scroll math, coordinate mapping, rAF loops,
 * and pure geometry functions for the sectionMap module.
 *
 * @module sectionMap/engine
 * @auther KinuCyber
 * @license GPL-3.0
 */
```
---
### **Function Documentation**

All function documentation must follow JSDoc syntax, containing the following
.
- Description: Resonsibility/Purpose
- `@param`
- `@returns` (where applicable)
- `@throws` (where applicable)

Example:

```javascript
/**
 * Approximates cubic-bezier(0.22, 1, 0.36, 1) from the design system.
 * @param {number} t — 0 to 1
 * @returns {number}
 */
```

For details on JSDoc, see https://jsdoc.app/

## 4. API Reference File

Maintain a single **API reference file** per module in respective module directory.

This file should list all the features of the module.
Update this file whenever you add, remove or modify a function from corresponding module

This file contains the following
- `Usage`
- `Configuration`
- `CSS Requirements`
- `Module Architecture`
- `<module>.<role>.js`
    - `Exported function`
    - `Exported function`
    - ...
- ...

### Another file exists under repo root (`API.md`)

* This file should list **all modules**, their **exported functions**, **parameters**, **return values**, and **example usage**.
* Update this file **whenever you add, remove, or modify a module**.

The format for this documentation is yet to be determined

## 5. Navigation and Discoverability (for vim users)

1. **Use `ctags` for fast navigation in Vim:**

   ```bash
   ctags -R .
   ```

   * Jump to function definitions using:

     ```
     :tag functionName
     ```

2. **Vim search patterns:** Use consistent function prefixes for quick searches:

   ```vim
   :vimgrep /initPanning/ **/*.js
   ```

3. **Avoid scattering logic unnecessarily:** Keep related modules logically grouped in folders (`panning/panning.init.js`, `panning/panning.dom.js`, etc).

## 6. Adding Features

Before adding a new feature, **review the root API.md** to understand
the existing module landscape and determine the right approach.

In some cases, you'd want to extend an existing module whereas in other you'd want to create an entirely new module.

---

### When to extend an existing module

If all of the following are true, add the function to an existing module:

- The feature's responsibility clearly belongs to an existing module
- The target file stays within the 3-5 exported functions guideline
- The feature shares the module's existing state, DOM surface, and lifecycle

**If a new function is required:**

1. Add it to the correct module file
2. Document it with a JSDoc block - description, `@param`, `@returns`,
   and `@throws` where applicable
3. Update the exports list in the file header
4. Update the module's `API.md`
5. Update the root `API.md`

---

### When to create a new module

If any of the following are true, a new module is likely the right call:

- The feature has a distinct responsibility that doesn't belong to any
  existing module
- Adding it would push an existing module's file beyond the 3-5 exported
  functions guideline
- It requires its own state, DOM surface, or lifecycle that would feel
  foreign inside an existing module
- It could conceivably be used independently by a consumer site

**If a new module is required:**

1. Create a folder under `modules/<moduleName>/` following the established
   file structure:
   ```
   modules/<moduleName>/
   |- <moduleName>.init.js
   |- <moduleName>.controller.js
   |- <moduleName>.dom.js
   |- <moduleName>.state.js
   |- API.md
   ```
   Add or remove files as the module warrants - not every module needs
   all five. For example, a purely computational module may not need a
   `dom.js` or `state.js`. Alternatively, some modules may need separate `render.js` or `engine.js`.

2. Write a JSDoc file header in each new file using `@file`, `@module` and `description`:
   ```javascript
   /**
    * @file <moduleName>.dom.js
    * Exports:
    *   - functionOne()
    *   - functionTwo()
    * @description Owns all DOM reads and writes for the <moduleName> module.
    * @module <moduleName>/dom
    * @author <author>
    * @license GPL-3.0
    */
   ```

3. Document every exported function with a JSDoc block
   `@description`, `@param`, `@returns`, and `@throws` where applicable

4. Create the module's `API.md` following the structure of an existing
   module's API.md as a reference

5. Update the root `API.md` module index

6. Update the repository structure section in `README.md`

7. Test the module independently before integrating with other modules

---

> When in doubt, prefer a focused new module over bloating an existing one. Modularity is cheaper to maintain than untangling a module that has grown beyond its original responsibility.


## 7. Code Style

* Prefer **ES6+ syntax**: `const`, `let`, arrow functions, `import/export` modules.
* Keep functions readable and properly indented.
* Add **meaningful comments** where necessary, but avoid cluttering obvious logic.

## 8. File & Folder Structure

### This Repository
auraq-core/
├─ modules/     # Reusable modules (drag-scroll, navigation, etc.)
│   ├─ panning/
│   │   ├─ API.md
│   │   ├─ panning.controller.js
│   │   ├─ panning.dom.js
│   │   ├─ panning.init.js
│   │   └─ panning.state.js
│   └─ utils/  # Reserved for future shared utilities
├─ vendor/     # Third Party Modules (locally built)
│   └─ cobe/
│       ├─ cobe.create.js
│       ├─ cobe.init.js
│       ├─ cobe.phenomenon.js
│       ├─ cobe.shader.js
│       └─ cobe.texture.js
├─ templates/   # Base HTML/CSS/JS template for any new portfolio site
│   ├─ assets/
│   ├─ index.html
│   ├─ css/
│   │   └─styles.css
│   └─ js/
│       └─main.js
├─ API.md
├─ CODE_OF_CONDUCT.md
├─ CONTRIBUTING.md
├─ LICENSE
├─ further-reading/
│   └─ resources.md
└─ README.md

## 9. Testing

* Test **each module independently** before integrating with other modules.
* Verify **cross-browser behavior**, especially for scroll/drag interactions (Chrome, Firefox, Safari).
* Ensure **momentum/elasticity** feel is smooth.

## 10. Summary

* **Document everything** (module headers, function docs, API.md)
* **Use consistent names** for discoverability
* **Keep modules small and focused**
* **Update documentation with every change**
* **GitHub repository is the canonical repository**

For any inquiries: **admin@auraq.org**
© 2026 Auraq Project 
