export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

export const layout = {
  sceneViewport: {
    x: 0,
    y: 0,
    width: 1534,
    height: 980,
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
    y: 394,
    width: 276,
    buttonHeight: 98,
  },
  rightNavButtons: [
    { x: 1584, y: 394, width: 276, height: 98 },
    { x: 1584, y: 500, width: 276, height: 98 },
    { x: 1584, y: 605, width: 276, height: 98 },
    { x: 1584, y: 711, width: 276, height: 98 },
    { x: 1584, y: 816, width: 276, height: 98 },
    { x: 1584, y: 922, width: 276, height: 98 },
  ] as const,
  bottomHud: {
    x: 0,
    y: 980,
    width: 1534,
    height: 100,
  },
  bottomResourceRow: {
    x: 24,
    y: 992,
    width: 860,
    height: 64,
    chipWidth: 196,
    gap: 16,
  },
  xpPanel: {
    x: 916,
    y: 992,
    width: 590,
    height: 64,
  },
} as const;
