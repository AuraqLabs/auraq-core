// sectionMap.controller.js

import {
  updateThumb
} from './sectionMap.render.js';

import {
  measureTickPositions,
  getSectionOffsetTops,
  getScrollable,
  getBarRect
} from './sectionMap.dom.js';

import {
  computeSectionNorms,
  computeThumbPx,
  normalizeScroll,
  createTrackingLoop,
  createLerpScroller,
  createMomentumScroller,
  animateScrollTo,
  getSectionScrollTarget,
  getNormalizedPositionFromPointer
} from './sectionMap.engine.js';

export function createSectionMapController(container, sections, bar, ticks, thumb) {
  let cancelAnimation = null;
  let isDragging      = false;
  let hasMoved        = false;
  let lastPointerX    = 0;
  let lastPointerT    = 0;
  let pointerVelX     = 0;
  
  // array of ticks' positions
  let tickPositions = measureTickPositions(ticks);
  // array of sections' position in normalized 0-1 scale
  let sectionNorms  = computeSectionNorms(getSectionOffsetTops(sections), getScrollable(container));
  
  new ResizeObserver(() => {
    tickPositions = measureTickPositions(ticks);
    sectionNorms  = computeSectionNorms(getSectionOffsetTops(sections), getScrollable(container));
    const normalized = normalizeScroll(container);
    updateThumb(thumb, computeThumbPx(normalized, tickPositions, sectionNorms), normalized);
  }).observe(bar); //Upon the resize of "bar", reposition ticks, recompute section normals and update thumb

  // Keeps thumb in sync as page scrolls
  createTrackingLoop(container, (normalized) => {
    updateThumb(thumb, computeThumbPx(normalized, tickPositions, sectionNorms), normalized);
  });

  const normalized = normalizeScroll(container);
  updateThumb(thumb, computeThumbPx(normalized, tickPositions, sectionNorms) , normalized);

  const lerpScroller     = createLerpScroller(container);
  const momentumScroller = createMomentumScroller(container);

  function cancelPendingAnimation() {
    if (cancelAnimation) {
      cancelAnimation();
      cancelAnimation = null;
    }
  }

  function scrollLerp(normalizedPosition) {
    cancelPendingAnimation();
    const target = getSectionScrollTarget(sections, normalizedPosition, sectionNorms);
    lerpScroller.setTarget(target);
  }

  function scrollAnimated(normalizedPosition) {
    lerpScroller.cancel();
    momentumScroller.cancel();
    cancelPendingAnimation();
    const target = getSectionScrollTarget(sections, normalizedPosition, sectionNorms);
    cancelAnimation = animateScrollTo(container, target);
  }

  function cancelAll() {
    lerpScroller.cancel();
    momentumScroller.cancel();
    cancelPendingAnimation();
  }

  bar._cancelSectionMapAnimation = cancelAll;

  container.addEventListener('pointerdown', cancelAll, { passive: true });

  bar.addEventListener('pointerdown', (e) => {
    isDragging   = true;
    hasMoved     = false;
    lastPointerX = e.clientX;
    lastPointerT = performance.now();
    pointerVelX  = 0;
    bar.setPointerCapture(e.pointerId);
    e.stopPropagation();
  });

  bar.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    hasMoved = true;

    const now = performance.now();
    const dt  = now - lastPointerT;
    if (dt > 0) pointerVelX = (e.clientX - lastPointerX) / dt;
    lastPointerX = e.clientX;
    lastPointerT = now;

    const normalized = getNormalizedPositionFromPointer(bar, e.clientX, tickPositions, sectionNorms);
    scrollLerp(normalized);
  });

  bar.addEventListener('pointerup', (e) => {
    if (!hasMoved) {
      const normalized = getNormalizedPositionFromPointer(bar, e.clientX, tickPositions, sectionNorms);
      scrollAnimated(normalized);
    } else {
      lerpScroller.cancel();
      cancelPendingAnimation();
      const barWidth   = getBarRect(bar).width;
      const scrollable = getScrollable(container);
      const scale      = scrollable / barWidth * 16;
      momentumScroller.kick(pointerVelX * scale);
    }
    isDragging = false;
    hasMoved   = false;
  });

  bar.addEventListener('pointercancel', () => {
    cancelAll();
    isDragging = false;
    hasMoved   = false;
  });
}
