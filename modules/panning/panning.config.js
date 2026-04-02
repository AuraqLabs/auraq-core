// panning.config.js

export const PANNING_DEFAULTS = {
  dragThreshold: 5,    // px — minimum pointer travel before a pan gesture commits
  friction:      0.85, // velocity decay per frame — lower = slides longer
  minVelocity:   0.02, // px/frame — momentum stops below this threshold
  momentumScale: 20    // multiplier applied to velocity when advancing scroll
};
