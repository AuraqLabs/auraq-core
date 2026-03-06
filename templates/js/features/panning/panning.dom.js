export const $ = (id) => document.getElementById(id);
export const $$ = (selector) => document.querySelectorAll(selector);

// DOM query: find all panning containers
export function getPanningContainers() {
  return document.querySelectorAll('[data-panning]');
}

export function getAxis(container) {
  return container.dataset.panning || 'xy';
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
