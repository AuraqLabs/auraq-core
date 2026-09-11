/**
 * @file cobe.init.js
 * Exports:
 *   - initGlobeV2(opts?)
 *
 * @description Auraq composition root for COBE v2. Discovers all `.cobe`
 * canvas elements, guards against mobile viewports, and initialises the
 * globe with site defaults.
 *
 * V2 change: `createGlobe` no longer accepts an `onRender` callback. The
 * animation loop is managed here via `requestAnimationFrame` and
 * `globe.update({ phi })`, which is the new idiomatic pattern for v2.
 *
 * Note: `createGlobe` wraps the canvas in a `position:relative` div to
 * support CSS-anchored DOM markers. If consumer CSS targets the canvas's
 * direct parent, this wrapper may affect layout. The canvas element itself
 * is unchanged.
 *
 * Usage:
 *   import { initGlobeV2 } from 'https://dev.auraq.org/vendor/cobev2/cobe.init.js'
 *   document.addEventListener('DOMContentLoaded', () => { initGlobeV2() })
 *
 * Canvas in HTML (no JS config required at the call site):
 *   <canvas class="cobe" style="width:500px;height:500px" width="1000" height="1000"></canvas>
 *
 * @module cobe/init
 * @author KinuCyber
 * @license GPL-3.0
 */

import createGlobe from './cobe.create.js'

// Suppress globe below this viewport width (WebGL dot rendering is
// unreliable on small screens and degrades performance on low-end devices)
const MOBILE_BREAKPOINT = 800

/**
 * Initialise COBE on all `.cobe` canvas elements if the viewport is wide
 * enough. Safe to call unconditionally -- does nothing on mobile or when
 * no canvas is found.
 *
 * @param {object}   [opts={}]
 * @param {number}   [opts.width=1000]        - Canvas pixel width
 * @param {number}   [opts.height=1000]       - Canvas pixel height
 * @param {number}   [opts.brightness=0.6]    - Land dot brightness
 * @param {number[]} [opts.themeColor]        - Globe base color [r, g, b] (0-1),
 *                                              defaults to Auraq accent green
 * @param {Array}    [opts.markers]           - Location markers
 * @param {Array}    [opts.arcs]              - Arc connections (v2)
 * @returns {Array<{ globe: object, cancel: Function }>|null}
 *   Array of globe instances with their cancel functions, or null if skipped.
 */
export function initGlobe({
  width      = 1000,
  height     = 1000,
  brightness = 0.6,
  themeColor,
  markers    = [{ location: [33.670682, 72.957342], size: 0.03 }],
  arcs       = [],
} = {}) {
  const canvases = document.querySelectorAll('.cobev2')

  if (!canvases.length) {
    console.warn('initGlobe: no .cobev2 canvas found, skipping')
    return null
  }

  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    canvases.forEach(canvas => { canvas.style.display = 'none' })
    return null
  }

  const color = themeColor ?? [0.08, 0.61, 0.28]
  const glow  = color.map(c => c * 0.6)

  return Array.from(canvases).map(canvas => {
    let phi    = 2
    let animId = null

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width,
      height,
      phi:             0,
      theta:           0.4,
      dark:            1,
      diffuse:         1.2,
      scale:           1,
      mapSamples:      24000,
      mapBrightness:   brightness,
      baseColor:       color,
      markerColor:     [1, 1, 1],
      glowColor:       glow,
      offset:          [0, 0],
      markers,
      arcs,
    })

    // Animation loop -- v2 pattern: consumer drives rAF, calls globe.update()
    function animate() {
      phi     += 0.006
      globe.update({ phi })
      animId   = requestAnimationFrame(animate)
    }
    animId = requestAnimationFrame(animate)

    return {
      globe,
      cancel: () => {
        cancelAnimationFrame(animId)
        globe.destroy()
      },
    }
  })
}
