// skillTree.init.js

import { getSkillsContainer, getSkillNodes, setCanvasDimensions } from './skillTree.dom.js';
import { computeNodeCoords, inferEdges, computeCanvasDimensions } from './skillTree.engine.js';
import { initContainer, createFilters, createNodes, createEdges, createPopups, createToggleButtons } from './skillTree.render.js';
import { createSkillTreeState } from './skillTree.state.js';
import { createSkillTreeController } from './skillTree.controller.js';

import { createPanningState }      from 'https://cdn.auraq.org/modules/panning/panning.state.js';
import { createPanningController } from 'https://cdn.auraq.org/modules/panning/panning.controller.js';
import { bind }                    from 'https://cdn.auraq.org/modules/panning/panning.dom.js';

const NODE_WIDTH  = 300;
const NODE_HEIGHT = 150;
const GAP_X       = 60;
const GAP_Y       = 80;

const REQUIRED_ATTRS = [
  'data-skill-id',
  'data-skill-display',
  'data-skill-domain',
  'data-skill-branch',
  'data-skill-layer',
  'data-skill-institute',
  'data-skill-year',
  'data-skill-tags',
  'data-skill-link',
];

/**
 * Extracts structured course data from <details> node attributes.
 * Warns and skips nodes with missing required attributes, invalid
 * data-skill-layer, or duplicate data-skill-id values.
 * Runs lazily — called only on first Tree button click.
 *
 * @param   {Element[]} nodes
 * @returns {object[]}
 */
function extractCourses(nodes) {
  const seenIds = new Set();
  const courses = [];

  for (const node of nodes) {
    const id = node.getAttribute('data-skill-id');

    if (!id) {
      console.warn('[Auraq/SkillTree] <details> missing data-skill-id. Skipping.');
      continue;
    }

    if (seenIds.has(id)) {
      console.warn(`[Auraq/SkillTree] Duplicate data-skill-id "${id}". Skipping.`);
      continue;
    }

    const missing = REQUIRED_ATTRS.filter(attr => !node.hasAttribute(attr));
    if (missing.length > 0) {
      console.warn(`[Auraq/SkillTree] Skill "${id}" missing [${missing.join(', ')}]. Skipping tree node.`);
      continue;
    }

    const layer = parseInt(node.getAttribute('data-skill-layer'), 10);
    if (!Number.isInteger(layer) || layer < 1) {
      console.warn(`[Auraq/SkillTree] Skill "${id}" has invalid data-skill-layer "${node.getAttribute('data-skill-layer')}". Skipping tree node.`);
      continue;
    }

    seenIds.add(id);

    courses.push({
      id,
      display:     node.getAttribute('data-skill-display'),
      domain:      node.getAttribute('data-skill-domain'),
      branch:      node.getAttribute('data-skill-branch'),
      layer,
      institute:   node.getAttribute('data-skill-institute'),
      year:        parseInt(node.getAttribute('data-skill-year'), 10),
      tags:        node.getAttribute('data-skill-tags').split(',').map(t => t.trim()),
      link:        node.getAttribute('data-skill-link'),
      name:        node.querySelector('summary')?.textContent.trim() ?? '',
      description: node.querySelector('p')?.textContent.trim() ?? '',
    });
  }

  return courses;
}

/**
 * Runs the full tree-building pipeline inside treeContainer.
 * Wires panning manually since initPanning() ran at page load
 * before treeContainer existed.
 *
 * @param {Element}  treeContainer — the .skillTree-tree div
 * @param {object[]} courses       — extracted from <details> attributes
 */
