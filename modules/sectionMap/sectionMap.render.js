// sectionMap.render.js

/**
 * sectionMap.render.js
 * Owns DOM creation and visual updates for the pill bar, tick marks, and thumb.
 * Exports:
 *   - createBar(sectionCount): { bar, ticks, thumb }
 *   - updateThumb(thumb, normalizedPosition, tickPositions, sectionNorms): void
 */

/**
 * Imports setThumbPosition() and setArialvalue from dom.js
 */
import {
  setThumbPosition,
  setArialValue
} from './sectionMap.dom.js';

/**
 * BAR_PADDING
 */
const BAR_PADDING = 0;

/**
 * THUMB_WIDTH
 * Width (px) of the scroll thumb.
 * Render concern — drives the CSS width value and the thumb centering offset
 * in updateThumb(). Not needed outside this file.
 */
const THUMB_WIDTH = 3;

/**
 * createBar(sectionCount)
 * Injects the bar into document.body
 * @param {number} sectionCount — number of tick marks to render
 * Returns: { bar: Element, ticks: Element[], thumb: Element }
 */
export function createBar(sectionCount) {
  injectStyles();

  const bar = document.createElement('div');
  bar.className = 'sectionMap-bar';
  bar.setAttribute('role', 'scrollbar');
  bar.setAttribute('aria-orientation', 'horizontal');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('aria-valuenow', '0');

  const ticks = [];
  for (let i = 0; i < sectionCount; i++) {
    const tick = document.createElement('div');
    tick.className = 'sectionMap-tick';
    tick.setAttribute('aria-hidden', 'true');
    bar.appendChild(tick);
    ticks.push(tick);
  }

  const thumb = document.createElement('div');
  thumb.className = 'sectionMap-thumb';
  thumb.setAttribute('aria-hidden', 'true');
  bar.appendChild(thumb);

  document.body.appendChild(bar);

  return { bar, ticks, thumb };
}

/**
 * Computes the thumb's pixel position via engine.js
 * @param {Element}  thumb
 * @param {number}   normalizedPosition — 0 (top) to 1 (bottom)
 * @param {number[]} tickPositions — measured centre X of each tick in px
 * @param {number[]} sectionNorms  — normalized scroll position of each section
 * Returns: void
 */
export function updateThumb(thumb, px, normalizedPosition) {
  setThumbPosition(thumb, (px - THUMB_WIDTH / 2))
  setArialValue(thumb.parentElement, Math.round(normalizedPosition * 100));
}


// Rudimentary CSS Configuration
function injectStyles() {
  if (document.getElementById('sectionMap-styles')) return;

  const style = document.createElement('style');
  style.id = 'sectionMap-styles';
  style.textContent = `
    @layer auraq.sectionMap {
      .sectionMap-bar {
        position: fixed;
        bottom: 64px;
        right: 256px;
        width: auto;
        height: 36px;
        aspect-ratio: 20/2;
        opacity: var(--sectionMap-bar-opacity, 0.4);
        transition: opacity 200ms ease-out;
        background: var(--sectionMap-bar-bg, color-mix(in srgb, var(--bg-color, #140A0A) 88%, transparent));
        border: 2px solid var(--sectionMap-bar-border, color-mix(in srgb, var(--text-color, #EFF9F0) 21%, transparent));
        border-radius: var(--sectionMap-bar-radius, 8px);
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        padding: 0 ${BAR_PADDING}px;
        box-sizing: border-box;
        cursor: pointer;
        z-index: 9999;
        touch-action: none;
        user-select: none;
        isolation: isolate;
        -webkit-tap-highlight-color: transparent;
      }

      @media (max-width: 800px) {
        .sectionMap-bar {
          width: 90vw;
          left: 50%;
          transform: translateX(-50%);
          bottom: 20px;
        }
      }

      .sectionMap-tick {
        width: 2px;
        height: 16px;
        background: var(--sectionMap-tick-color, var(--text-color, #7D7D7D));
        border-radius: 1px;
        flex-shrink: 0;
        pointer-events: none;
      }

      .sectionMap-thumb {
        position: absolute;
        top: 50%;
        left: 0;
        width: ${THUMB_WIDTH}px;
        height: 18px;
        background: var(--sectionMap-thumb-color, var(--theme-color, #FF9124));
        border-radius: var(--sectionMap-thumb-radius, 2px);
        pointer-events: none;
      }

      .sectionMap-bar:hover {
        opacity: 1;
        transition: none;
      }

      .sectionMap-bar:hover .sectionMap-thumb {
        height: 24px
      }

      .sectionMap-bar:hover .sectionMap-tick {
	background: var(--sectionMap-tick-color, var(--text-color, #7D7D7D));
      }
    }
    `;
  document.head.appendChild(style);
}
