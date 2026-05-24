/**
 * OverlayRoot.tsx
 *
 * 全局覆盖层。ItemTooltip 从 useItemTooltip() 读取状态，不接收 props。
 */

import { ItemTooltip } from '../components/ui/ItemTooltip';
import { StandardModal } from '../components/ui/StandardModal';
import { GameBusyOverlay } from '../components/ui/GameBusyOverlay';
import { useGameState } from '../state/GameStateContext';

type OverlayRootProps = {
  showLogoutConfirm: boolean;
  onConfirmLogout: () => void;
  onCancelLogout: () => void;
};

export function OverlayRoot({ showLogoutConfirm, onConfirmLogout, onCancelLogout }: OverlayRootProps) {
  const { isServerBusy } = useGameState();

  return (
    <div className="overlay-root">
      <GameBusyOverlay visible={isServerBusy} />
      {showLogoutConfirm ? (
        <StandardModal
          cancelLabel="取消"
          confirmLabel="确认退出"
          copy="当前位于城市系统。关闭场景将退出登录并返回凭帖页。"
          title="退出当前账号？"
          onCancel={onCancelLogout}
          onConfirm={onConfirmLogout}
        />
      ) : null}
      {/* ItemTooltip 直接读取全局 tooltipStore，无需 props */}
      <ItemTooltip />
    </div>
  );
}