function buildTree(treeContainer, courses) {
  const positions = computeNodeCoords(courses, NODE_WIDTH, NODE_HEIGHT, GAP_X, GAP_Y);
  const edges     = inferEdges(courses);
  const state     = createSkillTreeState();

  const canvas = initContainer(treeContainer);

  // Wire panning — initPanning() already ran at page load before treeContainer
  // existed, so we use the same primitives it uses, bound to this container directly.
  // pointermove / pointerup / pointercancel bind to document, matching initPanning()'s
  // pattern so drags that leave the container boundary are still tracked correctly.
  treeContainer.setAttribute('data-panning-axis', 'xy');
  const panState      = createPanningState();
  const panController = createPanningController(treeContainer, panState, 'xy', {
    dragThreshold: 5,
    friction:      0.85,
    minVelocity:   0.02,
    momentumScale: 20
  });
  bind(treeContainer, 'pointerdown',   panController.onPointerDown);
  bind(document,      'pointermove',   panController.onPointerMove);
  bind(document,      'pointerup',     panController.onPointerUp);
  bind(document,      'pointercancel', panController.onPointerUp);

  const { canvasWidth, canvasHeight } = computeCanvasDimensions(positions, NODE_WIDTH, NODE_HEIGHT, GAP_X, GAP_Y);
  setCanvasDimensions(canvas, canvasWidth, canvasHeight);
  state.canvasWidth = canvasWidth;

  const domains     = [...new Set(courses.map(c => c.domain))];
  const { filters } = createFilters(treeContainer, domains);
  const { nodes }   = createNodes(canvas, courses, positions);

  createEdges(canvas, edges, positions, NODE_WIDTH, NODE_HEIGHT);

  const { popups } = createPopups(canvas, courses, positions, canvasWidth);
  const controller = createSkillTreeController(state, nodes, popups, filters);
  controller.bindAll();
}

/**
 * Shows the accordion (<details> nodes) and hides the tree.
 * @param {Element[]} nodes
 * @param {Element}   treeContainer
 */
function showAccordion(nodes, treeContainer) {
  for (const node of nodes) node.hidden = false;
  treeContainer.hidden = true;
}

/**
 * Hides the accordion (<details> nodes) and shows the tree.
 * @param {Element[]} nodes
 * @param {Element}   treeContainer
 */
function showTree(nodes, treeContainer) {
  for (const node of nodes) node.hidden = true;
  treeContainer.hidden = false;
}

/**
 * Initialises the Skills component.
 *
 * Reads skill data from [data-skills] > <details> attributes.
 * Injects Accordion/Tree toggle buttons into [data-skills].
 *
 * Default state:            accordion visible, tree not yet built.
 * First "Tree" click:       extracts course data from DOM, builds tree, shows tree.
 * Subsequent "Tree" clicks: shows already-built tree — no rebuild.
 * "Accordion" click:        hides tree, shows accordion.
 */
export function initSkillTree() {
  const container = getSkillsContainer();

  if (!container) {
    console.warn('[Auraq/SkillTree] No [data-skills] container found. Exiting.');
    return;
  }

  const skillNodes = getSkillNodes(container);

  if (skillNodes.length === 0) {
    console.warn('[Auraq/SkillTree] No <details> children found in [data-skills]. Exiting.');
    return;
  }

  const treeContainer = document.createElement('div');
  treeContainer.className = 'skillTree-tree';
  treeContainer.hidden = true;
  container.appendChild(treeContainer);

  const { accordionBtn, treeBtn } = createToggleButtons(container);

  let treeBuilt = false;

  treeBtn.addEventListener('click', () => {
    if (!treeBuilt) {
      const courses = extractCourses(skillNodes);
      if (courses.length === 0) {
        console.warn('[Auraq/SkillTree] No valid skill nodes to render. Tree not built.');
        return;
      }
      try {
        buildTree(treeContainer, courses);
        treeBuilt = true;
      } catch (err) {
        console.warn('[Auraq/SkillTree] Failed to build tree.', err);
        return;
      }
    }
    showTree(skillNodes, treeContainer);
  });

  accordionBtn.addEventListener('click', () => {
    showAccordion(skillNodes, treeContainer);
  });
}
