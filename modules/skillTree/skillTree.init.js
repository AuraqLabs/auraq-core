// skillTree.init.js

import { getSkillTreeContainer, setCanvasDimensions } from './skillTree.dom.js';
import { computeNodeCoords, inferEdges, computeCanvasDimensions } from './skillTree.engine.js';
import { initContainer, createFilters, createNodes, createEdges, createPopups } from './skillTree.render.js';
import { createSkillTreeState } from './skillTree.state.js';
import { createSkillTreeController } from './skillTree.controller.js';

export async function initSkillTree() {
  try {
    const response = await fetch('https://dev.auraq.org/data/courses.json');
    const data = await response.json();
    const courses = data.courses;

    const NODE_WIDTH  = 300;
    const NODE_HEIGHT = 150;
    const GAP_X = 60;
    const GAP_Y = 80;

    const container = getSkillTreeContainer();
    const positions = computeNodeCoords(courses, NODE_WIDTH, NODE_HEIGHT, GAP_X, GAP_Y);
    const edges = inferEdges(courses);
    const state = createSkillTreeState();

    const canvas = initContainer(container);
    const { canvasWidth, canvasHeight } = computeCanvasDimensions(positions, NODE_WIDTH, NODE_HEIGHT, GAP_X, GAP_Y);
    setCanvasDimensions(canvas, canvasWidth, canvasHeight);
    state.canvasWidth = canvasWidth;

    const domains = [...new Set(courses.map(c => c.domain))];
    const { filters } = createFilters(container, domains);

    const { nodes } = createNodes(canvas, courses, positions);

    createEdges(canvas, edges, positions, NODE_WIDTH, NODE_HEIGHT);
    const { popups } = createPopups(canvas, courses, positions, canvasWidth);

    const controller = createSkillTreeController(state, nodes, popups, filters);
    controller.bindAll();

  } catch (err) {
    console.warn('initSkillTree: failed to initialize', err);
  }
}
