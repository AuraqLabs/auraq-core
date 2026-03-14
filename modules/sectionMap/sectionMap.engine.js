// sectionMap.engine.js

/**
 * sectionMap.engine.js
 * Owns all scroll math, coordinate mapping, rAF loops, and pure
 * goemetry functions for the sectionMap module.
 * Exports:
 *   - computeSectionNorms(offsetTops, scrollable): number[]
 *   - computeThumbPx(normalizedPosition, tickPositions, sectionNorms): number
 *   - normalizeScroll(container): number
 *   - createTrackingLoop(container, onUpdate): () => void
 *   - createLerpScroller(container): { setTarget, cancel }
 *   - createMomentumScroller(container): { kick, cancel }
 *   - animateScrollTo(container, targetScrollTop): () => void
 *   - getSectionScrollTarget(sections, normalizedPosition, sectionNorms): number
 *   - getNormalizedPositionFromPointer(bar, pointerX, tickPositions, sectionNorms): number
 */

import {
  getScrollTop,
  getScrollHeight,
  getClientHeight,
  setScrollTop,
  getSectionOffsetTop,
  getBarRect
} from './sectionMap.dom.js';

const DURATION = 380; // ms — within design system panel range (300–450ms)

/**
 * Approximates cubic-bezier(0.22, 1, 0.36, 1) from the design system.
 * @param {number} t — 0 to 1
 * Returns: number
 */
function easeOut(t) {
  return 1 - Math.pow(2, -10 * t);
}

// |--- Pure geometry ---|

/**
 * Maps each section's offsetTop to its normalized scroll position (0–1)
 * @param {number[]} offsetTops — offsetTop of each section in px
 * @param {number}   scrollable — container.scrollHeight - container.clientHeight
 * @returns: number[]
 */
export function computeSectionNorms(offsetTops, scrollable) {
  if (scrollable <= 0) return offsetTops.map(() => 0);
  return offsetTops.map(top => Math.min(1, top / scrollable));
}

/**
 * Returns the pixel X position, used for thumb centre
 * @param {number}   normalizedPosition — 0 (top) to 1 (bottom)
 * @param {number[]} tickPositions — measured centre X of each tick in px
 * @param {number[]} sectionNorms  — normalized scroll position of each section
 * @returns: number — pixel X of thumb centre
 */
export function computeThumbPx(normalizedPosition, tickPositions, sectionNorms) {
  const n = sectionNorms.length;

  if (normalizedPosition <= sectionNorms[0])      return tickPositions[0];
  if (normalizedPosition >= sectionNorms[n - 1])  return tickPositions[n - 1];

  for (let i = 0; i < n - 1; i++) {
    if (normalizedPosition <= sectionNorms[i + 1]) {
      const segmentProgress =
        (normalizedPosition - sectionNorms[i]) /
        (sectionNorms[i + 1] - sectionNorms[i]);
      return tickPositions[i] + segmentProgress * (tickPositions[i + 1] - tickPositions[i]);
    }
  }

  return tickPositions[n - 1];
}

//|-- Scroll math ---|

/**
 * Returns the scroll position as a normalized 0–1 value
 * @param {Element} container
 * @returns: number
 */
export function normalizeScroll(container) {
  const scrollable = getScrollHeight(container) - getClientHeight(container);
  if (scrollable <= 0) return 0;
  return Math.min(1, Math.max(0, getScrollTop(container) / scrollable));
}

/**
 * Polls scrollTop every frame via rAF, calls onUpdate upon change
 * Avoids "scroll-event -> DOM-mutation", firefox scroll-linked warning
 * @param {Element}  container
 * @param {Function} onUpdate — called with the new normalized position (0–1)
 *                              whenever scrollTop changes
 * @returns: () => void — stop function; call to cancel the loop
 */
export function createTrackingLoop(container, onUpdate) {
  let lastScrollTop = -1;
  let frameId = null;
  let stopped = false;

  function tick() {
    if (stopped) return;

    const current = getScrollTop(container);
    if (current !== lastScrollTop) {
      lastScrollTop = current;
      onUpdate(normalizeScroll(container));
    }

    frameId = requestAnimationFrame(tick);
  }

  frameId = requestAnimationFrame(tick);

  return function stop() {
	stopped = true;
    if (frameId !== null) cancelAnimationFrame(frameId);
  };
}

/**
 * Animates scrollTop to targetScrollTop
 * @param {Element} container
 * @param {number}  targetScrollTop
 * @returns: () => void — cancel function; call to abort mid-animation
 */
