// skillAccordion.init.js

const DURATION = 350;
const EASING   = 'cubic-bezier(0.22, 1, 0.36, 1)';

export function initSkillAccordion() {
  const containers = document.querySelectorAll('[data-skills]');

  if (!containers.length) {
    console.warn('initSkillAccordion: no [data-skills] elements found');
    return;
  }

  // -- Drag guard ----------------------------------------------------------
  // Prevents accordion toggling when the user drags the panning container
  // with the cursor over a summary. Self-contained — no dependency on the
  // panning module. Mirrors panning's dragThreshold of 5px.

  const DRAG_THRESHOLD = 5;
  let gestureWasDrag = false;
  let _startX = 0;
  let _startY = 0;

  document.addEventListener('pointerdown', e => {
    gestureWasDrag = false;
    _startX = e.clientX;
    _startY = e.clientY;
  });

  document.addEventListener('pointermove', e => {
    if (gestureWasDrag) return;
    if (
      Math.abs(e.clientX - _startX) > DRAG_THRESHOLD ||
      Math.abs(e.clientY - _startY) > DRAG_THRESHOLD
    ) gestureWasDrag = true;
  });

  // -- Per-details wiring --------------------------------------------------

  containers.forEach(container => {
    container.querySelectorAll('details').forEach(details => {
      const summary = details.querySelector('summary');
      const body    = details.querySelector('.skill-body');

      if (!summary || !body) return;

      let currentAnim = null;

      summary.addEventListener('click', e => {

        // Block toggle if this gesture was a drag
        if (gestureWasDrag) {
          e.preventDefault();
          return;
        }

        e.preventDefault();

        // Cancel any in-progress animation. Simple cancel is enough —
        // body snaps to its natural rendered state (full height if open,
        // hidden if closed), which is a clean starting point for the next anim.
        if (currentAnim) {
          currentAnim.cancel();
          currentAnim = null;
        }

        if (!details.open) {
          // -- Open --------------------------------------------------------
          // Set details.open first so the browser renders content into the DOM.
          // fill: 'backwards' applies the first keyframe (height: 0px) immediately,
          // preventing a one-frame flash of content at full height.
          details.open = true;
          const targetH = body.scrollHeight;

          currentAnim = body.animate(
            [
              { height: '0px',          overflow: 'hidden' },
              { height: `${targetH}px`, overflow: 'hidden' }
            ],
            { duration: DURATION, easing: EASING, fill: 'backwards' }
          );

          currentAnim.onfinish = () => {
            // Cancel removes the finished animation from the element so its
            // fill effect (height: targetH) does not persist and interfere
            // with subsequent animations.
            currentAnim.cancel();
            currentAnim = null;
          };

        } else {
          // -- Close -------------------------------------------------------
          // No fill: 'forwards' — instead we cancel the finished animation
          // inside onfinish so it is fully removed from the element.
          // details.open = false hides the content; no stale fill remains.
          const startH = body.scrollHeight;

          currentAnim = body.animate(
            [
              { height: `${startH}px`, overflow: 'hidden' },
              { height: '0px',         overflow: 'hidden' }
            ],
            { duration: DURATION, easing: EASING }
          );

          currentAnim.onfinish = () => {
            details.open = false;
            currentAnim.cancel();
            currentAnim = null;
          };
        }
      });
    });
  });
}
