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

> [!CAUTION]
> Sourcehut (sr.ht) will become the canonical source of truth in near future
>
> **DO NOT FILE ISSUES ON GITHUB!**
> Contact **admin@auraq.org** for any issues

## 2. File & Folder Structure

```
auraq-core/
|- data/        # Reusable data
|   `- courses.json
|- further-reading/
|   `- resources.md # For inspirations
|- modules/     # Reusable modules
|   |- panning/
|   |   |- API.md
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
|   |- skillTree/
|   |   |- API.md
|   |   |- skillTree.controller.js
|   |   |- skillTree.dom.js
|   |   |- skillTree.engine.js
|   |   |- skillTree.init.js
|   |   |- skillTree.render.js
|   |   `- skillTree.state.js
|   `- utils/  # Reserved for future shared utilities
|- templates/   # Base HTML/CSS/JS template for any new portfolio site
|   |- assets/
|   |- index.html
|   |- css/
|   |   `-styles.css
|   `- js/
|       `-main.js
|- vendor/     # Third Party Modules (locally built)
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

## 3. General Principles

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

## 4. Code Style

- Prefer **ES6+ syntax**: `const`, `let`, arrow functions, `import/export` modules.
- Keep functions readable and properly indented.
- Add **meaningful comments** where necessary, but avoid cluttering obvious logic.

## 5. Commit Guidelines

The commit workflow is currently Pull Request based, but planed to be email-driven, patch-based commit workflow to achieve pure decentralization

Until then, follow [Conventional Commit](https://conventionalcommits.org) guidelines:-

-# The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

> Commits MUST be prefixed with a type, which consists of following
> - build
> - docs
> - feat
> - fix
> - refactor
> - style
> - test
> 
> followed by the OPTIONAL scope, OPTIONAL `!`, and REQUIRED terminal colon `:` and a space.
>
> Example: `docs(readme): <whateva>`

> The type `build` MUST be used when changes affect build step (such
> as data directory or data-injector.js)

> The type `docs` MUST be used for documentation only (including API)

> The type `feat` MUST be used when a commit adds a new feature to your
> application or library.

> The type `fix` MUST be used when a commit represents a bug fix for
> your application.

> The type `refactor` MUST be used when a code change that neither
> fixes a bug nor adds a feature

> The type `style` MUST be used when changes that do not affect the
> meaning of the code (white-space, format, missing semi-colons, etc)

> The type `test`  MUST be used when a test has been set up of any kind

> A scope MAY be provided after a type. A scope MUST consist of the
> name of the module or global file affected
>
> Example: `refactor(panning): <whateva>`, `docs(panning): <whateva>`

> A description MUST immediately follow the colon and space after the
> type/scope prefix. The description is a short summary of the code
>.changes
> 
> Example: `refactor(panning): Introduce engine.js to contain math"

> A longer commit body MAY be provided after the short description,
> providing additional contextual information about the code changes.
> The body MUST begin one blank line after the description.

> A commit body is free-form and MAY consist of any number of
> newline separated paragraphs.

> One or more footers MAY be provided one blank line after the body.
> Each footer MUST consist of a word token, followed by either
> a `:<space>` or `<space>#` separator, followed by a string value
> (this is inspired by the git trailer convention).
>
> Example: `Refs: #123456`

> A footer's token MUST use - in place of whitespace characters
> This helps differentiate the footer section from a multi-paragraph
> body). An exception is made for `BREAKING CHANGE`,
> which MAY also be used as a token.
> 
> Example: `Acked-by: <name@address>`

> A footer's value MAY contain spaces and newlines, and parsing
> MUST terminate when the next valid footer token/separator
> pair is observed.

> Breaking changes MUST be indicated in the type/scope prefix
> of a commit, or as an entry in the footer.

> If included as a footer, a breaking change MUST consist of the
> uppercase text BREAKING CHANGE, followed by a colon, space, and
> description
>
> Example: `BREAKING CHANGE: env now take sprecedence over config`

> If included in the type/scope prefix, breaking changes MUST be
> indicated by a `!` immediately before the `:`
> If `!` is used, `BREAKING CHANGE: ` MAY be omitted from the footer
> section, and the commit description SHALL be used to describe the
> breaking change.

> Types other than prescribed may be used upon approval from
> admin@auraq.org

> The units of information that make up Conventional Commits MUST NOT
> be treated as case-sensitive by implementors, with the exception of
> BREAKING CHANGE which MUST be uppercase.

> BREAKING-CHANGE MUST be synonymous with BREAKING CHANGE, when used
> as a token in a footer.

## 6. Module Documentation

### **Header Documentation**

Every JS module should begin with a header comment as per JSDocs spec (@) containing following
- `@file` - file name
- `@description` - purpose and high-level behavior
- `@module` - logical module path, not the full file path
(e.g. `sectionMap/engine`)
- `@author`
- `@license`
- Additionally, include a manually maintained exports list directly
  below `@file`. This is a project convention, not part of the JSDoc spec:
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
 * @author KinuCyber
 * @license GPL-3.0
 */
```
---
### **Function Documentation**

All function comments must follow JSDoc syntax, containing the following:

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

## 7. API Reference File

### Module API.md
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

### Root API.md

* This file should list **all modules**, their **exported functions**, **parameters**, **return values**, and **example usage**.
* Update this file **whenever you add, remove, or modify a module**.

The format for this documentation is yet to be determined

## 8. Adding Features

Before adding a new feature, **review the root API.md** to understand
the existing module landscape and determine the right approach.

In some cases, you'd want to extend an existing module whereas in other you'd want to create an entirely new module.

---

### Extend an existing module

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

### Create a new module

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
   `- API.md
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

## 9. Navigation and Discoverability (for vim users)

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

7. Test the module independently before integrating with other modules

---

> When in doubt, prefer a focused new module over bloating an existing one. Modularity is cheaper to maintain than untangling a module that has grown beyond its original responsibility.

## 10. Testing

* Test **each module independently** before integrating with other modules.
* Verify **cross-browser behavior**, especially for scroll/drag interactions (Chrome, Firefox, Safari).
* Ensure **momentum/elasticity** feel is smooth.

## 11. Summary

* **Document everything** (module headers, function docs, API.md)
* **Use consistent names** for discoverability
* **Keep modules small and focused**
* **Update documentation with every change**
* **GitHub repository is the canonical repository**

For any inquiries: **admin@auraq.org**
© 2026 Auraq Project 