export function animateScrollTo(container, targetScrollTop) {
  const startScrollTop = getScrollTop(container);
  const delta = targetScrollTop - startScrollTop;
  const startTime = performance.now();
  let frameId = null;
  let cancelled = false;

  function step(now) {
    if (cancelled) return;

    const elapsed = now - startTime;
    const t = Math.min(elapsed / DURATION, 1);
    const easedT = easeOut(t);

    setScrollTop(container, startScrollTop + delta * easedT);

    if (t < 1) {
      frameId = requestAnimationFrame(step);
    }
  }

  frameId = requestAnimationFrame(step);

  return function cancel() {
    cancelled = true;
    if (frameId !== null) cancelAnimationFrame(frameId);
  };
}

/**
 * Returns a scroller that tracks a moving target via lerp on each tick
 * Gives a natural ease-out feel, without time-based animation feedback
 * @param {Element} container
 * @returns: { setTarget(value: number): void, cancel(): void }
 *   - setTarget — call on every pointermove with the new desired scrollTop
 *   - cancel    — stops the loop without snapping (e.g. on pointercancel)
 */
export function createLerpScroller(container) {
  const LERP_FACTOR  = 0.14; // fraction of remaining distance per frame
  const SETTLE_DELTA = 0.5;  // px — snap to target when this close

  let target  = null;
  let frameId = null;

  function tick() {
    if (target === null) return;

    const current = getScrollTop(container);
    const delta   = target - current;

    if (Math.abs(delta) < SETTLE_DELTA) {
      setScrollTop(container, target);
      target  = null;
      frameId = null;
      return;
    }

    setScrollTop(container, current + delta * LERP_FACTOR);
    frameId = requestAnimationFrame(tick);
  }

  return {
    setTarget(value) {
      target = value;
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(tick);
    },
    cancel() {
      target  = null;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    }
  };
}

/**
 * createMomentumScroller(container)
 * Applies velocity-based momentum to scrollTop after drag release
 * @param {Element} container
 * @returns: { kick(velocity: number): void, cancel(): void }
 *   - kick   — start momentum with the given initial velocity (scrollTop px/frame)
 *   - cancel — stop immediately
 */
export function createMomentumScroller(container) {
  const friction    = 0.85;
  const minVelocity = 0.3; // when px/frame — stop below this

  let velocity = 0;
  let frameId  = null;

  function tick() {
    velocity *= friction;

    if (Math.abs(velocity) < minVelocity) {
      velocity = 0;
      frameId  = null;
      return;
    }

    setScrollTop(container, getScrollTop(container) + velocity);
    frameId = requestAnimationFrame(tick);
  }

  return {
    kick(initialVelocity) {
      velocity = initialVelocity;
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(tick);
    },
    cancel() {
      velocity = 0;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    }
  };
}

/**
 * getSectionScrollTarget(sections, normalizedPosition, sectionNorms)
 * "Nearest Neighbor Search" to find target for animateScrollTo
 * @param {Element[]} sections
 * @param {number}    normalizedPosition — 0 to 1
 * @param {number[]}  sectionNorms — normalized scroll position of each section
 * @returns: number — scrollTop target
 */
export function getSectionScrollTarget(sections, normalizedPosition, sectionNorms) {
  let closestIndex    = 0;
  let closestDistance = Infinity;

  for (let i = 0; i < sectionNorms.length; i++) {
    const distance = Math.abs(sectionNorms[i] - normalizedPosition);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex    = i;
    }
  }

  return getSectionOffsetTop(sections[closestIndex]);
}

/**
 * getNormalizedPositionFromPointer(bar, pointerX, tickPositions, sectionNorms)
 * Inverse of computeThumbPx — maps a pixel position on bar to normalized
 * @param {Element}  bar       — the pill bar element
 * @param {number}   pointerX      — e.clientX from pointer event
 * @param {number[]} tickPositions — measured centre X of each tick in px
 * @param {number[]} sectionNorms  — normalized scroll position of each section
 * @Returns: number — 0 to 1, clamped
 */
export function getNormalizedPositionFromPointer(bar, pointerX, tickPositions, sectionNorms) {
  const rect   = getBarRect(bar);
  const localX = pointerX - rect.left;
  const n      = tickPositions.length;

  if (localX <= tickPositions[0])      return sectionNorms[0];
  if (localX >= tickPositions[n - 1])  return sectionNorms[n - 1];

  for (let i = 0; i < n - 1; i++) {
    if (localX <= tickPositions[i + 1]) {
      const segmentProgress =
        (localX - tickPositions[i]) /
        (tickPositions[i + 1] - tickPositions[i]);
      return sectionNorms[i] + segmentProgress * (sectionNorms[i + 1] - sectionNorms[i]);
    }
  }

  return 0;
}
