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
  type OfficeLedgerEntry,
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
  ledgerEntries?: OfficeLedgerEntry[];
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

type CharacterPanelTab = 'attributes' | 'positions' | 'relations';

const PANEL_TAB_LABELS: Record<CharacterPanelTab, string> = {
  attributes: '\u5c5e\u6027',
  positions: '\u4efb\u804c',
  relations: '\u5173\u7cfb',
};

const POSITION_STATUS_LABELS: Record<string, string> = {
  bot_held: '\u521d\u59cb\u540d\u518c',
  player_held: '\u73a9\u5bb6\u4efb\u804c',
  vacant: '\u6682\u7f3a',
  locked: '\u672a\u5f00\u653e',
};

function formatPositionStatus(status?: string) {
  return status ? POSITION_STATUS_LABELS[status] ?? status : null;
}

function formatLedgerAmount(entry: OfficeLedgerEntry) {
  const parts = [
    entry.taxValueDelta ? `\u7a0e\u94b1 +${entry.taxValueDelta}` : null,
    entry.powerValueDelta ? `\u6743\u67c4 +${(entry.powerValueDelta / 100).toFixed(2)}%` : null,
  ].filter(Boolean);

  return parts.join(' / ') || '\u8bb0\u8d26';
}

function formatLedgerTime(createdAt: number) {
  if (!createdAt) {
    return '--';
  }

  return new Date(createdAt * 1000).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

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
function CharacterPanelPositions({
  ledgerEntries,
  positions,
}: {
  ledgerEntries: OfficeLedgerEntry[];
  positions: CharacterPanelPosition[];
}) {
  if (positions.length === 0) {
    return (
      <div className="character-panel__positions-empty">
        <strong>暂无任职</strong>
        <span>此角色尚未占据可展示的场所职务。后续可在这里查看其任职地点、职务收益与可替代条件。</span>
      </div>
    );
  }

  return (
    <div className="character-panel__positions-wrap">
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
              {formatPositionStatus(position.statusLabel) ? <span>{formatPositionStatus(position.statusLabel)}</span> : null}
            </div>
            <p><strong>{'\u6536\u76ca'}</strong>{position.incomeHint}</p>
            <p><strong>{'\u66ff\u4ee3'}</strong>{position.replaceHint}</p>
          </article>
        ))}
      </div>
      <section className="character-panel__ledger">
        <div className="character-panel__ledger-head">
          <strong>{'\u8fd1\u671f\u8fdb\u8d26'}</strong>
          <span>{ledgerEntries.length > 0 ? `${ledgerEntries.length} \u6761` : '\u5c1a\u65e0'}</span>
        </div>
        {ledgerEntries.length > 0 ? (
          <div className="character-panel__ledger-list">
            {ledgerEntries.slice(0, 5).map((entry) => (
              <article key={entry.entryId} className="character-panel__ledger-entry">
                <span>{formatLedgerTime(entry.createdAt)}</span>
                <strong>{formatLedgerAmount(entry)}</strong>
                <p>{entry.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="character-panel__ledger-empty">{'\u6b64\u89d2\u8272\u672c\u671f\u5c1a\u65e0\u53ef\u89c1\u7684\u4efb\u804c\u8fdb\u8d26\u3002'}</p>
        )}
      </section>
    </div>
  );
}

function CharacterPanelRelations({
  character,
  originFaction,
  powerFaction,
  powerHint,
  suspicionHint,
}: {
  character: CharacterInfoView;
  originFaction?: PowerFactionId;
  powerFaction?: PowerFactionId;
  powerHint: string;
  suspicionHint: string;
}) {
  const suspicionEntries = (Object.entries(character.player.suspicion ?? {}) as Array<[PowerFactionId, number]>)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .sort((left, right) => right[1] - left[1]);

  return (
    <div className="character-panel__relations">
      <section className="character-panel__relation-card">
        <span>{'\u5f53\u524d\u95e8\u8def'}</span>
        <strong>{powerFaction ? POWER_FACTION_LABELS[powerFaction] : '\u672a\u5b9a'}</strong>
        <p>{powerHint}</p>
      </section>
      <section className="character-panel__relation-card">
        <span>{'\u51fa\u8eab\u7275\u8fde'}</span>
        <strong>{originFaction ? POWER_FACTION_LABELS[originFaction] : '\u672a\u5199\u5165'}</strong>
        <p>{'\u51fa\u8eab\u662f\u5165\u4eac\u524d\u7684\u6839\u5e95\uff0c\u804c\u53f8\u662f\u5f53\u524d\u80fd\u8d70\u7684\u95e8\u8def\u3002\u4e24\u8005\u4e00\u8d77\u5f71\u54cd\u5404\u5904\u5bf9\u4f60\u7684\u6001\u5ea6\u3002'}</p>
      </section>
      <section className="character-panel__relation-card character-panel__relation-card--wide">
        <span>{'\u5404\u65b9\u7591\u5fc3'}</span>
        <strong>{suspicionHint}</strong>
        {suspicionEntries.length > 0 ? (
          <div className="character-panel__suspicion-grid">
            {suspicionEntries.map(([faction, value]) => (
              <div key={faction}>
                <span>{POWER_FACTION_LABELS[faction]}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p>{'\u5c1a\u672a\u88ab\u4efb\u4f55\u4e00\u65b9\u660e\u663e\u8bb0\u4e0a\u540d\u518c\u3002'}</p>
        )}
      </section>
    </div>
  );
}

export function CharacterPanel({
  character,
  highlightedEquipmentSlot = null,
  pendingAction,
  onUpgradeAttribute,
  ledgerEntries = [],
  positions = [],
  readOnly = false,
}: CharacterPanelProps) {
  const [activeTab, setActiveTab] = useState<CharacterPanelTab>('attributes');
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
          {(Object.keys(PANEL_TAB_LABELS) as CharacterPanelTab[]).map((tab) => (
            <button
              key={tab}
              className={`character-panel__tab${activeTab === tab ? ' character-panel__tab--active' : ''}`}
              role="tab"
              type="button"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              {PANEL_TAB_LABELS[tab]}
            </button>
          ))}
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
          ) : activeTab === 'positions' ? (
            <CharacterPanelPositions ledgerEntries={ledgerEntries} positions={positions} />
          ) : (
            <CharacterPanelRelations
              character={character}
              originFaction={originFaction}
              powerFaction={powerFaction}
              powerHint={powerHint}
              suspicionHint={suspicionHint}
            />
          )}
        </div>

      </div>
    </section>
  );
}
