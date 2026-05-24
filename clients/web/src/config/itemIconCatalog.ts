import type { EquipmentItem, EquipmentSlot } from '../types/game';

const ITEM_ICON_BASE_PATH = '/assets/items/icons';

const FALLBACK_ICON_BY_SLOT: Record<EquipmentSlot, string> = {
  head: 'item_head_placeholder',
  body: 'item_body_placeholder',
  hands: 'item_hands_placeholder',
  feet: 'item_feet_placeholder',
  neck: 'item_neck_placeholder',
  belt: 'item_belt_placeholder',
  ring: 'item_ring_placeholder',
  trinket: 'item_trinket_placeholder',
  weapon: 'item_weapon_placeholder',
  offHand: 'item_offhand_placeholder',
};

export function getItemIconUrl(item: EquipmentItem): string {
  const iconId = item.iconId ?? FALLBACK_ICON_BY_SLOT[item.slot];
  return `${ITEM_ICON_BASE_PATH}/${iconId}.png`;
}
