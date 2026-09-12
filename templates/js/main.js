import { initPanning } from 'https://cdn.auraq.org/modules/panning/panning.init.js';
import { initGlobe } from 'https://cdn.auraq.org/vendor/cobe/cobe.init.js';
import { initSectionMap } from 'https://cdn.auraq.org/modules/sectionMap/sectionMap.init.js';
import { initSkillTree } from 'https://cdn.auraq.org/modules/skillTree/skillTree.init.js';
import { initSkillAccordion } from 'https://cdn.auraq.org/modules/skillAccordion/skillAccordion.init.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobe();
  initSectionMap();
  initSkillTree();
  initSkillAccordion();
  initPanning();
});
