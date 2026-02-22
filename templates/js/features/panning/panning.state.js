export function createPanningState() {
  return {
    isDragging: false,
    startY: 0,
    startScrollTop: 0,
    velocity: 0,
    lastY: 0,
    lastTime: 0,
    momentumID: null
  }
}
