import { initPanning } from 'https://cdn.auraq.org/modules/panning/panning.init.js';
import { initGlobe } from 'https://dev.auraq.org/vendor/cobe/cobe.init.js';
import { initSectionMap } from 'https://dev.auraq.org/modules/sectionMap/sectionMap.init.js';
import { initSkillTree } from 'https://dev.auraq.org/modules/skillTree/skillTree.init.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobe();
  initSectionMap();
  initSkillTree();
  initPanning();
});
