import { $ } from '../../utils/dom.js';
import { createPanningState } from './panning.state.js';
import { createPanningController } from './panning.controller.js';
import { bind } from './panning.dom.js';

export function initPanning(containerId) {
  const container = $(containerId);
  if (!container) return;

  const state = createPanningState();
  const controller = createPanningController(container, state);

  bind(container, 'pointerdown', controller.onPointerDown);
  bind(container, 'pointermove', controller.onPointerMove);
  bind(container, 'pointerup', controller.onPointerUp);
  bind(container, 'pointercancel', controller.onPointerUp);
}
