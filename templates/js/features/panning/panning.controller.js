import {setScroll, getScroll} from "./panning.dom.js";

export function createPanningController(container, state) {
  const LINE_HEIGHT = 16;

  function cancelMomentum() {
    if (state.momentumID) cancelAnimationFrame(state.momentumID);
    state.momentumID = null;
  }

  function startMomentum() {
    const friction = 0.85;
    const minVelocity = 0.02;
  

    function step() {
      state.velocity *= friction;
      setScroll(container, getScroll(container) - state.velocity * 20);

      if (Math.abs(state.velocity) > minVelocity) {
        state.momentumID = requestAnimationFrame(step);
      }
    }
    state.momentumID = requestAnimationFrame(step);
  }

  function onPointerDown(e) {
    state.isDragging = true;
    state.startY = e.clientY;
    state.startScrollTop = getScroll(container);
    state.lastY = e.clientY;
    state.lastTime = performance.now();
    container.setPointerCapture(e.pointerId);
    cancelMomentum();
  }

  function onPointerMove(e) {
    if (!state.isDragging) return;
    
    const dy = e.clientY - state.startY;
    setScroll(container, state.startScrollTop - dy);

    const now = performance.now();
    state.velocity = (e.clientY - state.lastY) / (now - state.lastTime);
    state.lastY = e.clientY;
    state.lastTime = now;
  }

  function onPointerUp() {
    state.isDragging = false;
    startMomentum();
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp
  };
}
