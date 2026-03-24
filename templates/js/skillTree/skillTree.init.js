// skillTree.init.js

import { getSkillTreeContainer } from './skillTree.dom.js';
import { computeNodePositions, inferEdges } from './skillTree.engine.js';
import { initContainer, createNodes, createEdges, createPopups } from './skillTree.render.js';

export async function initSkillTree() {
  try {
    const response = await fetch('http://192.168.0.218:7000/courses.json');
    const data = await response.json();
    const courses = data.courses;

    const NODE_WIDTH  = 300;
    const NODE_HEIGHT = 150;
    const GAP_X = 60;
    const GAP_Y = 80;

    const container = getSkillTreeContainer();
    const positions = computeNodePositions(courses, NODE_WIDTH, NODE_HEIGHT, GAP_X, GAP_Y);
    const edges = inferEdges(courses);

    const canvas = initContainer(container);

    // Set canvas dimensions before appending anything
    const canvasWidth  = Math.max(...positions.map(p => p.x)) + NODE_WIDTH  + GAP_X * 2;
    const canvasHeight = Math.max(...positions.map(p => p.y)) + NODE_HEIGHT + GAP_Y * 2;
    canvas.style.width  = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.id = 'skillTreeEdges';
    svgEl.style.position = 'absolute';
    svgEl.style.top = '0';
    svgEl.style.left = '0';
    svgEl.style.width = '100%';
    svgEl.style.height = '100%';
    svgEl.style.overflow = 'visible';
    svgEl.style.pointerEvents = 'none';
    canvas.appendChild(svgEl);

    createNodes(canvas, courses, positions);
    createEdges(svgEl, edges, positions, NODE_WIDTH, NODE_HEIGHT);
    createPopups(canvas, courses, positions, canvasWidth);

  } catch (err) {
    console.warn('initSkillTree: failed to initialize', err);
  }
}

initSkillTree();
