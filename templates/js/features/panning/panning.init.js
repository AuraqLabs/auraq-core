import { createPanningState } from './panning.state.js';
import { createPanningController } from './panning.controller.js';
import { bind } from './panning.dom.js';

export function initPanning() {
  const containers = document.querySelectorAll('[data-panning]');
  if (!containers.length) {
    console.warn('initPanning: no [data-panning] elements found');
    return;
  }

  containers.forEach(container => {
    const axis = container.dataset.panning || 'xy';
    const state = createPanningState();
    const controller = createPanningController(container, state, axis, '[data-panning]');

    bind(container, 'pointerdown', controller.onPointerDown);
    bind(container, 'pointermove', controller.onPointerMove);
    bind(container, 'pointerup', controller.onPointerUp);
    bind(container, 'pointercancel', controller.onPointerUp);
  });
}
