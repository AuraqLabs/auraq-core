# Auraq

**Auraq core** is a modular frontend templating system. It provides the UI/UX and interaction layer for all of my static portfolio sites. Unique features include direct manipulation scrolling, horizontal navigation systems, and backward compatibility. The system ensures consistent behavior across multiple sites while remaining fully modular and maintainable via Git submodules. The <noscript> fallback lets the site remain functional even when JavaScript is disabled.

---

## Table of Contents

1. [Overview](#overview)  
2. [Features](#features)  
3. [Repository Structure](#repository-structure)  
4. [Installation](#installation)  
5. [Usage](#usage)  
6. [API Documentation](#api-documentation)  
7. [Contribution Guidelines](#contribution-guidelines)  
8. [License](#license)  

---

## Overview

Auraq provides a clean, reusable template for web projects with the following goals:

- Fully modular architecture  
- User-friendly UI/UX design
- Easy integration with multiple sites via Git submodules
- Lightweight, ES6-friendly JavaScript  
- Static-file ready for GitHub Pages hosting  

---

## Features

Auraq has the following planned modules:

- **panning:** Smooth pointer-based panning with momentum and elastic feel  
- **Navigation:** Modular vertical or horizontal nav bars with active indicators  
- **Data:** A shared dataset between multiple sites
- **Centralized Documentation:** Each module has its own `API.md` for function reference  
- **JavaScript Disabled Fallback:** Remains functional even when JavaScript is disabled
---

## Repository Structure

Auraq/
├─ modules/             # Core modules (panning, carousel, nav, utils)
│   ├─ panning/
│   │   ├─ vertical.js
│   │   ├─ horizontal.js
│   │   └─ API.md
│   ├─ carousel/
│   │   ├─ carousel.js
│   │   └─ API.md
│   ├─ nav/
│   │   └─ nav.js
│   └─ utils/
│       └─ helpers.js
├─ templates/           # HTML/CSS templates for consistent layout
├─ API.md               # Global API overview & module links
└─ README.md

---

## Installation

1. Clone the Auraq repo as a **submodule** in your project:

```bash
git submodule add https://github.com/YourUsername/Auraq.git js/modules/Auraq
git submodule update --init --recursive
```

2. Include desired modules in your HTML:

```html
<script type="module" src="js/modules/Auraq/modules/panning/vertical.js"></script>
<script type="module" src="js/modules/Auraq/modules/carousel/carousel.js"></script>
```

---

## Usage

### Panning

```javascript
import { initVerticalDrag } from './modules/panning/vertical.js';

const container = document.getElementById('modalContainer');
initVerticalDrag(container);
```

### Carousel

```javascript
import { initCarousel } from './modules/carousel/carousel.js';

const carouselEl = document.getElementById('myCarousel');
initCarousel(carouselEl, { autoplay: true, interval: 5000 });
```

> See `API.md` for complete usage, function signatures, and parameters.

---

## API Documentation

* Global overview: [API.md](./API.md)

---

## Contribution Guidelines

* Follow modular ES6 structure
* Document each function with parameters, return types, and usage
* Use **descriptive commits** when updating modules
* Update the corresponding `API.md` whenever a module changes
* Ensure all functionality works across Chrome, Firefox, and other major browsers

> See `CONTRIBUTING.md` for detailed instructions.

---

## License

GPL License © 2026 Auraq Project
