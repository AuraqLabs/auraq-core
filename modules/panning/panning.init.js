// panning.init.js

import { PANNING_DEFAULTS } from './panning.config.js';
import { createPanningState } from './panning.state.js';
import { createPanningController } from './panning.controller.js';
import { bind, getPanningContainers, getAxis, getNearestYScrollable } from './panning.dom.js';

export function initPanning(options = {}) {
  const config = { ...PANNING_DEFAULTS, ...options };

  const containers = getPanningContainers();

  if (!containers.length) {
    console.warn('initPanning: no [data-panning-axis] elements found');
    return;
  }

  containers.forEach(container => {
    const axis = getAxis(container);
    const state = createPanningState();
    const controller = createPanningController(container, state, axis, config);
    bind(container, 'pointerdown', controller.onPointerDown);
    bind(document, 'pointermove', controller.onPointerMove);
    bind(document, 'pointerup',   controller.onPointerUp);
    bind(document, 'pointercancel', controller.onPointerUp);

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
