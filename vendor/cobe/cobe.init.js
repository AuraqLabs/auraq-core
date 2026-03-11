/**
 * init.js
 * Composition root for COBE on Kinu sites.
 *
 * Discovers the #cobe canvas, guards against mobile (where WebGL dot
 * rendering is unreliable), and initialises the globe with site defaults.
 *
 * Usage in main.js:
 *   import { initGlobe } from 'https://dev.auraq.org/vendor/cobe/cobe.init.js'
 *   document.addEventListener('DOMContentLoaded', () => { initGlobe() })
 *
 * The canvas only needs to exist in HTML — no JS config required at the call site:
 *   <canvas class="cobe" style="width: 500px; height: 500px" width="1000" height="1000"></canvas>
 */

import createGlobe from './cobe.create.js';

const MOBILE_BREAKPOINT = 800;

/**
 * initGlobe()
 * Initialises COBE on the #cobe canvas if it exists and the viewport is
 * wide enough. Safe to call unconditionally — does nothing on mobile or
 * when the canvas is absent.
 *
 * @returns {object|null} The Phenomenon instance, or null if skipped.
 */
export function initGlobe() {
  const canvas = document.querySelectorAll('cobe');

  if (!canvas) {
    console.warn('initGlobe: no #cobe canvas found, skipping');
    return null;
  }

  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    canvas.style.display = 'none';
    return null;
  }

  let phi = 2;

  const globe = createGlobe(canvas, {
    devicePixelRatio: 2,
    width:  1000,
    height: 1000,
    phi:    0,
    theta:  0.4,
    dark:   1,
    diffuse: 1.2,
    scale:  1,
    mapSamples:    24000,
    mapBrightness: 0.6,
    baseColor:   [0, 1, 0],
    markerColor: [1, 1, 1],
    glowColor:   [0, 0.6, 0],
    offset:  [0, 0],
    markers: [
      { location: [33.670682, 72.957342], size: 0.03 },
      { location: [6.1, 100.2], size: 0.03 },
    ],
    onRender: (state) => {
      state.phi = phi;
      phi += 0.006;
    },
  });

  return globe;
}
