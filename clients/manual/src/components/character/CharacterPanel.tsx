import {
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CLASS_META, getAvatarUrl } from '../../config/characterCatalog';
import { getNextLevelXp } from '../../config/xpTable';
import {
  ATTRIBUTE_KEYS,
  EQUIPMENT_SLOT_LABELS,
  EQUIPMENT_SLOTS,
  type AttributeKey,
  type CharacterInfoView,
  type EquipmentItem,
  type EquipmentSlot,
} from '../../types/game';

type ItemTooltipState = {
  item: EquipmentItem;
  x: number;
  y: number;
};

type CharacterPanelProps = {
  character: CharacterInfoView;
  pendingAction: string | null;
  onUpgradeAttribute: (attribute: AttributeKey) => void;
  onItemTooltipChange: (nextValue: ItemTooltipState | null) => void;
};

function getDerivedStat(character: CharacterInfoView, key: AttributeKey) {
  switch (key) {
    case 'strength':
      return {
        label: 'DEFENSE',
        value: `${character.combatPreview.armor}`,
      };
    case 'agility':
      return {
        label: 'DODGE',
        value: `${((character.combatPreview.dodgeChanceBp ?? 0) / 100).toFixed(2)}%`,
      };
    case 'intelligence':
      return {
        label: 'DAMAGE',
        value: `${character.combatPreview.damageMin} - ${character.combatPreview.damageMax}`,
      };
    case 'constitution':
      return {
        label: 'HIT POINTS',
        value: `${character.combatPreview.hp.toLocaleString()}`,
      };
    case 'luck':
      return {
        label: 'CRITICAL HIT',
        value: `${(character.combatPreview.critChanceBp / 100).toFixed(2)}%`,
      };
    default:
      return null;
  }
}

function DraggableEquipmentItem({
  item,
  onItemTooltipChange,
}: {
  item: EquipmentItem;
  onItemTooltipChange: CharacterPanelProps['onItemTooltipChange'];
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `equip-item:${item.id}`,
    data: {
      source: 'equipment',
      item,
    },
  });

  return (
    <button
      ref={setNodeRef}
      className="inventory-item-card inventory-item-card--equipped"
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.2 : 1,
      }}
      type="button"
      {...listeners}
      {...attributes}
      onPointerEnter={(event) => {
        onItemTooltipChange({
          item,
          x: event.clientX,
          y: event.clientY,
        });
      }}
      onPointerMove={(event) => {
        onItemTooltipChange({
          item,
          x: event.clientX,
          y: event.clientY,
        });
      }}
      onPointerLeave={() => onItemTooltipChange(null)}
    >
      <div className="inventory-item-card__name">{item.name}</div>
      <div className="inventory-item-card__sub">
        {item.armor ? `甲 ${item.armor}` : item.weaponDamage ? `伤 ${item.weaponDamage.min}-${item.weaponDamage.max}` : '装备'}
      </div>
    </button>
  );
}

function EquipmentSlotCell({
  slot,
  item,
  onItemTooltipChange,
}: {
  slot: EquipmentSlot;
  item: EquipmentItem | null;
  onItemTooltipChange: CharacterPanelProps['onItemTooltipChange'];
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `equip-slot:${slot}`,
    data: {
      type: 'equip-slot',
      slot,
    },
  });

  return (
    <div ref={setNodeRef} className={`character-panel__equip-slot${isOver ? ' character-panel__equip-slot--over' : ''}`}>
      <div className="character-panel__equip-label">{EQUIPMENT_SLOT_LABELS[slot]}</div>
      {item ? <DraggableEquipmentItem item={item} onItemTooltipChange={onItemTooltipChange} /> : null}
    </div>
  );
}

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
  const derived = getDerivedStat(character, attribute);
  const base = character.attributes.base[attribute];
  const total = character.attributes.total[attribute];
  const equipment = total - base;
  const upgradeCost = character.attributes.upgradeCosts[attribute];
  const canUpgrade = character.resources.copper >= upgradeCost && pendingAction === null;
  const labelMap: Record<AttributeKey, string> = {
    strength: 'STRENGTH',
    intelligence: 'INTELLIGENCE',
    agility: 'DEXTERITY',
    constitution: 'CONSTITUTION',
    luck: 'LUCK',
  };

  return (
    <div className="character-panel__stat-row">
      <div className="character-panel__stat-main">
        <div className="character-panel__stat-head">
          <span>{labelMap[attribute]}</span>
          <span>{total}</span>
        </div>
        {derived ? (
          <div className="character-panel__stat-derived">
            <span>{derived.label}</span>
            <span>{derived.value}</span>
          </div>
        ) : null}
        <div className="character-panel__stat-breakdown">
          <span>Basis {base}</span>
          <span>Equipment {equipment >= 0 ? `+${equipment}` : equipment}</span>
        </div>
      </div>
      <button
        className="character-panel__upgrade"
        type="button"
        disabled={!canUpgrade}
        title={`升级消耗 ${upgradeCost} 铜钱`}
        onClick={() => onUpgradeAttribute(attribute)}
      >
        +
      </button>
    </div>
  );
}

