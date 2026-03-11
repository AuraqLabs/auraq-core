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
export function initGlobe({
    width = 1000,
    height = 1000,
    brightness = 0.6,
    themeColor,
    markers = [
      { location: [33.670682, 72.957342], size: 0.03 }
    ],
} = {}) {
  const canvases = document.querySelectorAll('.cobe');

  if (!canvases.length) {
    console.warn('initGlobe: no #cobe canvas found, skipping');
    return null;
  }

  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    canvases.forEach(canvas.style.display = 'none');
    return null;
  }
  
  const color = themeColor ?? [0.08, 0.61, 0.28];
  const glow  = color.map(c => c * 0.6);

  canvases.forEach(canvas => {
  let phi = 2;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width:  width,
      height: height,,
      phi:    0,
      theta:  0.4,
      dark:   1,
      diffuse: 1.2,
      scale:  1,
      mapSamples:    24000,
      mapBrightness: brightness,
      baseColor:   color,
      markerColor: [1, 1, 1],
      glowColor:   glow,
      offset:  [0, 0],
      markers: markers,
      onRender: (state) => {
        state.phi = phi;
        phi += 0.006;
      },
    });
  });
}
