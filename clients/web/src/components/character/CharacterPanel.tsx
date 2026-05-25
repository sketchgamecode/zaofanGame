/**
 * CharacterPanel.tsx
 *
 * 角色信息主面板，跨场景复用组件（背包、商店等）。
 * 使用 DroppableSlot + ItemSlot，不再自持 tooltip 状态。
 */

import { CLASS_META, getAvatarUrl } from '../../config/characterCatalog';
import { getNextLevelXp } from '../../config/xpTable';
import { useItemTooltip } from '../../state/tooltipStore';
import { DroppableSlot } from '../ui/DroppableSlot';
import { DraggableItemSlot, ItemSlot } from '../ui/ItemSlot';
import { CharacterPortraitCard } from './CharacterPortraitCard';
import {
  ATTRIBUTE_KEYS,
  EQUIPMENT_SLOTS,
  type AttributeKey,
  type CharacterInfoView,
  type EquipmentItem,
  type EquipmentSlot,
} from '../../types/game';

type CharacterPanelProps = {
  character: CharacterInfoView;
  highlightedEquipmentSlot?: EquipmentSlot | null;
  pendingAction: string | null;
  onUpgradeAttribute: (attribute: AttributeKey) => void;
};

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  strength: '膂力',
  intelligence: '谋略',
  agility: '身法',
  constitution: '根骨',
  luck: '气运',
};

type DerivedStat = {
  label: string;
  value: string;
  hint: string;
};

function formatBp(bp = 0) {
  return `${(bp / 100).toFixed(2)}%`;
}

function getDerivedStats(character: CharacterInfoView, armorCap: number): DerivedStat[] {
  const reduction = Math.min(
    armorCap,
    Math.floor(character.combatPreview.armor / Math.max(1, character.player.level)),
  );

  return [
    {
      label: '杀伤',
      value: `${character.combatPreview.damageMin} - ${character.combatPreview.damageMax}`,
      hint: '普通出手可造成的伤害范围，受武器和相关属性影响。',
    },
    {
      label: '气血',
      value: character.combatPreview.hp.toLocaleString(),
      hint: '战斗中可承受的伤害总量，气血归零则战败。',
    },
    {
      label: '甲胄',
      value: `${character.combatPreview.armor}`,
      hint: '装备提供的防护总值，会换算为减伤比例。',
    },
    {
      label: '减伤',
      value: `${reduction}%`,
      hint: '甲胄换算出的伤害减免比例，受等级和职业上限影响。',
    },
    {
      label: '会心',
      value: formatBp(character.combatPreview.critChanceBp),
      hint: '造成更高伤害的几率。',
    },
    {
      label: '闪避',
      value: formatBp(character.combatPreview.dodgeChanceBp),
      hint: '避开敌方攻击的几率。',
    },
  ];
}

// ── 装备槽格子 ────────────────────────────────────────────────────
function EquipmentSlotCell({
  highlighted,
  slot,
  item,
}: {
  highlighted: boolean;
  slot: EquipmentSlot;
  item: EquipmentItem | null;
}) {
  return (
    <DroppableSlot
      className={`character-panel__equip-slot character-panel__equip-slot--${slot}${highlighted ? ' character-panel__equip-slot--hint' : ''}`}
      droppableId={`equip-slot:${slot}`}
      data={{ type: 'equip-slot', slot }}
    >
      {(isOver) =>
        item ? (
          <DraggableItemSlot
            isHighlighted={highlighted || isOver}
            item={item}
            slot={slot}
            source="equipment"
            variant="equipment"
          />
        ) : (
          <ItemSlot isHighlighted={highlighted} isOver={isOver} item={null} variant="equipment" />
        )
      }
    </DroppableSlot>
  );
}

