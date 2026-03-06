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
