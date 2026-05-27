/**
 * CharacterPanel.tsx
 *
 * 角色信息主面板，跨场景复用组件（背包、商店等）。
 * 使用 DroppableSlot + ItemSlot，不再自持 tooltip 状态。
 */

import { useState } from 'react';
import {
  CLASS_META,
  getAvatarUrl,
  POWER_FACTION_BADGES,
  POWER_FACTION_HINTS,
  POWER_FACTION_LABELS,
} from '../../config/characterCatalog';
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
  type PowerFactionId,
} from '../../types/game';

export type CharacterPanelPosition = {
  positionId: string;
  locationName: string;
  title: string;
  serviceLabel: string;
  ownerLabel: string;
  incomeHint: string;
  replaceHint: string;
  statusLabel?: string;
};

type CharacterPanelProps = {
  character: CharacterInfoView;
  highlightedEquipmentSlot?: EquipmentSlot | null;
  pendingAction: string | null;
  onUpgradeAttribute?: (attribute: AttributeKey) => void;
  positions?: CharacterPanelPosition[];
  readOnly?: boolean;
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

function getTopSuspicion(
  suspicion: CharacterInfoView['player']['suspicion'],
): { faction: PowerFactionId; value: number } | null {
  const entries = Object.entries(suspicion ?? {})
    .filter((entry): entry is [PowerFactionId, number] => typeof entry[1] === 'number' && entry[1] > 0)
    .sort((a, b) => b[1] - a[1]);

  const top = entries[0];
  return top ? { faction: top[0], value: top[1] } : null;
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
      hint: '甲胄换算出的伤害减免比例，受等级和职司上限影响。',
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
  readOnly,
}: {
  character: CharacterInfoView;
  attribute: AttributeKey;
  pendingAction: string | null;
  onUpgradeAttribute: CharacterPanelProps['onUpgradeAttribute'];
  readOnly: boolean;
}) {
  const base = character.attributes.base[attribute];
  const total = character.attributes.total[attribute];
  const equipment = total - base;
  const upgradeCost = character.attributes.upgradeCosts[attribute];
  const canUpgrade = !readOnly && Boolean(onUpgradeAttribute) && character.resources.copper >= upgradeCost && pendingAction === null;

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
        onClick={() => onUpgradeAttribute?.(attribute)}
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
function CharacterPanelPositions({ positions }: { positions: CharacterPanelPosition[] }) {
  if (positions.length === 0) {
    return (
      <div className="character-panel__positions-empty">
        <strong>暂无任职</strong>
        <span>此角色尚未占据可展示的场所职务。后续可在这里查看其任职地点、职务收益与可替代条件。</span>
      </div>
    );
  }

  return (
    <div className="character-panel__positions-list">
      {positions.map((position) => (
        <article key={position.positionId} className="character-panel__position-card">
          <div className="character-panel__position-head">
            <span>{position.locationName}</span>
            <strong>{position.title}</strong>
          </div>
          <div className="character-panel__position-meta">
            <span>{position.ownerLabel}</span>
            <span>{position.serviceLabel}</span>
            {position.statusLabel ? <span>{position.statusLabel}</span> : null}
          </div>
          <p>{position.incomeHint}</p>
          <p>{position.replaceHint}</p>
        </article>
      ))}
    </div>
  );
}

export function CharacterPanel({
  character,
  highlightedEquipmentSlot = null,
  pendingAction,
  onUpgradeAttribute,
  positions = [],
  readOnly = false,
}: CharacterPanelProps) {
  const [activeTab, setActiveTab] = useState<'attributes' | 'positions'>('attributes');
  const { tooltip } = useItemTooltip();
  const classMeta = CLASS_META[character.player.classId];
  const powerFaction = classMeta.powerFaction;
  const originFaction = character.player.powerFaction;
  const powerBadge = powerFaction ? POWER_FACTION_BADGES[powerFaction] : '未入权局';
  const powerLabel = powerFaction ? POWER_FACTION_LABELS[powerFaction] : '未定';
  const powerHint = powerFaction
    ? POWER_FACTION_HINTS[powerFaction]
    : '旧存档尚未写入权力归属。重新创建角色后会按出身自动归属。';
  const topSuspicion = getTopSuspicion(character.player.suspicion);
  const suspicionHint = topSuspicion
    ? `当前最受猜疑：${POWER_FACTION_LABELS[topSuspicion.faction]} ${topSuspicion.value}。`
    : '当前尚无明显牵连。';
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
          rankText={`${powerBadge} · 官声排名 ${character.combatPreview.combatRating}`}
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
        <div className="character-panel__power-affiliation" tabIndex={0}>
          <span>权力归属</span>
          <strong>{powerLabel}</strong>
          <span className="character-panel__power-affiliation-hint" role="tooltip">
            {powerHint}
            <br />
            {originFaction ? `出身牵连：${POWER_FACTION_LABELS[originFaction]}。` : '出身牵连尚未写入。'}
            <br />
            {suspicionHint}
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
        <div className="character-panel__tabs" role="tablist" aria-label="角色详情分页">
          <button
            className={`character-panel__tab${activeTab === 'attributes' ? ' character-panel__tab--active' : ''}`}
            role="tab"
            type="button"
            aria-selected={activeTab === 'attributes'}
            onClick={() => setActiveTab('attributes')}
          >
            属性
          </button>
          <button
            className={`character-panel__tab${activeTab === 'positions' ? ' character-panel__tab--active' : ''}`}
            role="tab"
            type="button"
            aria-selected={activeTab === 'positions'}
            onClick={() => setActiveTab('positions')}
          >
            任职
          </button>
        </div>

        <div className="character-panel__tab-body">
          {activeTab === 'attributes' ? (
            <div className="character-panel__stats-grid">
              <div className="character-panel__primary-stats">
                {ATTRIBUTE_KEYS.map((attribute) => (
                  <StatRow
                    key={attribute}
                    attribute={attribute}
                    character={character}
                    pendingAction={pendingAction}
                    readOnly={readOnly}
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
          ) : (
            <CharacterPanelPositions positions={positions} />
          )}
        </div>

      </div>
    </section>
  );
}