// ── 属性行 ────────────────────────────────────────────────────────
function StatRow({
  character,
  attribute,
  pendingAction,
  onUpgradeAttribute,
}: {
  character: CharacterInfoView;
  attribute: AttributeKey;
  pendingAction: string | null;
  onUpgradeAttribute: CharacterPanelProps['onUpgradeAttribute'];
}) {
  const base = character.attributes.base[attribute];
  const total = character.attributes.total[attribute];
  const equipment = total - base;
  const upgradeCost = character.attributes.upgradeCosts[attribute];
  const canUpgrade = character.resources.copper >= upgradeCost && pendingAction === null;

  return (
    <div className="character-panel__stat-row" tabIndex={0}>
      <div className="character-panel__stat-main">
        <div className="character-panel__stat-head">
          <span>{ATTRIBUTE_LABELS[attribute]}</span>
          <span>{total}</span>
        </div>
      </div>
      <button
        className="character-panel__upgrade"
        disabled={!canUpgrade}
        title={`升级消耗 ${upgradeCost} 铜钱`}
        type="button"
        onClick={() => onUpgradeAttribute(attribute)}
      >
        +
      </button>
      <span className="character-panel__stat-hint" role="tooltip">
        根基 {base}，装备 {equipment >= 0 ? `+${equipment}` : equipment}。升级消耗 {upgradeCost} 铜钱。
      </span>
    </div>
  );
}

function DerivedStatRow({ hint, label, value }: DerivedStat) {
  return (
    <div className="character-panel__derived-row" tabIndex={0}>
      <span className="character-panel__derived-label">
        {label}
        <span aria-hidden="true" className="character-panel__derived-info">?</span>
      </span>
      <strong>{value}</strong>
      <span className="character-panel__derived-hint" role="tooltip">
        {hint}
      </span>
    </div>
  );
}

// ── CharacterPanel ────────────────────────────────────────────────
export function CharacterPanel({
  character,
  highlightedEquipmentSlot = null,
  pendingAction,
  onUpgradeAttribute,
}: CharacterPanelProps) {
  const { tooltip } = useItemTooltip();
  const classMeta = CLASS_META[character.player.classId];
  const nextLevelXp = getNextLevelXp(character.player.level);
  const xpProgress = Math.min(1, Math.max(0, character.player.exp / Math.max(1, nextLevelXp)));
  const activeHighlightedSlot = highlightedEquipmentSlot ?? tooltip?.item.slot ?? null;
  const derivedStats = getDerivedStats(character, classMeta.armorCap);

  return (
    <section className="character-panel">
      <div className="character-panel__paper">
        <CharacterPortraitCard
          avatarUrl={getAvatarUrl(character.player.avatarId)}
          className="character-panel__portrait-card"
          level={character.player.level}
          name={character.player.displayName || '无名好汉'}
          rankText={`江湖排名 ${character.combatPreview.combatRating}`}
          showInfoButton
          title={classMeta.name}
          xpProgress={xpProgress}
        />
        <div className="character-panel__combat-rating" tabIndex={0}>
          <span>战力评分</span>
          <strong>{character.combatPreview.combatRating}</strong>
          <span className="character-panel__combat-rating-hint" role="tooltip">
            综合等级、属性、装备后的整体战斗评分。
          </span>
        </div>

        {/* 装备槽 */}
        {EQUIPMENT_SLOTS.map((slot) => (
          <EquipmentSlotCell
            key={slot}
            highlighted={activeHighlightedSlot === slot}
            item={character.equipment.equipped[slot]}
            slot={slot}
          />
        ))}

        {/* 属性区 */}
        <div className="character-panel__stats-grid">
          <div className="character-panel__primary-stats">
            {ATTRIBUTE_KEYS.map((attribute) => (
              <StatRow
                key={attribute}
                attribute={attribute}
                character={character}
                pendingAction={pendingAction}
                onUpgradeAttribute={onUpgradeAttribute}
              />
            ))}
          </div>
          <div className="character-panel__derived-stats">
            {derivedStats.map((stat) => (
              <DerivedStatRow key={stat.label} hint={stat.hint} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
