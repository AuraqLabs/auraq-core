// skillTree.render.js

/**
 * skillTree.render.js
 * Owns DOM creation and visual updates for tree, nodes and edges
 * Exports:
 *   - initContainer(): {}
 *   - createFilters(container, domains): {filterBar, filter[]}
 *   - createNode(container, nodeData): {}
 *   - createEdge(): {}
 *   - createPopup(): {}
 */

import {
  setActive(),
  setNodeDimmed(),
  setPopupVisible()
} from './skillTree.dom.js';

import {
  createSkillTreeStates()
} from './skillTree.state.js';

export function initContainer(container) {
 container.setAttribute('data-panning-axis','xy');
 container.classList.add('skillTreeContainer');
}

export function createFilters(container, domains) {
  const filterBar = document.createElement('div');
  filterBar.className = 'skillTree-filterBar'
  container.appendChild(filterBar);

  const filters = [];
  for (let i = 0; i < domains.length; i++) {
    const filterButton = document.createElement('button');
    filterButton.className = 'skillTree-filterButton';
    filterBar.appendChild(filterButton);
    filter.push(filterButton);
  }

  return { filterBar, filters };
}

/**
 * @param: {Element} container
 * @param: {array} array
 * returns: { node: Element }
 */
function createNode(container, nodeData) {
  const node = document.createElement('div');
  node.className = 'skillTree-node';
  container.appendChild(node);

  const nodeDomain = createElement('div');
  nodeDomain.className = 'nodeDomain';

  const nodeDisplay = createElement('div');
  nodeDisplay.className = 'nodeDisplay';

  const nodeInstitute = createElement('div');
  nodeInstitute.className = 'nodeInstitute';

  const nodeYear = createElement('div');
  nodeYear.className = 'nodeYear';

  return { node };
}

export function createNodes(container, nodesData) {
  for (const data of nodesData) {
    
  }
}
