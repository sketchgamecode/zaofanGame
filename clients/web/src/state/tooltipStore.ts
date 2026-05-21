/**
 * tooltipStore.ts
 *
 * 全局 Item Tooltip 状态管理。
 * 任何场景的 ItemSlot 都通过 useItemTooltip() 触发显示/隐藏，
 * 不再需要将 onItemTooltipChange 层层透传到顶层。
 *
 * OverlayRoot 通过 useItemTooltip() 读取状态并渲染 <ItemTooltip>。
 */

import { createContext, useContext, useState, type ReactNode } from 'react';
import { createElement } from 'react';
import type { EquipmentItem } from '../types/game';

export type ItemTooltipState = {
  item: EquipmentItem;
  priceMode?: 'buy' | 'sell';
  x: number;
  y: number;
};

type TooltipContextValue = {
  tooltip: ItemTooltipState | null;
  setTooltip: (nextState: ItemTooltipState | null) => void;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [tooltip, setTooltip] = useState<ItemTooltipState | null>(null);
  return createElement(TooltipContext.Provider, { value: { tooltip, setTooltip } }, children);
}

/** 任意组件内使用，读取或设置当前 tooltip 状态。 */
export function useItemTooltip(): TooltipContextValue {
  const ctx = useContext(TooltipContext);
  if (!ctx) {
    throw new Error('useItemTooltip must be used inside <TooltipProvider>');
  }
  return ctx;
}
