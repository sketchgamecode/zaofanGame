export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

export const layout = {
  sceneViewport: {
    x: 0,
    y: 0,
    width: 1534,
    height: 1080,
  },
  rightRail: {
    x: 1534,
    y: 0,
    width: 386,
    height: 1080,
  },
  portraitCard: {
    x: 1562,
    y: 18,
    width: 320,
    height: 252,
  },
  rightNav: {
    x: 1584,
    y: 292,
    width: 276,
    buttonHeight: 72,
  },
  rightNavButtons: [
    { x: 1584, y: 292, width: 276, height: 72 },
    { x: 1584, y: 370, width: 276, height: 72 },
    { x: 1584, y: 448, width: 276, height: 72 },
    { x: 1584, y: 526, width: 276, height: 72 },
    { x: 1584, y: 604, width: 276, height: 72 },
    { x: 1584, y: 682, width: 276, height: 72 },
    { x: 1584, y: 760, width: 276, height: 72 },
    { x: 1584, y: 838, width: 276, height: 72 },
  ] as const,
} as const;
