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
  setActive,
  setNodeDimmed,
  setPopupVisible
} from './skillTree.dom.js';

export function initContainer(container) {
 container.setAttribute('data-panning-axis','xy');
 container.classList.add('skillTreeContainer');
 injectStyles();
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
    filters.push(filterButton);
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
  node.className = `skillTree-node domain-${nodeData.domain}`;
  node.dataset.id = nodeData.id; //for activation when clicked
  node.dataset.domain = nodeData.domain; //for filters
  node.dataset.institute = nodeData.institute; //for filters
  node.dataset.year = nodeData.year; //for filters
  container.appendChild(node);

  const nodeDomain = document.createElement('div');
  nodeDomain.className = 'nodeDomain';
  nodeDomain.textContent = nodeData.domain;

  const nodeDisplay = document.createElement('div');
  nodeDisplay.className = 'nodeDisplay';
  nodeDisplay.textContent = nodeData.display;

  const nodeInstitute = document.createElement('div');
  nodeInstitute.className = 'nodeInstitute';
  nodeInstitute.textContent = nodeData.institute;

  const nodeYear = document.createElement('div');
  nodeYear.className = 'nodeYear';
  nodeYear.textContent = nodeData.year;

  node.appendChild(nodeDomain);
  node.appendChild(nodeDisplay);
  node.appendChild(nodeInstitute);
  node.appendChild(nodeYear);

  return node;
}

export function createNodes(container, nodesData) {
  const nodes = [];
  for (const data of nodesData) {
    const node = createNode(container, data);
    nodes.push(node);
  }

  return { nodes };
}

export function createEdges() {
}

export function createPopups() {
}

// Rudimentary CSS Configuration
function injectStyles() {
  if (document.getElementById('skillTree-styles')) return;

  const style = document.createElement('style');
  style.id = 'skillTree-styles';
  style.textContent = `

  `;
  document.head.appendChild(style);
}
