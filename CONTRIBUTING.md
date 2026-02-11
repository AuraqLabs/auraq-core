---
````markdown
# Contributing to [Your Project Name]

Thank you for your interest in contributing! This guide outlines how to organize, document, and extend the codebase efficiently so that modularity does not compromise discoverability and maintainability.

---

## 1. General Principles

1. **Keep modules focused:** Each module should ideally export **3–5 functions**.  
   - If a module grows beyond this, split it into smaller, logically coherent modules.

2. **Use consistent naming:** Prefix function names by module or type for clarity.  
   Example:
```javascript
   dragScroll_init()
   wheelScroll_init()
   navScroll_scrollToModal()
```

3. **Keep functions short:** Aim for functions to perform **a single responsibility**. This makes modules easier to understand, test, and reuse.

---

## 2. Module Documentation

### **Header Comments**

Every JS module should begin with a header comment summarizing its purpose, exports, and high-level behavior.

Example:

```javascript
/**
 * dragScroll.js
 * Exports:
 *   - initDragScroll(container: HTMLElement): void
 * Handles drag + momentum scrolling for vertical containers.
 */
```

### **Function Documentation**

Each function should include a brief description, its parameters, return values, and side effects if any.

Example:

```javascript
/**
 * initDragScroll(container)
 * Initializes drag and momentum scrolling on the given container.
 *
 * @param {HTMLElement} container - The scrollable container element.
 * @returns {void}
 */
function initDragScroll(container) {
    ...
}
```

---

## 3. API Reference File

Maintain a single **API reference file** (`API.md`) at the root of the `js/` directory.

* This file should list **all modules**, their **exported functions**, **parameters**, **return values**, and **example usage**.
* Update this file **whenever you add, remove, or modify a function**.

Example:

````markdown
# JS Modules API

## dragScroll.js
- `initDragScroll(container: HTMLElement): void`
  - Initializes drag + momentum scroll on the container
  - Usage:
    ```javascript
    const modal = document.getElementById("modalContainer");
    initDragScroll(modal);
    ```

## wheelScroll.js
- `initWheelScroll(container: HTMLElement, options?: {velocityMultiplier?: number}): void`
  - Adds normalized wheel scrolling to container
````

---

## 4. Navigation and Discoverability

1. **Use `ctags` for fast navigation in Vim:**

   ```bash
   ctags -R js/
   ```

   * Jump to function definitions using:

     ```
     :tag functionName
     ```

2. **Vim search patterns:** Use consistent function prefixes for quick searches:

   ```vim
   :vimgrep /scrollToModal/ **/*.js
   ```

3. **Avoid scattering logic unnecessarily:** Keep related modules logically grouped in folders (`js/dragScroll.js`, `js/wheelScroll.js`, etc.).

---

## 5. Adding Features

1. Before adding a new feature, **review the API.md file** to see if an existing function can be extended instead of creating a new one.
2. If a new function is required:

   * Add it to the correct module
   * Update the **module header comments**
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
shabaka/
├─ modules/     # Reusable modules (drag-scroll, navigation, etc.)
│   ├─ dragScroll/
│   │   ├─ vertical.js
│   │   └─ horizontal.js
│   ├─ carousel/
│   │   └─ carousel.js
│   ├─ nav/
│   │   └─ nav.js
│   └─ utils/
│       └─ helpers.js
├─ templates/   # Base HTML/CSS/JS template for any new portfolio site
│   ├─ index.html
│   ├─ styles.css
│   └─ main.js
├─ API.md
└─ README.md

### Child repositories (not submodules)
shabaka-kinu-cyber/
├─ index.html
├─ css/
│   └─ styles.css
├─ js/
│   ├─ main.js  # Site-specific logic
│   └─ modules/ # Imported from Shabaka main repo (via submodule or copy)
├─ assets/
│   ├─ icons/
│   ├─ images/
│   └─ fonts/
├─ API.md
├─ README.md
└─ .gitmodules  # If using Git submodules to pull Shabaka modules

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
* **Use Vim-friendly navigation** with ctags and search patterns
* **Update documentation with every change**
