// panning.dom.js

export function getPanningContainers() {
  return document.querySelectorAll('[data-panning-axis]');
}

export function getAxis(container) {
  return container.dataset.panningAxis || 'xy';
}

export function setScrollY(container, value) {
  container.scrollTop = value;
}

export function getScrollY(container) {
  return container.scrollTop;
}

export function setScrollX(container, value) {
  container.scrollLeft = value;
}

export function getScrollX(container) {
  return container.scrollLeft;
}

export function capturePointer(container, pointerId) {
  container.setPointerCapture(pointerId);
}

export function bind(container, event, handler, options) {
  container.addEventListener(event, handler, options);
}

export function getNearestYScrollable(element) {
  let parent = element.parentElement;
  while (parent) {
    const overflowY = getComputedStyle(parent).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return parent;
    parent = parent.parentElement;
  }
  return null;
}
