import { createPanningState } from './panning.state.js';
import { createPanningController } from './panning.controller.js';
import { bind, getPanningContainers, getAxis } from './panning.dom.js';

export function initPanning() {
  const containers = getPanningContainers();

  if (!containers.length) {
    console.warn('initPanning: no [data-panning] elements found');
    return;
  }

  containers.forEach(container => {
    const axis = getAxis(container);
    const state = createPanningState();
    const controller = createPanningController(container, state, axis);

    bind(container, 'pointerdown', controller.onPointerDown);
    bind(container, 'pointermove', controller.onPointerMove);
    bind(container, 'pointerup', controller.onPointerUp);
    bind(container, 'pointercancel', controller.onPointerUp);
  });
}
