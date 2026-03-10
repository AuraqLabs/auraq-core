// panning.controller.js

import { setScrollX, setScrollY, getScrollX, getScrollY, capturePointer } from "./panning.dom.js";

export function createPanningController(container, state, axis = 'xy', nestedContainerSelector = '[data-panning-axis]') {
  const friction = 0.85;
  const minVelocity = 0.02;
  const momentumScale = 20;

  const allowX = axis === 'x' || axis === 'xy';
  const allowY = axis === 'y' || axis === 'xy';

  function cancelMomentum() {
    if (state.momentumFrameID) cancelAnimationFrame(state.momentumFrameID);
    state.momentumFrameID = null;
  }

  function startMomentum() {
    function momentumStep() {
      state.velocityX *= friction;
      state.velocityY *= friction;

      if (allowX) setScrollX(container, getScrollX(container) - state.velocityX * momentumScale);
      if (allowY) setScrollY(container, getScrollY(container) - state.velocityY * momentumScale);

      const stillMoving =
        (allowX && Math.abs(state.velocityX) > minVelocity) ||
        (allowY && Math.abs(state.velocityY) > minVelocity);

      if (stillMoving) {
        state.momentumFrameID = requestAnimationFrame(momentumStep);
      }
    }
    state.momentumFrameID = requestAnimationFrame(momentumStep);
  }

  function onPointerDown(e) {
    state.isPanning = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.startScrollX = getScrollX(container);
    state.startScrollY = getScrollY(container);
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.lastTime = performance.now();

    const nestedContainer = e.target.closest(nestedContainerSelector);
    if (!nestedContainer || nestedContainer === container) {
      capturePointer(container, e.pointerId);
    }

    cancelMomentum();
  }

  function onPointerMove(e) {
    if (!state.isPanning) return;

    const now = performance.now();
    const dt = now - state.lastTime;

    if (allowX) {
      const dx = e.clientX - state.startX;
      setScrollX(container, state.startScrollX - dx);
      state.velocityX = (e.clientX - state.lastX) / dt;
    }

    if (allowY) {
      const dy = e.clientY - state.startY;
      setScrollY(container, state.startScrollY - dy);
      state.velocityY = (e.clientY - state.lastY) / dt;
    }

    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.lastTime = now;
  }

  function onPointerUp() {
    state.isPanning = false;
    startMomentum();
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp
  };
}

