// sectionMap.init.js

import { getScrollContainer, getSections } from './sectionMap.dom.js';
import { createBar } from './sectionMap.render.js';
import { createSectionMapController } from './sectionMap.controller.js';

export function initSectionMap() {
  const container = getScrollContainer();
  if (!container) {
    console.warn('initSectionMap: #main not found');
    return;
  }

  const sections = getSections();
  if (!sections.length) {
    console.warn('initSectionMap: no main > section elements found');
    return;
  }

  const { bar, ticks, thumb } = createBar(sections.length); //Amount of ticks = sections.length
  createSectionMapController(container, sections, bar, ticks, thumb);
}
