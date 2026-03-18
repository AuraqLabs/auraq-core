import { getSkillTreeContainer } from './skillTree.dom.js';
import { computeNodePositions, inferEdges } from './skillTree.engine.js';
import { initContainer, createNodes, createEdges, createPopups } from './skillTree.render.js';

export async function initSkillTree() {
  const response = await fetch('http://localhost:7000/courses.json');
  const data = await response.json();
  const courses = data.courses;

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 100;
  const GAP_X = 60;
  const GAP_Y = 80;

  const container = getSkillTreeContainer();
  const positions = computeNodePositions(courses, NODE_WIDTH, NODE_HEIGHT, GAP_X, GAP_Y);
  const edges = inferEdges(courses);

  initContainer(container);

  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.id = 'skillTreeEdges';
  container.appendChild(svgEl);

  createNodes(container, courses, positions);
  createEdges(svgEl, edges, positions, NODE_WIDTH, NODE_HEIGHT);
  createPopups(container, courses, positions, container.offsetWidth);
}

initSkillTree();
