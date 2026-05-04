import type { EquipmentItem } from '../types/character';

const VARIANT_COUNT = 5;

/**
 * 动态获取装备图标的路径，实现零硬编码。
 * 映射规则：
 * - rarity <= 1 (普通/优秀): 使用槽位名称和伪随机种子 (id 末 4 位)
 * - rarity >= 2 (史诗以上): 直接使用装备 ID
 */
export function getEquipmentIconPath(item: EquipmentItem): string {
  if (item.rarity >= 2) {
    return `/assets/items/item_${item.id}.png`;
  }

  // 计算伪随机序号 1 ~ VARIANT_COUNT
  const seed = parseInt(item.id.slice(-4), 16) || 0;
  const index = (seed % VARIANT_COUNT) + 1;
  const indexStr = String(index).padStart(2, '0');

  return `/assets/items/item_${item.slot}_${indexStr}.png`;
}
