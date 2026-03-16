// skillTree.dom.js

/**
 * skillTree.dom.js
 * Owns all DOM reads and writes for the skillTree module.
 * Exports:
 *   setActiveFilter(filterEl, active): void,
 *   setNodeActive(nodeEl, active): void,
 *   setNodeDimmed(nodeEl, dimmed)
 *   setPopupVisible(popupEl, visible): void,
 *   setPopupPosition(popupEl, x, y, side): void,
 *   setPopupArrowPosition(popupArrEl, x, y, side): void
 */

/**
 * @param {Element} filterEl
 * @param {boolean} active
 * @returns: void
 */
export function setActiveilter(filterEl, active) {
  filterEl.classList.toggle('active', active);
}

/**
 * @param {Element} nodeEl
 * @param {boolean} active
 * @returns: void
 */
export function setNodeActive(nodeEl, active) {
    nodeEl.classList.toggle('active', active);
}
