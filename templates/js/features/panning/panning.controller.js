import { setScrollX, setScrollY, getScrollX, getScrollY, capturePointer } from "./panning.dom.js";

export function createPanningController(container, state, axis = 'xy', selector = '[data-panning]') {
  const friction = 0.85;
  const minVelocity = 0.02;
  const weight = 20;

  const useX = axis === 'x' || axis === 'xy';
  const useY = axis === 'y' || axis === 'xy';

  function cancelMomentum() {
    if (state.momentumID) cancelAnimationFrame(state.momentumID);
    state.momentumID = null;
  }

  function startMomentum() {
    function step() {
      state.velocityX *= friction;
      state.velocityY *= friction;

      if (useX) setScrollX(container, getScrollX(container) - state.velocityX * weight);
      if (useY) setScrollY(container, getScrollY(container) - state.velocityY * weight);

      const stillMoving =
        (useX && Math.abs(state.velocityX) > minVelocity) ||
        (useY && Math.abs(state.velocityY) > minVelocity);

      if (stillMoving) {
        state.momentumID = requestAnimationFrame(step);
      }
    }
    state.momentumID = requestAnimationFrame(step);
  }

  function onPointerDown(e) {
    state.isDragging = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.startScrollLeft = getScrollX(container);
    state.startScrollTop = getScrollY(container);
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.lastTime = performance.now();
    
    const innerPanning = e.target.closest(selector);
    if (!innerPanning || innerPanning === container) {
      capturePointer(container, e.pointerId);
    }
    
    cancelMomentum();
  }

  function onPointerMove(e) {
    if (!state.isDragging) return;

    const now = performance.now();
    const dt = now - state.lastTime;

    if (useX) {
      const dx = e.clientX - state.startX;
      setScrollX(container, state.startScrollLeft - dx);
      state.velocityX = (e.clientX - state.lastX) / dt;
    }

    if (useY) {
      const dy = e.clientY - state.startY;
      setScrollY(container, state.startScrollTop - dy);
      state.velocityY = (e.clientY - state.lastY) / dt;
    }

    state.lastX = e.clientX;
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

