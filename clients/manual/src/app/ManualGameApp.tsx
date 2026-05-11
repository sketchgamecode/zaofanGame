import { useState } from 'react';
import { AuthScreen } from '../components/AuthScreen';
import { CharacterCreationScreen } from '../components/creation/CharacterCreationScreen';
import { GameStateProvider, useGameState } from '../state/GameStateContext';
import { BottomHud } from '../stage/BottomHud';
import { OverlayRoot } from '../stage/OverlayRoot';
import { RightRail } from '../stage/RightRail';
import { RootStage } from '../stage/RootStage';
import { SceneViewport } from '../stage/SceneViewport';
import type { SceneId } from '../types/game';

function ManualGameShell() {
  const { authLoading, bootLoading, character, errorMessage, session, saveState, signOut } = useGameState();
  const [sceneId, setSceneId] = useState<SceneId>('city');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
        onRequestClose={() => {
          if (sceneId === 'city') {
            setShowLogoutConfirm(true);
            return;
          }

          setSceneId('city');
        }}
        onSceneChange={setSceneId}
      />
      <RightRail activeSceneId={sceneId} onInventoryOpen={() => setSceneId('inventory')} onSceneChange={setSceneId} />
      <BottomHud />
      <OverlayRoot
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
