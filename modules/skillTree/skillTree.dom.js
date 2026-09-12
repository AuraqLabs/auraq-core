// skillTree.dom.js

/**
 * skillTree.dom.js
 * Owns all DOM reads and writes for the skillTree module.
 * Exports:
 *   getSkillsContainer(): Element | null
 *   getSkillNodes(container): Element[]
 *   setActive(El, active): void
 *   setCanvasDimensions(canvasEl, canvasWidth, canvasHeight): void
 *   setNodeDimmed(nodeEl, dimmed): void
 *   setPopupVisible(popupEl, visible): void
 *   setPopupPosition(popupEl, left, top): void
 *   setPopupArrowPosition(popupArrEl, x, y, side): void
 *   getNodeRect(nodeEl): object
 *   getViewportWidth(): number
 *   getPopupSide(popupEl): string
 */

/**
 * Returns the [data-skills] container element, or null if not present.
 * @returns {Element|null}
 */
export function getSkillsContainer() {
  return document.querySelector('[data-skills]');
}

/**
 * Returns all direct <details> children of the given container.
 * @param {Element} container
 * @returns {Element[]}
 */
export function getSkillNodes(container) {
  return Array.from(container.querySelectorAll(':scope > details'));
}

/**
 * Activates or deactivates nodes, filter buttons, and popups.
 * @param {Element} El
 * @param {boolean} active
 * @returns {void}
 */
export function setActive(El, active) {
  El.classList.toggle('active', active);
}

/**
 * @param {Element} canvasEl
 * @param {number}  canvasWidth
 * @param {number}  canvasHeight
 */
export function setCanvasDimensions(canvasEl, canvasWidth, canvasHeight) {
  canvasEl.style.width  = `${canvasWidth}px`;
  canvasEl.style.height = `${canvasHeight}px`;
}

/**
 * @param {Element} nodeEl
 * @param {number}  x
 * @param {number}  y
 */
export function setNodePosition(nodeEl, x, y) {
  nodeEl.style.left = `${x}px`;
  nodeEl.style.top  = `${y}px`;
}

/**
 * @param {Element} nodeEl
 * @param {boolean} dimmed
 * @returns {void}
 */
export function setNodeDimmed(nodeEl, dimmed) {
  nodeEl.classList.toggle('dimmed', dimmed);
}

/**
 * @param {Element} popupEl
 * @param {boolean} visible
 * @returns {void}
 */
export function setPopupVisible(popupEl, visible) {
  popupEl.classList.toggle('visible', visible);
}

/**
 * @param {Element} popupEl
 * @param {number}  left
 * @param {number}  top
 */
export function setPopupPosition(popupEl, left, top) {
  popupEl.style.left = `${left}px`;
  popupEl.style.top  = `${top}px`;
}

export function setPopupArrowPosition(popupArrEl, x, y, side) {
}

/**
 * @param {Element} nodeEl
 * @returns {object}
 */
export function getNodeRect(nodeEl) {
  return {
    nodeLeft:   parseInt(nodeEl.style.left),
    nodeTop:    parseInt(nodeEl.style.top),
    nodeWidth:  nodeEl.offsetWidth  || 300,
    nodeHeight: nodeEl.offsetHeight || 150
  };
}

/**
 * @returns {number}
 */
export function getViewportWidth() {
  return window.innerWidth;
}

/**
 * @param {Element} popupEl
 * @returns {string}
 */
export function getPopupSide(popupEl) {
  return popupEl.classList.contains('popup-left')  ? 'left'
       : popupEl.classList.contains('popup-right') ? 'right'
       : 'below';
}
