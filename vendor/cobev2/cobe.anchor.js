/**
 * @file cobe.anchor.js
 * Exports:
 *   - createAnchorManager(wrapper)
 *
 * @description CSS Anchor Element Management for COBE v2.
 * Creates invisible 1px anchor elements positioned on the globe surface
 * so that consumer-provided DOM elements (marker labels, tooltips) can
 * use CSS `position-anchor` to follow their globe position.
 *
 * Each marker/arc with an `id` gets:
 *   - An anchor element with `anchor-name: --cobe-<id>` (markers) or
 *     `anchor-name: --cobe-arc-<id>` (arcs)
 *   - A `--cobe-visible-<id>` CSS variable on :root set to 'N' when the
 *     point is visible (in front of the globe); unset when hidden.
 *     Consumers use this to toggle visibility: `opacity: var(--cobe-visible-sf, 0)`
 *
 * Known issue (upstream #119): the style tag written each frame to :root
 * causes Chrome DevTools Styles panel to appear empty while COBE is running.
 * This is a DevTools display bug; production rendering is unaffected.
 *
 * Original: https://github.com/shuding/cobe
 * License: MIT
 *
 * @module cobe/anchor
 * @author Shu Ding (original) -- vendored and adapted by KinuCyber
 * @license GPL-3.0
 */

/**
 * Create and manage CSS anchor elements for DOM-positioned markers and arcs.
 * Returns four methods used by cobe.create.js internally.
 *
 * @param {HTMLElement} wrapper - The wrapper div created around the canvas.
 * @returns {{ m: Function, a: Function, s: Function, r: Function }}
 */
export function createAnchorManager(wrapper) {
  const markerAnchors  = {}
  const arcAnchors     = {}
  const visibilityVars = {}

  const styleEl = document.createElement('style')
  document.head.append(styleEl)

  /**
   * Write accumulated CSS variables to :root. Only writes when content
   * actually changed to avoid unnecessary style invalidation each frame.
   */
  function updateStyleTag() {
    let vars = ''
    for (let key in visibilityVars) vars += key + ':' + visibilityVars[key] + ';'
    const next = ':root{' + vars + '}'
    if (next !== styleEl.textContent) styleEl.textContent = next
  }

  /**
   * Create or update an anchor element at a given percentage position.
   * @param {Object} anchors - The anchor map (markerAnchors or arcAnchors)
   * @param {string} key
   * @param {string} anchorName - CSS anchor-name value
   * @param {{ x: number, y: number }} position - 0-1 screen-space position
   */
  function updateAnchor(anchors, key, anchorName, position) {
    let anchor = anchors[key]
    if (!anchor) {
      anchor = document.createElement('div')
      anchor.style.cssText =
        'position:absolute;width:1px;height:1px;pointer-events:none;anchor-name:' +
        anchorName
      wrapper.append(anchor)
      anchors[key] = anchor
    }
    anchor.style.left = position.x * 100 + '%'
    anchor.style.top  = position.y * 100 + '%'
  }

  /**
   * Update marker anchors and visibility variables.
   * @param {Array}    markers - Marker array from createGlobe options
   * @param {Function} project - Projection function from cobe.create.js
   */
  function m(markers, project) {
    const activeKeys = {}
    for (const marker of markers) {
      const key = marker.id
      if (!key) continue
      const pos    = project(marker.location)
      activeKeys[key] = 1
      updateAnchor(markerAnchors, key, `--cobe-${key}`, pos)
      if (pos.visible) visibilityVars['--cobe-visible-' + key] = 'N'
      else             delete visibilityVars['--cobe-visible-' + key]
    }
    for (const key in markerAnchors) {
      if (!activeKeys[key]) {
        markerAnchors[key].remove()
        delete markerAnchors[key]
        delete visibilityVars['--cobe-visible-' + key]
      }
    }
  }

  /**
   * Update arc midpoint anchors and visibility variables.
   * @param {Array}    arcs           - Arc array from createGlobe options
   * @param {Function} projectMidpoint - Arc midpoint projection from cobe.create.js
   */
  function a(arcs, projectMidpoint) {
    const activeKeys = {}
    for (const arc of arcs) {
      const key = arc.id
      if (!key) continue
      const pos    = projectMidpoint(arc)
      activeKeys[key] = 1
      updateAnchor(arcAnchors, key, `--cobe-arc-${key}`, pos)
      if (pos.visible) visibilityVars['--cobe-visible-arc-' + key] = 'N'
      else             delete visibilityVars['--cobe-visible-arc-' + key]
    }
    for (const key in arcAnchors) {
      if (!activeKeys[key]) {
        arcAnchors[key].remove()
        delete arcAnchors[key]
        delete visibilityVars['--cobe-visible-arc-' + key]
      }
    }
  }

  /**
   * Remove all anchor elements and the style tag. Called on globe.destroy().
   */
  function r() {
    for (const key in markerAnchors) markerAnchors[key].remove()
    for (const key in arcAnchors)    arcAnchors[key].remove()
    styleEl.remove()
  }

  return { m, a, s: updateStyleTag, r }
}
