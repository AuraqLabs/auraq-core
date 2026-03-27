// skillTree.dom.js

/**
 * skillTree.dom.js
 * Owns all DOM reads and writes for the skillTree module.
 * Exports:
 *   getSkillTreeContainer(): Element | null
 *   setActive(El, active): void,
 *   setCanvasDimensions(canvasEl, canvasWidth, canvasHeight): void
 *   setNodeDimmed(nodeEl, dimmed)
 *   setPopupVisible(popupEl, visible): void,
 *   setPopupPosition(popupEl, x, y, side): void,
 *   setPopupArrowPosition(popupArrEl, x, y, side): void
 */

/**
 * @returns: Element
 */
export function getSkillTreeContainer() {
  return document.querySelector('[data-skill-tree]');
}

/**
 * Activate or inactive  nodes, filter buttons and popups
 * @param {Element} El
 * @param {boolean} active
 * @returns: void
 */
export function setActive(El, active) {
  El.classList.toggle('active', active);
}

/**
 * @param {Element} canvasEl
 * @param {integer} canvasWidth
 * @param {integer} canvasHeight
 */
export function setCanvasDimensions(canvasEl, canvasWidth, canvasHeight) {
  canvasEl.style.width  = canvasWidth;
  canvasEl.style.height = canvasHeight;
}

export function setNodePosition(nodeEl, x, y) {
  nodeEl.style.left = `${x}px`;
  nodeEl.style.top = `${y}px`;
}

/**
 * @param {Element} nodeEl
 * @param {boolean} dimmed
 * @returns: void
 */
export function setNodeDimmed(nodeEl, dimmed) {
  nodeEl.classList.toggle('dimmed', dimmed);
}

/**
 * @param {Element} popup
 * @param {boolean} visible
 * @returns: void
 */
export function setPopupVisible(popupEl, visible) {
  popupEl.classList.toggle('visible', visible);
}


export function setPopupPosition(popupEl, left, top) {
    popupEl.style.left = left;
    popupEl.style.top = top;
}

export function setPopupArrowPosition(popupArrEl, x, y, side) {
}

export function getNodeRect(nodeEl) {
  return {
    left: parseInt(nodeEl.style.left),
    top: parseInt(nodeEl.style.top),
    width: nodeEl.offsetWidth || 300,
    height: nodeEl.offsetHeight|| 150
  };
}
