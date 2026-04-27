import { useCallback, useState } from 'react';
import { createClientStateError, fetchApiHealth, postGameAction, shouldResyncForError } from '../api/gameActions';
import type { ActionSuccessResult, ApiHealthSummary } from '../api/actionTypes';
import { GameApiError } from '../api/actionTypes';
import type { AttributeKey, CharacterInfoView, EquipmentItem, EquipmentSlot } from '../types/character';
import { ATTRIBUTE_KEYS, EQUIPMENT_SLOTS } from '../types/character';

type CharacterActionName =
  | 'PLAYER_GET_INFO'
  | 'UPGRADE_ATTRIBUTE'
  | 'EQUIP_ITEM'
  | 'UNEQUIP_ITEM';

type PendingOperation = {
  action: CharacterActionName;
  attribute?: AttributeKey;
  itemId?: string;
  slot?: EquipmentSlot;
} | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAttributeValues(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return ATTRIBUTE_KEYS.every((key) => typeof value[key] === 'number');
}

function isEquipmentItem(value: unknown): value is EquipmentItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.slot === 'string' &&
    EQUIPMENT_SLOTS.includes(value.slot as EquipmentSlot) &&
    typeof value.rarity === 'number' &&
    isRecord(value.bonusAttributes)
  );
}

function isCharacterInfoView(value: unknown): value is CharacterInfoView {
  if (!isRecord(value)) {
    return false;
  }

  const player = value.player;
  const resources = value.resources;
  const attributes = value.attributes;
  const combatPreview = value.combatPreview;
  const equipment = value.equipment;
  const inventory = value.inventory;

  if (
    !isRecord(player) ||
    typeof player.level !== 'number' ||
    typeof player.exp !== 'number' ||
    typeof player.classId !== 'string'
  ) {
    return false;
  }

  if (
    !isRecord(resources) ||
    typeof resources.copper !== 'number' ||
    typeof resources.tokens !== 'number' ||
    typeof resources.hourglasses !== 'number' ||
    typeof resources.prestige !== 'number'
  ) {
    return false;
  }

  if (
    !isRecord(attributes) ||
    !isAttributeValues(attributes.base) ||
    !isAttributeValues(attributes.total) ||
    !isAttributeValues(attributes.upgradeCosts)
  ) {
    return false;
  }

  if (
    !isRecord(combatPreview) ||
    typeof combatPreview.hp !== 'number' ||
    typeof combatPreview.armor !== 'number' ||
    typeof combatPreview.damageMin !== 'number' ||
    typeof combatPreview.damageMax !== 'number' ||
    typeof combatPreview.critChanceBp !== 'number' ||
    typeof combatPreview.itemPowerTotal !== 'number' ||
    typeof combatPreview.combatRating !== 'number'
  ) {
    return false;
  }

  if (!isRecord(equipment) || !isRecord(equipment.equipped)) {
    return false;
  }

  const equipped = equipment.equipped as Record<string, unknown>;

  if (
    !EQUIPMENT_SLOTS.every((slot) => {
      const item = equipped[slot];
      return item === null || isEquipmentItem(item);
    })
  ) {
    return false;
  }

  if (
    !isRecord(inventory) ||
    typeof inventory.count !== 'number' ||
    !Array.isArray(inventory.items) ||
    !inventory.items.every((item) => isEquipmentItem(item))
  ) {
    return false;
  }

  return true;
}

function toGameApiError(action: CharacterActionName, error: unknown) {
  if (error instanceof GameApiError) {
    return error;
  }

  return new GameApiError({
    action,
    kind: 'unknown',
    reason: 'UNKNOWN',
    userMessage: '发生了未识别的角色页错误，请稍后重试。',
    debugMessage: error instanceof Error ? error.message : `Unknown error while handling ${action}`,
    apiBaseUrl: window.location.origin,
  });
}