export function CharacterPanel({
  character,
  pendingAction,
  onUpgradeAttribute,
  onItemTooltipChange,
}: CharacterPanelProps) {
  const classMeta = CLASS_META[character.player.classId];
  const nextLevelXp = getNextLevelXp(character.player.level);
  const xpProgress = Math.min(1, Math.max(0, character.player.exp / Math.max(1, nextLevelXp)));
  const leftSlots = EQUIPMENT_SLOTS.slice(0, 4);
  const rightSlots = EQUIPMENT_SLOTS.slice(4, 8);
  const bottomSlots = EQUIPMENT_SLOTS.slice(8, 10);

  return (
    <section className="character-panel">
      <header className="character-panel__header">
        <div className="character-panel__avatar-frame">
          <img alt={character.player.displayName || '角色头像'} className="character-panel__avatar" src={getAvatarUrl(character.player.avatarId)} />
        </div>

        <div className="character-panel__header-copy">
          <div className="character-panel__name">{character.player.displayName || '无名好汉'}</div>
          <div className="character-panel__class">{classMeta.name}</div>
          <div className="character-panel__level-row">
            <span>Lv.{character.player.level}</span>
            <span>{character.player.exp} / {nextLevelXp}</span>
          </div>
          <div className="character-panel__xp-bar">
            <div className="character-panel__xp-fill" style={{ width: `${xpProgress * 100}%` }} />
          </div>
        </div>
      </header>

      <div className="character-panel__equip-layout">
        <div className="character-panel__equip-column">
          {leftSlots.map((slot) => (
            <EquipmentSlotCell
              key={slot}
              slot={slot}
              item={character.equipment.equipped[slot]}
              onItemTooltipChange={onItemTooltipChange}
            />
          ))}
        </div>

        <div className="character-panel__center">
          <div className="character-panel__hero-card">
            <img alt={character.player.displayName || '头像'} className="character-panel__hero-portrait" src={getAvatarUrl(character.player.avatarId)} />
          </div>

          <div className="character-panel__bottom-slots">
            {bottomSlots.map((slot) => (
              <EquipmentSlotCell
                key={slot}
                slot={slot}
                item={character.equipment.equipped[slot]}
                onItemTooltipChange={onItemTooltipChange}
              />
            ))}
          </div>
        </div>

        <div className="character-panel__equip-column">
          {rightSlots.map((slot) => (
            <EquipmentSlotCell
              key={slot}
              slot={slot}
              item={character.equipment.equipped[slot]}
              onItemTooltipChange={onItemTooltipChange}
            />
          ))}
        </div>
      </div>

      <div className="character-panel__tabs">
        <button className="character-panel__tab character-panel__tab--active" type="button">ATTRIBUTES</button>
        <button className="character-panel__tab" type="button">DESCRIPTION</button>
        <button className="character-panel__tab" type="button">INFO</button>
        <button className="character-panel__tab" type="button">INTERACTIONS</button>
      </div>

      <div className="character-panel__stats-grid">
        <div className="character-panel__stats-column">
          {ATTRIBUTE_KEYS.slice(0, 3).map((attribute) => (
            <StatRow
              key={attribute}
              attribute={attribute}
              character={character}
              pendingAction={pendingAction}
              onUpgradeAttribute={onUpgradeAttribute}
            />
          ))}
        </div>

        <div className="character-panel__stats-column">
          {ATTRIBUTE_KEYS.slice(3).map((attribute) => (
            <StatRow
              key={attribute}
              attribute={attribute}
              character={character}
              pendingAction={pendingAction}
              onUpgradeAttribute={onUpgradeAttribute}
            />
          ))}

          <div className="character-panel__stat-row character-panel__stat-row--static">
            <div className="character-panel__stat-main">
              <div className="character-panel__stat-head">
                <span>ARMOR</span>
                <span>{character.combatPreview.armor}</span>
              </div>
              <div className="character-panel__stat-derived">
                <span>DAMAGE RED.</span>
                <span>{Math.min(classMeta.armorCap, Math.floor(character.combatPreview.armor / Math.max(1, character.player.level)))}%</span>
              </div>
              <div className="character-panel__stat-breakdown">
                <span>Combat Rating</span>
                <span>{character.combatPreview.combatRating}</span>
              </div>
            </div>
            <div className="character-panel__upgrade character-panel__upgrade--ghost" />
          </div>
        </div>
      </div>
    </section>
  );
}
