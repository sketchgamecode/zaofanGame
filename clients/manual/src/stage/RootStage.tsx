import { useEffect, useState, type PropsWithChildren } from 'react';
import { STAGE_HEIGHT, STAGE_WIDTH } from '../config/layout';

export function RootStage({ children }: PropsWithChildren) {
  const [stageScale, setStageScale] = useState(1);

  useEffect(() => {
    const updateStageScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const horizontalPadding = 16;
      const verticalPadding = 16;

      const availableWidth = Math.max(0, viewportWidth - horizontalPadding * 2);
      const availableHeight = Math.max(0, viewportHeight - verticalPadding * 2);
      const widthScale = availableWidth / STAGE_WIDTH;
      const heightScale = availableHeight / STAGE_HEIGHT;
      const nextScale = Math.min(widthScale, heightScale);

      setStageScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1);
    };

    updateStageScale();
    window.addEventListener('resize', updateStageScale);
    window.visualViewport?.addEventListener('resize', updateStageScale);

    return () => {
      window.removeEventListener('resize', updateStageScale);
      window.visualViewport?.removeEventListener('resize', updateStageScale);
    };
  }, []);

  return (
    <div className="manual-shell">
      <div
        className="manual-stage-viewport"
        style={{
          width: `${STAGE_WIDTH * stageScale}px`,
          height: `${STAGE_HEIGHT * stageScale}px`,
        }}
      >
      <div
        className="manual-stage"
        style={{
          width: `${STAGE_WIDTH}px`,
          height: `${STAGE_HEIGHT}px`,
          transform: `scale(${stageScale})`,
        }}
      >
        {children}
      </div>
      </div>
    </div>
  );
}