export function useCharacter() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [character, setCharacter] = useState<CharacterInfoView | null>(null);
  const [apiError, setApiError] = useState<GameApiError | null>(null);
  const [lastAction, setLastAction] = useState<CharacterActionName>('PLAYER_GET_INFO');
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [lastErrorKind, setLastErrorKind] = useState<string | null>(null);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const [healthSummary, setHealthSummary] = useState<ApiHealthSummary | null>(null);
  const [pendingOperation, setPendingOperation] = useState<PendingOperation>(null);

  const applySuccessMeta = useCallback((action: CharacterActionName, response: ActionSuccessResult<unknown>) => {
    setLastAction(action);
    setLastRequestId(response.meta.requestId);
    setLastErrorCode(null);
    setLastErrorKind(null);
    setApiError(null);
  }, []);

  const applyErrorState = useCallback((action: CharacterActionName, error: GameApiError) => {
    setLastAction(action);
    setLastRequestId(error.requestId);
    setLastErrorCode(error.errorCode);
    setLastErrorKind(error.kind);
    setApiError(error);
  }, []);

  const loadHealth = useCallback(async () => {
    const summary = await fetchApiHealth();
    setHealthSummary(summary);
  }, []);

  const syncCharacter = useCallback(
    async (response: ActionSuccessResult<unknown>, action: CharacterActionName) => {
      applySuccessMeta(action, response);

      if (!isCharacterInfoView(response.data)) {
        throw new GameApiError({
          action,
          kind: 'config',
          reason: 'INVALID_API_RESPONSE',
          userMessage: '服务器返回了无法识别的角色数据，请确认部署环境。',
          debugMessage: `Invalid CharacterInfoView payload for ${action}`,
          status: response.meta.status,
          requestId: response.meta.requestId,
          apiBaseUrl: response.meta.apiBaseUrl,
          serverTime: response.serverTime,
          stateRevision: response.stateRevision,
        });
      }

      setCharacter(response.data);
    },
    [applySuccessMeta],
  );

  const loadCharacter = useCallback(
    async (background = false) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await postGameAction<unknown>('PLAYER_GET_INFO');
        await syncCharacter(response, 'PLAYER_GET_INFO');
      } catch (error) {
        applyErrorState('PLAYER_GET_INFO', toGameApiError('PLAYER_GET_INFO', error));
      } finally {
        if (background) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [applyErrorState, syncCharacter],
  );

  const withPendingGuard = useCallback(
    async (action: CharacterActionName) => {
      if (!pendingOperation) {
        return false;
      }

      applyErrorState(
        action,
        createClientStateError(
          action,
          'DUPLICATE_ACTION',
          '当前已有角色操作在处理中，请等待服务器返回。',
          `Duplicate ${action} blocked while ${pendingOperation.action} is pending`,
        ),
      );
      return true;
    },
    [applyErrorState, pendingOperation],
  );

  const upgradeAttribute = useCallback(
    async (attribute: AttributeKey) => {
      if (await withPendingGuard('UPGRADE_ATTRIBUTE')) {
        return;
      }

      setPendingOperation({ action: 'UPGRADE_ATTRIBUTE', attribute });

      try {
        const response = await postGameAction<unknown>('UPGRADE_ATTRIBUTE', { attribute });
        await syncCharacter(response, 'UPGRADE_ATTRIBUTE');
      } catch (error) {
        const apiFailure = toGameApiError('UPGRADE_ATTRIBUTE', error);
        applyErrorState('UPGRADE_ATTRIBUTE', apiFailure);
        if (shouldResyncForError(apiFailure)) {
          await loadCharacter(true);
        }
      } finally {
        setPendingOperation(null);
      }
    },
    [applyErrorState, loadCharacter, syncCharacter, withPendingGuard],
  );

  const equipItem = useCallback(
    async (itemId: string) => {
      if (await withPendingGuard('EQUIP_ITEM')) {
        return;
      }

      const existsInInventory = character?.inventory.items.some((item) => item.id === itemId);
      if (!existsInInventory) {
        applyErrorState(
          'EQUIP_ITEM',
          createClientStateError(
            'EQUIP_ITEM',
            'STALE_UI_STATE',
            '该装备已不在当前背包列表中，正在重新同步。',
            `Client inventory is stale for EQUIP_ITEM ${itemId}`,
          ),
        );
        await loadCharacter(true);
        return;
      }

      setPendingOperation({ action: 'EQUIP_ITEM', itemId });

      try {
        const response = await postGameAction<unknown>('EQUIP_ITEM', { itemId });
        await syncCharacter(response, 'EQUIP_ITEM');
      } catch (error) {
        const apiFailure = toGameApiError('EQUIP_ITEM', error);
        applyErrorState('EQUIP_ITEM', apiFailure);
        if (shouldResyncForError(apiFailure)) {
          await loadCharacter(true);
        }
      } finally {
        setPendingOperation(null);
      }
    },
    [applyErrorState, character?.inventory.items, loadCharacter, syncCharacter, withPendingGuard],
  );

  const unequipItem = useCallback(
    async (slot: EquipmentSlot) => {
      if (await withPendingGuard('UNEQUIP_ITEM')) {
        return;
      }

      const equippedItem = character?.equipment.equipped[slot] ?? null;
      if (!equippedItem) {
        applyErrorState(
          'UNEQUIP_ITEM',
          createClientStateError(
            'UNEQUIP_ITEM',
            'STALE_UI_STATE',
            '该槽位当前没有装备，正在重新同步。',
            `Client equipment is stale for UNEQUIP_ITEM ${slot}`,
          ),
        );
        await loadCharacter(true);
        return;
      }

      setPendingOperation({ action: 'UNEQUIP_ITEM', slot });

      try {
        const response = await postGameAction<unknown>('UNEQUIP_ITEM', { slot });
        await syncCharacter(response, 'UNEQUIP_ITEM');
      } catch (error) {
        const apiFailure = toGameApiError('UNEQUIP_ITEM', error);
        applyErrorState('UNEQUIP_ITEM', apiFailure);
        if (shouldResyncForError(apiFailure)) {
          await loadCharacter(true);
        }
      } finally {
        setPendingOperation(null);
      }
    },
    [applyErrorState, character?.equipment.equipped, loadCharacter, syncCharacter, withPendingGuard],
  );

  return {
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
  };
}
