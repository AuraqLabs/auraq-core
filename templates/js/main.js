import { initPanning } from 'https://cdn.auraq.org/modules/panning/panning.init.js';
import { initGlobe } from 'https://dev.auraq.org/vendor/cobe/cobe.init.js';
import { initSectionMap } from 'http://192.168.0.218:8081/modules/sectionMap/sectionMap.init.js';

document.addEventListener('DOMContentLoaded', () => {
  initPanning();
  initGlobe();
  initSectionMap();
});
