import { ItemTooltip, type ItemTooltipState } from '../components/ui/ItemTooltip';
import { StandardModal } from '../components/ui/StandardModal';

type OverlayRootProps = {
  itemTooltip: ItemTooltipState | null;
  showLogoutConfirm: boolean;
  onConfirmLogout: () => void;
  onCancelLogout: () => void;
};

export function OverlayRoot({
  itemTooltip,
  showLogoutConfirm,
  onConfirmLogout,
  onCancelLogout,
}: OverlayRootProps) {
  return (
    <div className="overlay-root">
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
      {itemTooltip ? <ItemTooltip tooltip={itemTooltip} /> : null}
    </div>
  );
}
