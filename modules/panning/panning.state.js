// panning.state.js

export function createPanningState() {
  return {
    isPanning: false,
    startX: 0,
    startY: 0,
    startScrollX: 0,
    startScrollY: 0,
    velocityX: 0,
    velocityY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    momentumFrameID: null
  }
}
