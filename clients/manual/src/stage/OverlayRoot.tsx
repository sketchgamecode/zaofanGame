type OverlayRootProps = {
  showLogoutConfirm: boolean;
  onConfirmLogout: () => void;
  onCancelLogout: () => void;
};

export function OverlayRoot({
  showLogoutConfirm,
  onConfirmLogout,
  onCancelLogout,
}: OverlayRootProps) {
  return (
    <div className="overlay-root">
      {showLogoutConfirm ? (
        <div className="decision-modal">
          <div className="decision-modal__panel">
            <div className="decision-modal__title">退出当前账号？</div>
            <div className="decision-modal__copy">当前位于城市系统。关闭场景将退出登录并返回凭帖页。</div>
            <div className="decision-modal__actions">
              <button className="decision-modal__button decision-modal__button--quiet" type="button" onClick={onCancelLogout}>
                取消
              </button>
              <button className="decision-modal__button" type="button" onClick={onConfirmLogout}>
                确认退出
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
