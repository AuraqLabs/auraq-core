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

import {
  computeEdgePoints,
  computePopupSide
} from './skillTree.engine.js';

export function initContainer(container) {
 container.setAttribute('data-panning-axis','xy');
 container.classList.add('skillTreeContainer');
 const canvas = document.createElement('div');
 canvas.id = 'stillTreeCanvas';
 canvas.style.position = 'relative';
 container.appendChild(canvas);
 injectStyles();
 return canvas;
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

export function createNodes(container, nodesData, positions) {
  const nodes = [];
  for (const nodeData of nodesData) {
    const node = createNode(container, nodeData);
    const pos = positions.find(p => p.id === nodeData.id);
    if (pos) {
      node.style.position = 'absolute';
      node.style.left = `${pos.x}px`;
      node.style.top = `${pos.y}px`;
    }
    nodes.push(node);
  }

  return { nodes };
}

export function createEdge(svgEl, x1, y1, x2, y2) {
  const midY = (y1 + y2) / 2;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${x1},${y1} C ${x1},${midY} ${x2},${midY} ${x2},${y2}`);
  path.classList.add('skillTree-edge');
  svgEl.appendChild(path);
  return path;
}

export function createEdges(svgEl, edges, positions, nodeWidth, nodeHeight) {
  edges.forEach(edge => {
    const sourcePos = positions.find(p => p.id === edge.fromId);
    const targetPos = positions.find(p => p.id === edge.toId);
    if (!sourcePos || !targetPos) return;
    const { x1, y1, x2, y2 } = computeEdgePoints(sourcePos, targetPos, nodeWidth, nodeHeight);
    createEdge(svgEl, x1, y1, x2, y2);
  });
}

function createPopup(container, nodeData, side) {
  const popup = document.createElement('div');
  popup.className = `skillTree-popup popup-${side}`;
  popup.dataset.forId = nodeData.id;

  const popupDomain   = document.createElement('div');
  popupDomain.className = 'popup-domain';
  popupDomain.textContent = `${nodeData.domain} — ${nodeData.display}`;

  const popupName = document.createElement('div');
  popupName.className = 'popup-name';
  popupName.textContent = nodeData.name;

  const popupDesc = document.createElement('div');
  popupDesc.className = 'popup-description';
  popupDesc.textContent = nodeData.description;

  const popupTags = document.createElement('div');
  popupTags.className = 'popup-tags';
  nodeData.tags.forEach(tag => {
    const span = document.createElement('span');
    span.textContent = tag;
    popupTags.appendChild(span);
  });

  const popupLink = document.createElement('a');
  popupLink.className = 'popup-link';
  popupLink.href = nodeData.link;
  popupLink.target = '_blank';
  popupLink.textContent = 'View Course';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'popup-close';
  closeBtn.textContent = '×';

  popup.appendChild(closeBtn);
  popup.appendChild(popupDomain);
  popup.appendChild(popupName);
  popup.appendChild(popupDesc);
  popup.appendChild(popupTags);
  popup.appendChild(popupLink);

  container.appendChild(popup);
  return popup;
}

export function createPopups(container, courses, positions, canvasWidth) {
  const popups = [];
  courses.forEach(nodeData => {
    const pos = positions.find(p => p.id === nodeData.id);
    const side = computePopupSide(pos.x, canvasWidth);
    const popup = createPopup(container, nodeData, side);
    popups.push(popup);
  });
  return { popups };
}

// Rudimentary CSS Configuration
function injectStyles() {
  if (document.getElementById('skillTree-styles')) return;

  const style = document.createElement('style');
  style.id = 'skillTree-styles';
  style.textContent = `
    .skillTreeContainer {
      border: 4px blue solid;
      position: relative;
      width: 100%;
      height: 100vh;
      overflow: scroll;
    }

    .skillTree-node {
      border: 4px red solid;
      width: 200px;
      height: 100px;
      box-sizing: border-box;
    }

    .skillTree-edge {
      stroke: green;
      stroke-width: 10px;
      fill: none;
    }
    .skillTree-popup {
      display: none;
      border: 4px red solid;
    }

    .skillTree-popup.visible {
      display: block;
    }
  `;
  document.head.appendChild(style);
}
