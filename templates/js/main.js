// main.js

/* ===================== panningContainer Clas ================== */
export class directManipulationScroller {
  constructor(containerId) {
    this.panningContainer = document.getElementById(containerId);

    // Drag + momentum scroll state
    this.isDragging = false;
    this.startY = 0;
    this.startScrollTop = 0;
    this.velocity = 0;
    this.lastY = 0;
    this.lastTime = 0;
    this.momentumID = null;

    this._bindEvents();
  }

  /* ------ WHEEL SCROLL ------ */
  _onWheel = (e) => {
    e.preventDefault();

    const LINE_HEIGHT = 16;
    const PAGE_HEIGHT = this.panningContainer.clientHeight;

    let delta = e.deltaY;

    if (e.deltaMode === 1) delta *= LINE_HEIGHT;
    if (e.deltaMode === 2) delta *= PAGE_HEIGHT;

    this.velocity += delta * 0.002;
    this._startMomentum();
  }

  /* ------ POINTED DRAG ------ */
  _onPointerDown = (e) => {
    this.isDragging = true;
    this.startY = e.clientY;
    this.startScrollTop = this.panningContainer.scrollTop;
    this.lastY = e.clientY;
    this.lastTime = performance.now();
    this.panningContainer.setPointerCapture(e.pointerId);
    this._cancelMomentum();
  }

  _onPointerMove = (e) => {
    if (!this.isDragging) return;

    const dy = e.clientY - this.startY;
    this.panningContainer.scrollTop = this.startScrollTop - dy;

    // Track velocity
    const now = performance.now();
    this.velocity = (e.clientY - this.lastY) / (now - this.lastTime);
    this.lastY = e.clientY;
    this.lastTime = now;
  }

  _onPointerUp = () => {
    this.isDragging = false;
    this._startMomentum();
  }

  /* ------ MOMENTUM (ELASTIC SCROLL) ------ */
  _startMomentum() {
    const friction = 0.85;
    const minVelocity = 0.02;

    const step = () => {
      this.velocity *= friction;
      this.panningContainer.scrollTop -= this.velocity * 20;

      if (Math.abs(this.velocity) > minVelocity) {
        this.momentumID = requestAnimationFrame(step);
      }
    }

    this.momentumID = requestAnimationFrame(step);
  }

  _cancelMomentum() {
    if (this.momentumID) cancelAnimationFrame(this.momentumID)
  }

  /* ------ EVENT BINDING ------ */
  _bindEvents() {
    this.panningContainer.addEventListener("pointerdown", this._onPointerDown);
    this.panningContainer.addEventListener("pointermove", this._onPointerMove);
    this.panningContainer.addEventListener("pointerup", this._onPointerUp);
    this.panningContainer.addEventListener("pointercancel", this._onPointerUp);

    //document.addEventListener("wheel", this._onWheel, { passive: false});
  }
}
  // NAVIGATION SCROLL (WIP)
  
/* =============== Initialize Panning =============== */
document.addEventListener("DOMContentLoaded", () => {
  const scroller = new directManipulationScroller("panningContainer");
});
