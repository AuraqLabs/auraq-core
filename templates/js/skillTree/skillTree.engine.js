// skillTree.engine.js

/**
 * skillTree.engine.js
 * Owns all coordinate mapping, math, loops and pure geometry functions
 * Exports:
 *   - computeBranchIndex(courses): array
 *   - computeNodePositions(courses, nodeWidth, nodeHeight, gapX, gapY): array
 *   - computeEdgePositions(courses, nodeWidth, nodeHeight, gapX, gapY): array
 *   - inferEdges(courses): array
 *   - computeCanvasDimensions(positions, nodeWidth, nodeHeight, gapWidth, gapHeight): array
 *   - computePopupPosition(popupEl, nodeEl): String
 *   - computePopupSides(nodeX, canvasWidth): String
 */

/**
 * @param: {Array} courses
 * @returns: {Object}
 */
function computeBranchIndex (courses) {
  const branches = [...new Set(courses.map(c => c.branch))];
  const index = {};
  branches.forEach((branch, i) => index[branch] = i);
  return index;
}

/**
 * @param: {Array} courses
 * @param: {number} nodeWidth
 * @param: {number} nodeHeight
 * @param: {number} gapX
 * @param: {number} gapY
 * @returns: {number} id, {number} x, {number} y
 */
export function computeNodePositions(courses, nodeWidth, nodeHeight, gapX, gapY) {
  const branchIndex = computeBranchIndex(courses);

  // Find max branch width to space sub-columns
  const groups = {};
  courses.forEach(c => {
    const key = `${c.branch}-${c.layer}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c.id);
  });

  return courses.map(course => {
    const key = `${course.branch}-${course.layer}`;
    const group = groups[key];
    const subIndex = group.indexOf(course.id);
    const subTotal = group.length;

    // Center the sub-group within the branch column
    const branchX = branchIndex[course.branch] * (nodeWidth + gapX) * 2;
    const subOffset = (subIndex - (subTotal - 1) / 2) * (nodeWidth + gapX);

    return {
      id: course.id,
      x: branchX + subOffset,
      y: (course.layer - 1) * (nodeHeight + gapY)
    };
  });
}

/**
 * @param: {Object} sourceNode - { x, y } position of source
 * @param: {Object} targetNode - { x, y } position of target
 * @param: {number} nodeWidth
 * @param: {number} nodeHeight
 * @returns: {Object} x1, y1, x2, y2
 */
export function computeEdgePoints(sourceNode, targetNode, nodeWidth, nodeHeight){
  return {
    x1: sourceNode.x + nodeWidth / 2,
    y1: sourceNode.y + nodeHeight,
    x2: targetNode.x + nodeWidth / 2,
    y2: targetNode.y
  };
}

/**
 * which edge connects to which nodes
 * @param: {Array} courses
 * @returns: {Object[]} edges[]
 */
export function inferEdges(courses) {
  const edges = [];
  for (const course of courses) {
    const targets = courses.filter(c =>
      c.layer === course.layer + 1 &&
      c.branch === course.branch
    );
    for (const target of targets) {
      edges.push({ fromId: course.id, toId: target.id});
    }
  }
  return edges;
}

/**
 * @param: {Object} positions
 * @param: {integer} NodeWidth
 * @param: {integer} NodeHeight
 * @param: {integer} GapWidth
 * @param: {integer} Gapheight
 */
export function computeCanvasDimensions(positions, nodeWidth, nodeHeight, gapX, gapY) {
  
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x));

  const width  = maxX - minX + nodeWidth  + gapX * 2;
  const height = Math.max(...positions.map(p => p.y)) + nodeHeight + gapY * 2;
  
  const canvasWidth = `${width}px`;
  const canvasHeight = `${height}px`;

  return { canvasWidth, canvasHeight };
}

/**
 * @param: {Object} popupEl
 * @param: {Object} nodeEl
 */
export function computePopupPosition(popupEl, nodeEl) {
  const nodeLeft   = parseInt(nodeEl.style.left);
  const nodeTop    = parseInt(nodeEl.style.top);
  const nodeWidth  = nodeEl.offsetWidth || 300;
  const nodeHeight = nodeEl.offsetHeight || 150;
  const popupWidth = 300;
  const gap = 20;

  let popupEl_left = null;
  let popupEl_top = null;

  if (popupEl.classList.contains('popup-left')) {
    popupEl_left = `${nodeLeft - popupWidth - gap}px`;
    popupEl_top  = `${nodeTop}px`;
  } else if (popupEl.classList.contains('popup-right')) {
    popupEl_left = `${nodeLeft + nodeWidth + gap}px`;
    popupEl_top  = `${nodeTop}px`;
  } else {
    popupEl_left = `${nodeLeft}px`;
    popupEl_top  = `${nodeTop + nodeHeight + gap}px`;
  }
    
    const left = popupEl_left;
    const top = popupEl_top;

  return { left, top }
}

/**
 * @param: {number} nodeX
 * @param: {number} canvasWidth
 * @returns: String
 */
export function computePopupSide(nodeX, canvasWidth) {
  if (window.innerWidth <= 800) return 'below';
  return nodeX > canvasWidth / 2 ? 'left' : 'right';
}
