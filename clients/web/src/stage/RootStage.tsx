import type { PropsWithChildren } from 'react';
import { STAGE_HEIGHT, STAGE_WIDTH } from '../config/layout';

// 固定 1920×1080 舞台，不做任何 CSS scale 缩放。
// 保持 100% 像素比例是拖拽坐标准确的前提，不允许引入 transform: scale。
export function RootStage({ children }: PropsWithChildren) {
  return (
    <div className="manual-shell">
      <div
        className="manual-stage"
        style={{
          width: `${STAGE_WIDTH}px`,
          height: `${STAGE_HEIGHT}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
