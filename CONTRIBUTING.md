````markdown
# Contributing to Auraq Core

Thank you for your interest in contributing! This guide outlines how to organize, document, and extend the codebase efficiently so that modularity does not compromise discoverability and maintainability.

---

## 1. General Principles

1. **Keep modules focused:** Each module should ideally export **3–5 functions**.  
   - If a module grows beyond this, split it into smaller, logically coherent modules.

2. **Use consistent naming:** Prefix/suffix function names by module or type for clarity.  
   Example:
```javascript
   initPanning()
```

3. **Keep functions short:** Aim for functions to perform **a single responsibility**. This makes modules easier to understand, test, and reuse.

---

## 2. Module Documentation

### **Header Comments**

Every JS module should begin with a header comment summarizing its purpose, exports, and high-level behavior.

Example:

```javascript
/**
 * panning.init.js
 * Exports:
 *   - initPanning(): void
 * Handles drag + momentum scrolling for div with 'data-panning-axis="xy"' attributes.
 */
```

### **Function Documentation**

Each function should include a brief description, its parameters, return values, and side effects if any.

Example:

```javascript
/**
 * initPanning()
 * Queries all divs with 'data-panning-axis="xy"' attribute
 * Initializes drag and momentum scrolling on the given divs.
 * Returns void
 */
function initPanning() {
    ...
}
```

---

## 3. API Reference File

Maintain a single **API reference file** (`API.md`) at the repo root.

* This file should list **all modules**, their **exported functions**, **parameters**, **return values**, and **example usage**.
* Update this file **whenever you add, remove, or modify a function**.

Example:

````markdown
# JS Modules API

## panning.init.js
- `initPanning(): void`
  - Queries DOM for divs with `data-panning-axis=""` attributes
  - Initializes drag + momentum scroll on the panning divs
  - Usage:
    ```html
    <div data-panning-axis="xy">
    ```
    ```javascript
    import { initPanning } from 'https://cdn.auraq.org/modules/panning/panning.init.js';
    initPanning();
    ```
````

Another file exists under each module folder.

* This file should list all the features of the module.
* Update this file whenever you add, remove or modify a function from corresponding module

---

## 4. Navigation and Discoverability (for vim users)

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

---

## 5. Adding Features

1. Before adding a new feature, **review the API.md file** to see if an existing function can be extended instead of creating a new one.
2. If a new function is required:

   * Add it to the correct module
   * Update the **module header comments**
   * Update the module's API.md
   * Update **API.md**
3. Test your changes in isolation before integrating with other modules.

---

## 6. Code Style

* Prefer **ES6+ syntax**: `const`, `let`, arrow functions, `import/export` modules.
* Keep functions readable and properly indented.
* Add **meaningful comments** where necessary, but avoid cluttering obvious logic.

---

## 7. File & Folder Structure

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

---

## 8. Testing

* Test **each module independently** before integrating with other modules.
* Verify **cross-browser behavior**, especially for scroll/drag interactions (Chrome, Firefox, Safari).
* Ensure **momentum/elasticity** feel is smooth.

---

## 9. Summary

* **Document everything** (module headers, function docs, API.md)
* **Use consistent names** for discoverability
* **Keep modules small and focused**
* **Update documentation with every change**
