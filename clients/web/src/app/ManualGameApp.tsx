/**
 * ManualGameApp.tsx
 *
 * 应用根组件。TooltipProvider 挂载在最外层，所有子组件可通过 useItemTooltip() 访问全局 tooltip。
 */

import { useState } from 'react';
import { AuthScreen } from '../components/AuthScreen';
import { CharacterCreationScreen } from '../components/creation/CharacterCreationScreen';
import { TooltipProvider } from '../state/tooltipStore';
import { GameStateProvider, useGameState } from '../state/GameStateContext';
import { DebugConfigPage } from './DebugConfigPage';
import { OverlayRoot } from '../stage/OverlayRoot';
import { RightRail } from '../stage/RightRail';
import { RootStage } from '../stage/RootStage';
import { SceneViewport } from '../stage/SceneViewport';
import type { SceneId } from '../types/game';

function ManualGameShell() {
  const { authLoading, bootLoading, character, errorMessage, session, saveState, signOut } = useGameState();
  const [sceneId, setSceneId] = useState<SceneId>('city');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSceneChange = (nextSceneId: SceneId) => {
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
        onRequestClose={() => {
          if (sceneId === 'city') {
            setShowLogoutConfirm(true);
            return;
          }
          setSceneId('city');
        }}
        onSceneChange={handleSceneChange}
      />
      <RightRail
        activeSceneId={sceneId}
        onInventoryOpen={() => handleSceneChange('inventory')}
        onSceneChange={handleSceneChange}
      />
      <OverlayRoot
        showLogoutConfirm={showLogoutConfirm}
        onCancelLogout={() => setShowLogoutConfirm(false)}
        onConfirmLogout={() => {
          setShowLogoutConfirm(false);
          void signOut();
        }}
      />
    </RootStage>
  );
}

export function ManualGameApp() {
  if (window.location.pathname === '/debug') {
    return <DebugConfigPage />;
  }

  return (
    // TooltipProvider 挂在最外层，确保 DndContext 内的 ItemSlot 和 OverlayRoot 都能访问
    <TooltipProvider>
      <GameStateProvider>
        <ManualGameShell />
      </GameStateProvider>
    </TooltipProvider>
  );
}
