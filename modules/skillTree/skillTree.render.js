// skillTree.render.js

// TODO: Report card - render a .skillTree-reportCard below popup for each entry in nodeData.report[], linking to lab reports or demos. Blocks: exams. see design.md for popup positioning reference.

/**
 * skillTree.render.js
 * Owns DOM creation and visual updates for tree, nodes and edges.
 * Exports:
 *   - createToggleButtons(container): { accordionBtn, treeBtn }
 *   - initContainer(container): Element
 *   - createFilters(container, domains): { filterBar, filters[] }
 *   - createNodes(container, nodesData, positions): { nodes[] }
 *   - createEdge(canvas, x1, y1, x2, y2): Element
 *   - createEdges(canvas, edges, positions, nodeWidth, nodeHeight): void
 *   - createPopups(container, courses, positions, canvasWidth): { popups[] }
 */

import {
  setNodePosition,
  getViewportWidth
} from './skillTree.dom.js';

import {
  computeEdgePoints,
  computePopupSide
} from './skillTree.engine.js';

const DOMAIN_COLORS = {
  Testing:  '#149B48',
  Security: '#e05252',
  Frontend: '#FF9124',
  Cloud:    '#38bdf8'
};

// --- View Toggle --------------------------------------------------------------

/**
 * Creates the Accordion / Tree view-toggle button pair, prepends it to
 * [data-skills], and returns handles to both buttons so init.js can bind
 * click events. Calls injectStyles() so toggle buttons are styled immediately
 * at page load without waiting for the first Tree click.
 *
 * @param   {Element} container — the [data-skills] element
 * @returns {{ accordionBtn: HTMLButtonElement, treeBtn: HTMLButtonElement }}
 */
export function createToggleButtons(container) {
  injectStyles();

  const group = document.createElement('div');
  group.className = 'skillTree-toggles';

  const accordionBtn = document.createElement('button');
  accordionBtn.type = 'button';
  accordionBtn.className = 'skillTree-toggle-btn';
  accordionBtn.textContent = 'Accordion';
  accordionBtn.dataset.active = '';

  const treeBtn = document.createElement('button');
  treeBtn.type = 'button';
  treeBtn.className = 'skillTree-toggle-btn';
  treeBtn.textContent = 'Tree';

  accordionBtn.addEventListener('click', () => {
    accordionBtn.dataset.active = '';
    delete treeBtn.dataset.active;
  });

  treeBtn.addEventListener('click', () => {
    treeBtn.dataset.active = '';
    delete accordionBtn.dataset.active;
  });

  group.appendChild(accordionBtn);
  group.appendChild(treeBtn);
  container.prepend(group);

  return { accordionBtn, treeBtn };
}

// --- Tree ---------------------------------------------------------------------

export function initContainer(container) {
  container.classList.add('skillTreeContainer');
  const canvas = document.createElement('div');
  canvas.id = 'skillTreeCanvas';
  canvas.style.position = 'relative';
  container.appendChild(canvas);
  injectStyles();
  return canvas;
}

export function createFilters(container, domains) {
  const filterBar = document.createElement('div');
  filterBar.className = 'skillTree-filterBar';
  container.appendChild(filterBar);

  const filters = [];
  for (let i = 0; i < domains.length; i++) {
    const filterButton = document.createElement('button');
    filterButton.className = 'skillTree-filterButton';
    filterButton.dataset.domain = domains[i];
    filterButton.textContent = domains[i];
    filterButton.style.setProperty('--nc', DOMAIN_COLORS[domains[i]] ?? '#FF9124');
    filterBar.appendChild(filterButton);
    filters.push(filterButton);
  }

  return { filterBar, filters };
}

/**
 * @param   {Element} container
 * @param   {object}  nodeData
 * @returns {Element}
 */
