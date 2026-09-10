// panning.init.js

import { PANNING_DEFAULTS } from './panning.config.js';
import { createPanningState } from './panning.state.js';
import { createPanningController } from './panning.controller.js';
import { bindEvent, getPanningContainers, getAxis, getNearestYScrollable } from './panning.dom.js';

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
    bindEvent(container, 'pointerdown', controller.onPointerDown);
    bindEvent(document, 'pointermove', controller.onPointerMove);
    bindEvent(document, 'pointerup',   controller.onPointerUp);
    bindEvent(document, 'pointercancel', controller.onPointerUp);

    if (axis === 'x') {
      const scrollableParent = getNearestYScrollable(container);
      if (scrollableParent) {
        bindEvent(container, 'wheel', (e) => {
          if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
          scrollableParent.scrollTop += e.deltaY;
          e.preventDefault();
        }, { passive: false });
      }
    }
  });
}
