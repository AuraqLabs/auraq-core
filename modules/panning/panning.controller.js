// panning.controller.js

import { setScrollX, setScrollY, getScrollX, getScrollY } from "./panning.dom.js";

export function createPanningController(container, state, axis = 'xy') {
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

  const DRAG_THRESHOLD = 5;

  function onPointerDown(e) {
    state.isPointerDown = true;
    state.isPanning = false;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.startScrollX = getScrollX(container);
    state.startScrollY = getScrollY(container);
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.lastTime = performance.now();

    cancelMomentum();
  }

  function onPointerMove(e) {
    if (!state.isPointerDown) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    if (!state.isPanning) {
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        state.isPanning = true;
      } else {
        return;
      }
    }

    const now = performance.now();
    const dt = now - state.lastTime;

    if (allowX) {
      setScrollX(container, state.startScrollX - dx);
      state.velocityX = (e.clientX - state.lastX) / dt;
    }

    if (allowY) {
      setScrollY(container, state.startScrollY - dy);
      state.velocityY = (e.clientY - state.lastY) / dt;
    }

    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.lastTime = now;
  }

  function onPointerUp() {
    if (!state.isPointerDown) return;

    if (state.isPanning) {
      startMomentum();
    }

    state.isPointerDown = false;
    state.isPanning = false;
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp
  };
}
