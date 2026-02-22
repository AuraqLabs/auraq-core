export function setScroll(container, value) {
  container.scrollTop = value;
}

export function getScroll(container) {
  return container.scrollTop;
}

export function capturePointer(pointer, pointerId) {
  container.setPointerCapture(pointerId);
}

export function bind (container, event, handler, options) {
  container.addEventListener(event, handler, options);
}
