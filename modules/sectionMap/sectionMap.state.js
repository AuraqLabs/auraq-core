// sectionMap.state.js

export function createSectionMapState() {
  return {
    cancelAnimation: null,
    isDragging:      false,
    hasMoved:        false,
    lastPointerX:    0,
    lastPointerT:    0,
    pointerVelX:     0
  };
}
