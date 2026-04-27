import { useEffect } from 'react';
import { ErrorToast } from '../components/common/ErrorToast';
import { AttributePanel } from '../components/character/AttributePanel';
import { CharacterSummary } from '../components/character/CharacterSummary';
import { CombatPreviewPanel } from '../components/character/CombatPreviewPanel';
import { EquipmentPanel } from '../components/character/EquipmentPanel';
import { InventoryPanel } from '../components/character/InventoryPanel';
import { useCharacter } from '../hooks/useCharacter';
import { GameApiError } from '../api/actionTypes';

function isDebugModeEnabled() {
  return import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === '1';
}

function mapErrorTitle(error: GameApiError) {
  switch (error.kind) {
    case 'network':
      return '网络连接异常';
    case 'auth':
      return '登录状态异常';
    case 'config':
      return '部署或接口配置异常';
    case 'business':
      return '操作未通过';
    case 'client_state':
      return '页面状态需要刷新';
    default:
      return '请求失败';
  }
}

function mapErrorHint(error: GameApiError) {
  switch (error.kind) {
    case 'network':
      return '可先检查手机网络，或稍后重试。';
    case 'auth':
      return '请重新登录后再进入角色页。';
    case 'config':
      return '请确认当前前端连接的是正确 API 地址，并检查 CORS / 部署环境。';
    case 'client_state':
      return error.reason === 'DUPLICATE_ACTION'
        ? '当前已有角色操作在处理中。'
        : '角色页会重新同步服务端视图。';
    default:
      return null;
  }
}

export function CharacterPage() {
  const debugMode = isDebugModeEnabled();
  const {
    loading,
    refreshing,
    character,
    apiError,
    lastAction,
    lastErrorCode,
    lastErrorKind,
    lastRequestId,
    healthSummary,
    pendingOperation,
    loadCharacter,
    loadHealth,
    upgradeAttribute,
    equipItem,
    unequipItem,
  } = useCharacter();

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadCharacter();
      void loadHealth();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadCharacter, loadHealth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#0f1118_0%,#06070c_100%)] px-5 py-8 text-stone-100">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center gap-5">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-900/40 border-t-indigo-400" />
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.38em] text-indigo-500">角色</p>
            <h1 className="mt-2 text-2xl font-black tracking-[0.08em] text-stone-100">正在同步角色视图</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0f1118_0%,#090913_45%,#040408_100%)] text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
        {apiError ? (
          <ErrorToast
            title={mapErrorTitle(apiError)}
            message={apiError.userMessage}
            hint={mapErrorHint(apiError)}
            requestId={debugMode ? apiError.requestId : null}
          />
        ) : null}

        {debugMode ? (
          <section className="mt-4 rounded-2xl border border-cyan-900/40 bg-cyan-950/20 px-4 py-3 text-[11px] text-cyan-100/85">
            <div className="flex items-center justify-between gap-3">
              <span className="uppercase tracking-[0.24em] text-cyan-400">调试状态</span>
              <span className="text-cyan-500">dev / ?debug=1 可见</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              <span>lastAction: {lastAction}</span>
              <span>lastRequestId: {lastRequestId ?? '-'}</span>
              <span>lastErrorCode: {lastErrorCode ?? '-'}</span>
              <span>lastErrorKind: {lastErrorKind ?? '-'}</span>
              <span className="col-span-2">apiBaseUrl: {healthSummary?.apiBaseUrl ?? '-'}</span>
              <span>healthStatus: {healthSummary?.status ?? '-'}</span>
              <span>healthEnv: {healthSummary?.env ?? '-'}</span>
              <span className="col-span-2">releaseTag: {healthSummary?.releaseTag ?? '-'}</span>
            </div>
          </section>
        ) : null}

        {character ? (
          <main className="mt-4 flex flex-1 flex-col gap-4">
            <CharacterSummary character={character} />
            <CombatPreviewPanel combatPreview={character.combatPreview} />
            <AttributePanel
              attributes={character.attributes}
              pendingAttribute={pendingOperation?.action === 'UPGRADE_ATTRIBUTE' ? pendingOperation.attribute : undefined}
              onUpgrade={upgradeAttribute}
            />
            <EquipmentPanel
              equipped={character.equipment.equipped}
              pendingSlot={pendingOperation?.action === 'UNEQUIP_ITEM' ? pendingOperation.slot : undefined}
              onUnequip={unequipItem}
            />
            <InventoryPanel
              inventory={character.inventory}
              pendingItemId={pendingOperation?.action === 'EQUIP_ITEM' ? pendingOperation.itemId : undefined}
              onEquip={equipItem}
            />
          </main>
        ) : (
          <div className="mt-4 rounded-[28px] border border-red-900/40 bg-black/20 px-5 py-8 text-center text-sm text-stone-300">
            角色数据暂不可用，请稍后重试或点击重新同步。
          </div>
        )}

        <footer className="mt-5 flex items-center justify-between px-1 text-xs text-stone-500">
          <span>CharacterInfoView</span>
          <button
            type="button"
            onClick={() => {
              void loadCharacter(true);
              void loadHealth();
            }}
            disabled={refreshing}
            className="rounded-full border border-stone-800/80 bg-black/20 px-3 py-2 tracking-[0.18em] text-stone-300 disabled:opacity-50"
          >
            {refreshing ? '同步中' : '重新同步'}
          </button>
        </footer>
      </div>
    </div>
  );
}