function createNode(container, nodeData) {
  const node = document.createElement('div');
  node.className = `skillTree-node domain-${nodeData.domain}`;
  node.dataset.id = nodeData.id;
  node.dataset.domain = nodeData.domain;
  node.dataset.institute = nodeData.institute;
  node.dataset.year = nodeData.year;
  node.style.setProperty('--nc', DOMAIN_COLORS[nodeData.domain] ?? '#FF9124');
  container.appendChild(node);

  const inner = document.createElement('div');
  inner.className = 'node-inner';

  const nodeTop = document.createElement('div');
  nodeTop.className = 'node-top';

  const nodeDomain = document.createElement('div');
  nodeDomain.className = 'nodeDomain';
  nodeDomain.textContent = nodeData.domain;

  const nodeNum = document.createElement('div');
  nodeNum.className = 'node-num';
  nodeNum.textContent = nodeData.id;

  nodeTop.appendChild(nodeDomain);
  nodeTop.appendChild(nodeNum);

  const nodeDisplay = document.createElement('div');
  nodeDisplay.className = 'nodeDisplay';
  nodeDisplay.textContent = nodeData.display;

  const nodeMeta = document.createElement('div');
  nodeMeta.className = 'node-meta';
  nodeMeta.textContent = `${nodeData.institute} · ${nodeData.year}`;

  inner.appendChild(nodeTop);
  inner.appendChild(nodeDisplay);
  inner.appendChild(nodeMeta);
  node.appendChild(inner);

  return node;
}

export function createNodes(container, nodesData, positions) {
  const nodes = [];
  for (const nodeData of nodesData) {
    const node = createNode(container, nodeData);
    const pos = positions.find(p => p.id === nodeData.id);
    if (pos) { setNodePosition(node, pos.x, pos.y); }
    nodes.push(node);
  }
  return { nodes };
}

