import { initPanning } from './features/panning/panning.init.js';

document.addEventListener('DOMContentLoaded', () => {
  initPanning('#panningRoot', { axis: 'y' });
  initPanning('.panningCards', { axis: 'x' });
});
