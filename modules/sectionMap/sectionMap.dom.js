// sectionMap.dom.js

/**
 * sectionMap.dom.js
 * Owns all DOM reads and writes for the sectionMap module.
 * Exports:
 *   - measureTickPositions(ticks): number[]
 *   - getSectionOffsetTops(sections): number[]
 *   - getScrollable(container): number
 *   - getBarRect(bar): DOMRect
 *   - getScrollContainer(): Element | null
 *   - getSections(): Element[]
 *   - getScrollTop(container): number
 *   - getScrollHeight(container): number
 *   - getClientHeight(container): number
 *   - setScrollTop(container, value): void
 *   - getSectionOffsetTop(section): number
 *   - SetThumbPosition(thumb, px): void
 *   - setArialValue(element, value): void
 */

/**
 * measureTickPositions(ticks)
 * Reads the rendered centre X of each tick relative to the bar.
 * Must be called after the bar is in the DOM so offsetLeft is available.
 * @param {Element[]} ticks
 * Returns: number[] — centre X of each tick in px
 */
export function measureTickPositions(ticks) {
  return ticks.map(tick => tick.offsetLeft + tick.offsetWidth / 2);
}

/**
 * getSectionOffsetTops(sections)
 * Reads the offsetTop of each section from the DOM
 * Consumed by engine.js's computeSectionNorms()
 * @param {Element[]} sections
 * Returns: number[]
 */
export function getSectionOffsetTops(sections) {
  return sections.map(s => s.offsetTop);
}

/**
 * getScrollable(container)
 * Returns the scrollable height of the container (scrollHeight − clientHeight).
 * Consumed by engine.js's computeSectionNorms().
 * @param {Element} container
 * Returns: number
 */
export function getScrollable(container) {
  return container.scrollHeight - container.clientHeight;
}

/**
 * getBarRect(bar)
 * Returns the bounding client rect of the bar.
 * @param {Element} bar
 * Returns: DOMRect
 */
export function getBarRect(bar) {
  return bar.getBoundingClientRect();
}

/**
 * getScrollContainer()
 * Returns the primary scroll container.
 * Returns: Element || null
 */
export function getScrollContainer() {
  return document.getElementById('main');
}

/**
 * getSections()
 * Returns all direct section children of <main>.
 * Returns: Element[]
 */
export function getSections() {
  return Array.from(document.querySelectorAll('main > section'));
}

/**
 * getScrollTop(container)
 * @param {Element} container
 * Returns: number
 */
export function getScrollTop(container) {
  return container.scrollTop;
}

/**
 * getScrollHeight(container)
 * @param {Element} container
 * Returns: number
 */
export function getScrollHeight(container) {
  return container.scrollHeight;
}

/**
 * getClientHeight(container)
 * @param {Element} container
 * Returns: number
 */
export function getClientHeight(container) {
  return container.clientHeight;
}

/**
 * setScrollTop(container, value)
 * @param {Element} container
 * @param {number}  value
 * Returns: void
 */
export function setScrollTop(container, value) {
  container.scrollTop = value;
}

/**
 * getSectionOffsetTop(section)
 * @param {Element} section
 * Returns: number — offsetTop relative to scroll container
 */
export function getSectionOffsetTop(section) {
  return section.offsetTop;
}

/**
 * @param {Element} thumb
 * @param {number} px
 * @Returns: void
 */
export function setThumbPosition(thumb, px) {
  thumb.style.transform = `translate(${px}px, -50%)`;
}

/**
 * @param {Element} element
 * @param {number} value
 * @Returns: void
 */
export function setArialValue(element, value) {
  element.setAttribute('aria-valuenow', value);
}
