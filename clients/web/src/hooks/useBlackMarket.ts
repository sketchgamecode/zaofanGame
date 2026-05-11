import React, { useCallback, useState } from 'react';
import { createClientStateError, fetchApiHealth, postGameAction, shouldResyncForError } from '../api/gameActions';
import type { ActionSuccessResult } from '../api/actionTypes';
import { GameApiError } from '../api/actionTypes';
import type { EquipmentItem } from '../types/character';

type BlackMarketActionName = 'REFRESH_BLACKMARKET' | 'BUY_AND_EQUIP_ITEM';

export type BlackMarketView = {
  status: 'ACTIVE' | 'UNINITIALIZED' | 'DISABLED';
  items: EquipmentItem[];
  nextAutoRefreshMs: number;
};

export type BuyAndEquipView = {
  purchasedItemId: string;
  copperSpent: number;
  unequippedItem: EquipmentItem | null;
  remainingItems: EquipmentItem[];
  nextAutoRefreshMs: number;
};

type PendingOperation = {
  action: BlackMarketActionName;
  itemId?: string;
} | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBlackMarketView(value: unknown): value is BlackMarketView {
  if (!isRecord(value)) return false;
  return (
    typeof value.status === 'string' &&
    Array.isArray(value.items) &&
    typeof value.nextAutoRefreshMs === 'number'
  );
}

function isBuyAndEquipView(value: unknown): value is BuyAndEquipView {
  if (!isRecord(value)) return false;
  return (
    typeof value.purchasedItemId === 'string' &&
    typeof value.copperSpent === 'number' &&
    Array.isArray(value.remainingItems) &&
    typeof value.nextAutoRefreshMs === 'number'
  );
}

function toGameApiError(action: BlackMarketActionName, error: unknown) {
  if (error instanceof GameApiError) {
    return error;
  }
  return new GameApiError({
    action,
    kind: 'unknown',
    reason: 'UNKNOWN',
    userMessage: '发生了未识别的黑市错误，请稍后重试。',
    debugMessage: error instanceof Error ? error.message : `Unknown error while handling ${action}`,
    apiBaseUrl: window.location.origin,
  });
}

const BlackMarketContext = React.createContext<ReturnType<typeof useBlackMarketImpl> | null>(null);

export function BlackMarketProvider({ children }: { children: React.ReactNode }) {
  const value = useBlackMarketImpl();
  return React.createElement(BlackMarketContext.Provider, { value }, children);
}

export function useBlackMarket() {
  const context = React.useContext(BlackMarketContext);
  if (!context) {
    throw new Error('useBlackMarket must be used within a BlackMarketProvider');
  }
  return context;
}

function useBlackMarketImpl() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [market, setMarket] = useState<BlackMarketView | null>(null);
  const [apiError, setApiError] = useState<GameApiError | null>(null);
  const [pendingOperation, setPendingOperation] = useState<PendingOperation>(null);

  const applyErrorState = useCallback((action: BlackMarketActionName, error: GameApiError) => {
    setApiError(error);
  }, []);

  const loadMarket = useCallback(async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await postGameAction<unknown>('REFRESH_BLACKMARKET', { force: false });
      
      if (!isBlackMarketView(response.data)) {
        throw new Error('Invalid API Response for REFRESH_BLACKMARKET');
      }

      setMarket(response.data);
      setApiError(null);
    } catch (error) {
      applyErrorState('REFRESH_BLACKMARKET', toGameApiError('REFRESH_BLACKMARKET', error));
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [applyErrorState]);

  const refreshMarket = useCallback(async (force = true) => {
    if (pendingOperation) return false;
    setPendingOperation({ action: 'REFRESH_BLACKMARKET' });

    try {
      const response = await postGameAction<unknown>('REFRESH_BLACKMARKET', { force });
      
      if (!isBlackMarketView(response.data)) {
        throw new Error('Invalid API Response for REFRESH_BLACKMARKET');
      }

      setMarket(response.data);
      setApiError(null);
      return true;
    } catch (error) {
      applyErrorState('REFRESH_BLACKMARKET', toGameApiError('REFRESH_BLACKMARKET', error));
      return false;
    } finally {
      setPendingOperation(null);
    }
  }, [applyErrorState, pendingOperation]);

  const buyAndEquip = useCallback(async (itemId: string) => {
    if (pendingOperation) return false;
    setPendingOperation({ action: 'BUY_AND_EQUIP_ITEM', itemId });

    try {
      const response = await postGameAction<unknown>('BUY_AND_EQUIP_ITEM', { itemId });
      
      if (!isBuyAndEquipView(response.data)) {
        throw new Error('Invalid API Response for BUY_AND_EQUIP_ITEM');
      }

      // Update the market state from the response remaining items
      setMarket(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: response.data.remainingItems,
          nextAutoRefreshMs: response.data.nextAutoRefreshMs
        };
      });
      setApiError(null);
      return true;
    } catch (error) {
      const apiFailure = toGameApiError('BUY_AND_EQUIP_ITEM', error);
      applyErrorState('BUY_AND_EQUIP_ITEM', apiFailure);
      if (shouldResyncForError(apiFailure)) {
        await loadMarket(true);
      }
      return false;
    } finally {
      setPendingOperation(null);
    }
  }, [applyErrorState, loadMarket, pendingOperation]);

  const buyItem = useCallback(async (itemId: string) => {
    // ⚠️ MOCK FOR NOW: Server Agent is implementing BUY_ITEM
    if (pendingOperation) return false;
    setPendingOperation({ action: 'BUY_AND_EQUIP_ITEM', itemId }); // using same action name temporarily for pending state
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Remove item from market locally
      setMarket(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter(i => i.id !== itemId)
        };
      });
      return true;
    } finally {
      setPendingOperation(null);
    }
  }, [pendingOperation]);

  const sellItem = useCallback(async (itemId: string) => {
    // ⚠️ MOCK FOR NOW: Server Agent is implementing SELL_ITEM
    if (pendingOperation) return false;
    setPendingOperation({ action: 'REFRESH_BLACKMARKET' }); // random pending state
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    } finally {
      setPendingOperation(null);
    }
  }, [pendingOperation]);

  return {
    loading,
    refreshing,
    market,
    apiError,
    pendingOperation,
    loadMarket,
    refreshMarket,
    buyAndEquip,
    buyItem,
    sellItem,
  };
}
