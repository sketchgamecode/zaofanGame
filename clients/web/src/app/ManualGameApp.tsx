import { useState } from 'react';
import { AuthScreen } from '../components/AuthScreen';
import { CharacterCreationScreen } from '../components/creation/CharacterCreationScreen';
import type { ItemTooltipState } from '../components/ui/ItemTooltip';
import { GameStateProvider, useGameState } from '../state/GameStateContext';
import { OverlayRoot } from '../stage/OverlayRoot';
import { RightRail } from '../stage/RightRail';
import { RootStage } from '../stage/RootStage';
import { SceneViewport } from '../stage/SceneViewport';
import type { SceneId } from '../types/game';

function ManualGameShell() {
  const { authLoading, bootLoading, character, errorMessage, session, saveState, signOut } = useGameState();
  const [sceneId, setSceneId] = useState<SceneId>('city');
  const [itemTooltip, setItemTooltip] = useState<ItemTooltipState | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSceneChange = (nextSceneId: SceneId) => {
    setItemTooltip(null);
    setSceneId(nextSceneId);
  };

  if (authLoading) {
    return <div className="manual-loading">正在校验登录状态...</div>;
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (bootLoading || !saveState) {
    return <div className="manual-loading">正在载入存档...</div>;
  }

  if (saveState.player.status === 'PENDING_CREATION') {
    return <CharacterCreationScreen />;
  }

  if (!character) {
    return (
      <div className="manual-loading">
        <div className="manual-loading__panel">
          <div className="manual-loading__title">角色数据加载失败</div>
          <div className="manual-loading__copy">
            {errorMessage ?? '服务端未返回可用的角色视图。请先查看 server 终端日志里的 PLAYER_GET_INFO 错误。'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <RootStage>
      <SceneViewport
        sceneId={sceneId}
        onItemTooltipChange={setItemTooltip}
        onRequestClose={() => {
          setItemTooltip(null);
          if (sceneId === 'city') {
            setShowLogoutConfirm(true);
            return;
          }

          setSceneId('city');
        }}
        onSceneChange={handleSceneChange}
      />
      <RightRail activeSceneId={sceneId} onInventoryOpen={() => handleSceneChange('inventory')} onSceneChange={handleSceneChange} />
      <OverlayRoot
        itemTooltip={itemTooltip}
        onCancelLogout={() => setShowLogoutConfirm(false)}
        onConfirmLogout={() => {
          setShowLogoutConfirm(false);
          void signOut();
        }}
        showLogoutConfirm={showLogoutConfirm}
      />
    </RootStage>
  );
}

export function ManualGameApp() {
  return (
    <GameStateProvider>
      <ManualGameShell />
    </GameStateProvider>
  );
}
