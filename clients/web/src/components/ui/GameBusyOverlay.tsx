type GameBusyOverlayProps = {
  visible: boolean;
};

export function GameBusyOverlay({ visible }: GameBusyOverlayProps) {
  if (!visible) return null;

  return (
    <div className="game-busy-overlay" aria-live="polite" aria-label="服务器处理中">
      <div className="game-busy-overlay__spinner">
        <img alt="" src="/assets/ui/token_1.png" />
      </div>
      <div className="game-busy-overlay__text">江湖传信中...</div>
    </div>
  );
}
