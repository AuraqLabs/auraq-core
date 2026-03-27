// skillTree.controller.js

/**
 * skillTree.controller.js
 * Owns all event handlers — node click, popup close, filter toggle
 * Exports:
 *   - createSkillTreeController(state, nodes, popups, filters): { bindAll }
 */

import { setActive, setNodeDimmed, setPopupVisible, setPopupPosition, getNodeRect } from './skillTree.dom.js';
import { computePopupCoords } from './skillTree.engine.js';

export function createSkillTreeController(state, nodes, popups, filters) {

  function getPopupFor(nodeId) {
    return popups.find(p => p.dataset.forId === nodeId) ?? null;
  }

  function getNodeEl(nodeId) {
    return nodes.find(n => n.dataset.id === nodeId) ?? null;
  }

  function closeActive() {
    if (!state.selectedNodeId) return;
    const popup = getPopupFor(state.selectedNodeId);
    const node  = getNodeEl(state.selectedNodeId);
    if (popup) setPopupVisible(popup, false);
    if (node)  setActive(node, false);
    state.selectedNodeId = null;
  }

  function onNodeClick(e) {
    const nodeEl = e.currentTarget;
    const nodeId = nodeEl.dataset.id;

    // clicking the active node toggles it closed
    if (state.selectedNodeId === nodeId) {
      closeActive();
      return;
    }

    closeActive();

    state.selectedNodeId = nodeId;
    setActive(nodeEl, true);

    const popup = getPopupFor(nodeId);

    if (!popup) return;

    const nodeLeft = getNodeRect(nodeEl).left;
    const nodeTop = getNodeRect(nodeEl).top;
    const nodeWidth = getNodeRect(nodeEl).width;
    const nodeHeight = getNodeRect(nodeEl).height;
    const side = popup.classList.contains('popup-left') ? 'left'
               : popup.classList.contains('popup-right') ? 'right' : 'below';
    const popupWidth = 300;
    const gap = 20;
    const { left, top } = computePopupCoords(nodeLeft, nodeTop, nodeWidth, nodeHeight, side, popupWidth, gap);

    console.log({ left, top});

    setPopupPosition(popup, left, top);
    setPopupVisible(popup, true);
  }

  function onCloseClick(e) {
    e.stopPropagation();
    closeActive();
  }

  function onFilterClick(e) {
    const filterEl = e.currentTarget;
    const domain = filterEl.dataset.domain;

    if (state.activeFilter === domain) {
      // toggle filter off
      state.activeFilter = null;
      filters.forEach(f => setActive(f, false));
      nodes.forEach(n => setNodeDimmed(n, false));
    } else {
      state.activeFilter = domain;
      filters.forEach(f => setActive(f, f.dataset.domain === domain));
      nodes.forEach(n => setNodeDimmed(n, n.dataset.domain !== domain));

      // close popup if its node just got dimmed
      if (state.selectedNodeId) {
        const selectedNode = getNodeEl(state.selectedNodeId);
        if (selectedNode && selectedNode.dataset.domain !== domain) {
          closeActive();
        }
      }
    }
  }

  function bindAll() {
    nodes.forEach(nodeEl => {
      nodeEl.addEventListener('click', onNodeClick);
    });

    popups.forEach(popupEl => {
      const closeBtn = popupEl.querySelector('.popup-close');
      if (closeBtn) closeBtn.addEventListener('click', onCloseClick);
    });

    filters.forEach(filterEl => {
      filterEl.addEventListener('click', onFilterClick);
    });
  }

  return { bindAll };
}