export function createEdge(canvas, x1, y1, x2, y2) {
  const midY = (y1 + y2) / 2;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${x1},${y1} C ${x1},${midY} ${x2},${midY} ${x2},${y2}`);
  path.classList.add('skillTree-edge');
  canvas.appendChild(path);
  return path;
}

export function createEdges(canvas, edges, positions, nodeWidth, nodeHeight) {
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.id = 'skillTreeEdges';
  svgEl.style.position = 'absolute';
  svgEl.style.top = '0';
  svgEl.style.left = '0';
  svgEl.style.width = '100%';
  svgEl.style.height = '100%';
  svgEl.style.overflow = 'visible';
  svgEl.style.pointerEvents = 'none';
  svgEl.style.zIndex = '0';
  canvas.appendChild(svgEl);

  edges.forEach(edge => {
    const sourcePos = positions.find(p => p.id === edge.fromId);
    const targetPos = positions.find(p => p.id === edge.toId);
    if (!sourcePos || !targetPos) return;
    const { x1, y1, x2, y2 } = computeEdgePoints(sourcePos, targetPos, nodeWidth, nodeHeight);
    createEdge(svgEl, x1, y1, x2, y2);
  });
}

/**
 * @param   {Element} container
 * @param   {object}  nodeData
 * @param   {string}  side     — 'left' | 'right' | 'below'
 * @returns {Element}
 */
function createPopup(container, nodeData, side) {
  const popup = document.createElement('div');
  popup.className = `skillTree-popup popup-${side}`;
  popup.dataset.forId = nodeData.id;
  popup.style.setProperty('--nc', DOMAIN_COLORS[nodeData.domain] ?? '#FF9124');

  const popupDomain = document.createElement('div');
  popupDomain.className = 'popup-domain';
  popupDomain.textContent = nodeData.domain;

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
    const side = computePopupSide(pos.x, canvasWidth, getViewportWidth());
    const popup = createPopup(container, nodeData, side);
    popups.push(popup);
  });
  return { popups };
}

// --- Styles -------------------------------------------------------------------

function injectStyles() {
  if (document.getElementById('skillTree-styles')) return;
  const style = document.createElement('style');
  style.id = 'skillTree-styles';
  style.textContent = `
@layer auraq.skillTree {

  [data-skills] {
    width: 100%;
  }

  /* -- View Toggle -- */

  .skillTree-toggles {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .skillTree-toggle-btn {
    cursor: pointer;
    padding: 6px 18px;
    border: none;
    border-radius: 4px;
    font-family: var(--font-heading-alt, 'Space Grotesk', sans-serif);
    font-size: var(--fs-meta);
    letter-spacing: 0.04em;
    transition: background 120ms ease, color 120ms ease;

    background: var(--skillTree-toggle-bg, var(--surface-color-2, #272727));
    color: var(--text-color, #EFF9F0);
  }

  .skillTree-toggle-btn[data-active] {
    background: var(--skillTree-filter-active-bg, var(--theme-color, #FF9124));
    color: var(--bg-color, #140A0A);
  }

  /* -- Container -- */

  .skillTreeContainer {
    position: relative;
    width: 100%;
    height: 100vh;
    padding: 20px;
    overflow: auto;
    scrollbar-width: none;
    cursor: grab;
    touch-action: none;
    user-select: none;
  }
  .skillTreeContainer:active { cursor: grabbing; }
  .skillTreeContainer::-webkit-scrollbar { display: none; }

  #skillTreeCanvas {
    position: relative;
  }

  /* -- Nodes -- */

  .skillTree-node {
    position: absolute;
    width: 300px;
    height: 150px;
    cursor: pointer;
    overflow: visible;
    font-family: var(--font-display, 'Aldrich', sans-serif);
    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 0.22s ease,
                border-color 0.2s ease,
                opacity 0.3s ease;

    background:    var(--skillTree-node-bg,     var(--surface-color, #1E1E1E));
    border:    1px solid var(--skillTree-node-border, color-mix(in srgb, var(--text-color, #EFF9F0) 7%, transparent));
    border-radius: var(--skillTree-node-radius, 10px);
  }
  .skillTree-node::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0; width: 0px;
    background: var(--nc, #FF9124);
    border-radius: 10px 0 0 10px;
  }
  .skillTree-node::after {
    content: '';
    position: absolute;
    inset: -5px;
    border-radius: 14px;
    border: 1.5px solid var(--nc, #FF9124);
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }
  .skillTree-node.active::after { opacity: 0.5; }
  .skillTree-node.active {
    border-color: var(--nc, #FF9124) !important;
    box-shadow: 0 0 0 1px var(--nc, #FF9124), 0 12px 36px rgba(0, 0, 0, 0.6) !important;
    z-index: 6;
  }
  .skillTree-node:hover {
    transform: translateY(-3px) scale(1.025);
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.6),
                0 0 0 1px var(--nc, rgba(255, 145, 36, 0.25));
    border-color: var(--nc, color-mix(in srgb, #FF9124 50%, transparent));
    z-index: 5;
  }
  .skillTree-node.dimmed {
    opacity: 0.07;
    transform: scale(0.94);
    pointer-events: none;
  }

  .node-inner {
    padding: 11px 13px 11px 17px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .node-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .nodeDomain {
    font-family: var(--font-display);
    font-size: var(--fs-micro);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    font-weight: 600;
    color: var(--nc, #FF9124);
    line-height: 1;
  }
  .node-num {
    font-family: var(--font-mono, 'Space Mono', monospace);
    font-size: var(--fs-micro);
    color: color-mix(in srgb, var(--text-color, #EFF9F0) 20%, transparent);
  }
  .nodeDisplay {
    font-family: var(--font-primary, 'Exo 2', sans-serif);
    font-size: var(--fs-micro);
    font-weight: 500;
    line-height: 1.32;
    color: var(--text-color, #EFF9F0);
    flex: 1;
    margin: 5px 0 4px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .node-meta {
    font-family: var(--font-heading-alt, 'Space Grotesk', sans-serif);
    font-size: var(--fs-micro);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--text-color, #EFF9F0) 20%, transparent);
  }

  /* -- Edges -- */

  .skillTree-edge {
    stroke: var(--skillTree-edge-color, color-mix(in srgb, var(--text-color, #EFF9F0) 10%, transparent));
    stroke-width: 1.5px;
    fill: none;
  }

  /* -- Popup -- */

  .skillTree-popup {
    position: absolute;
    width: 284px;
    border-radius: 12px;
    padding: 20px;
    z-index: 20;
    display: none;

    background:    var(--skillTree-popup-bg,     var(--surface-color, #1E1E1E));
    border:    1px solid var(--skillTree-popup-border, color-mix(in srgb, var(--text-color, #EFF9F0) 13%, transparent));
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.75),
                0 0 0 1px color-mix(in srgb, var(--text-color, #EFF9F0) 4%, transparent);
  }
  .skillTree-popup.visible {
    display: block;
    animation: skillTreePopIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @keyframes skillTreePopIn {
    from { opacity: 0; transform: scale(0.88) translateY(6px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);   }
  }
  .popup-domain {
    color: var(--nc, #FF9124);
    line-height: 1;
    font-family: var(--font-heading-alt, 'Space Grotesk', sans-serif);
    font-size: var(--fs-micro);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    font-weight: 900;
  }
  .popup-name {
    font-family: var(--font-heading, 'Faustina', serif);
    font-size: var(--fs-base);
    font-weight: 700;
    line-height: 1.35;
    margin-bottom: 3px;
  }
  .popup-description {
    font-size: var(--fs-meta);
    line-height: 1.65;
    border-bottom: 2px solid var(--nc, #FF9124);
    padding-bottom: 10px;
    margin-bottom: 13px;
    color: color-mix(in srgb, var(--text-color, #EFF9F0) 52%, transparent);
  }
  .popup-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 12px;
  }
  .popup-tags span {
    font-family: var(--font-primary, 'Exo 2', sans-serif);
    font-size: var(--fs-micro);
    font-weight: 500;
    padding: 2px 7px;
    border-radius: 3px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border: 1px solid var(--nc, #FF9124);
    color: var(--nc, #FF9124);
    background: color-mix(in srgb, var(--nc, var(--theme-color, #FF9124)) 8%, transparent);
  }
  .popup-link {
    font-family: var(--font-heading-alt, 'Space Grotesk', sans-serif);
    font-size: var(--fs-micro);
    letter-spacing: 0.14em;
    text-decoration: none;
    text-transform: uppercase;
    color: var(--text-color, #EFF9F0);
    opacity: 0.5;
    transition: opacity 0.15s;
    display: inline-block;
  }
  .popup-link:hover { opacity: 1; }
  .popup-close {
    font-family: var(--font-heading-alt, 'Space Grotesk', sans-serif);
    font-size: var(--fs-micro);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    float: right;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.15s;
    padding: 0;
    color: color-mix(in srgb, var(--text-color, #EFF9F0) 20%, transparent);
  }
  .popup-close:hover { color: var(--text-color, #EFF9F0); }

  /* -- Filter Bar -- */

  .skillTree-filterBar {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
    padding: 12px 0;
  }
  .skillTree-filterButton {
    padding: 5px 13px;
    border-radius: 100px;
    background: transparent;
    cursor: pointer;
    font-family: var(--font-heading-alt, 'Space Grotesk', sans-serif);
    font-size: var(--fs-micro);
    letter-spacing: 0.04em;
    transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
    border: 1px solid color-mix(in srgb, var(--text-color, #EFF9F0) 13%, transparent);
    color: color-mix(in srgb, var(--text-color, #EFF9F0) 52%, transparent);
  }
  .skillTree-filterButton:hover {
    border-color: color-mix(in srgb, var(--text-color, #EFF9F0) 30%, transparent);
    color: var(--text-color, #EFF9F0);
  }
  .skillTree-filterButton.active {
    border-color: transparent;
    font-weight: 600;
    background: var(--skillTree-filter-active-bg, var(--nc, #FF9124));
    color: var(--bg-color, #0c0808);
  }

}
  `;
  document.head.appendChild(style);
}
