// panning.init.js

import { createPanningState } from './panning.state.js';
import { createPanningController } from './panning.controller.js';
import { bind, getPanningContainers, getAxis, getNearestYScrollable } from './panning.dom.js';

export function initPanning() {
  const containers = getPanningContainers();

  if (!containers.length) {
    console.warn('initPanning: no [data-panning-axis] elements found');
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

    if (axis === 'x') {
      const scrollableParent = getNearestYScrollable(container);
      if (scrollableParent) {
        bind(container, 'wheel', (e) => {
	  if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
          scrollableParent.scrollTop += e.deltaY;
          e.preventDefault();
        }, { passive: false });
      }
    }
  });
}
