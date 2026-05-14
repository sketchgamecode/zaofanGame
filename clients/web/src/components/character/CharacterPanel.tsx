import { useDroppable } from '@dnd-kit/core';
import { CLASS_META, getAvatarUrl } from '../../config/characterCatalog';
import { getNextLevelXp } from '../../config/xpTable';
import { DraggableItemSlot, ItemSlot } from '../ui/ItemSlot';
import type { ItemTooltipState } from '../ui/ItemTooltip';
import {
  ATTRIBUTE_KEYS,
  EQUIPMENT_SLOT_LABELS,
  EQUIPMENT_SLOTS,
  type AttributeKey,
  type CharacterInfoView,
  type EquipmentItem,
  type EquipmentSlot,
} from '../../types/game';

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

function EquipmentSlotCell({
  slot,
  item,
  onItemTooltipChange,
  className,
}: {
  slot: EquipmentSlot;
  item: EquipmentItem | null;
  onItemTooltipChange: CharacterPanelProps['onItemTooltipChange'];
  className?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `equip-slot:${slot}`,
    data: {
      type: 'equip-slot',
      slot,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`character-panel__equip-slot character-panel__equip-slot--${slot}${className ? ` ${className}` : ''}${isOver ? ' character-panel__equip-slot--over' : ''}`}
    >
      {item ? (
        <DraggableItemSlot
          compact
          item={item}
          label={EQUIPMENT_SLOT_LABELS[slot]}
          slot={slot}
          source="equipment"
          onItemTooltipChange={onItemTooltipChange}
        />
      ) : (
        <ItemSlot compact isDropTarget={isOver} item={null} label={EQUIPMENT_SLOT_LABELS[slot]} />
      )}
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

  return (
    <section className="character-panel">
      <div className="character-panel__paper">
        <div className="character-panel__portrait-frame">
          <img
            alt={character.player.displayName || '角色头像'}
            className="character-panel__portrait"
            src={getAvatarUrl(character.player.avatarId)}
          />
          <button className="character-panel__info-button" type="button">i</button>
          <div className="character-panel__nameplate">
            <div>{character.player.displayName || '无名好汉'}</div>
            <small>{classMeta.name}</small>
          </div>
        </div>

        <div className="character-panel__level-bar">
          <div className="character-panel__xp-fill" style={{ width: `${xpProgress * 100}%` }} />
          <span>Level {character.player.level}</span>
        </div>

        {EQUIPMENT_SLOTS.map((slot) => (
          <EquipmentSlotCell
            key={slot}
            slot={slot}
            item={character.equipment.equipped[slot]}
            onItemTooltipChange={onItemTooltipChange}
          />
        ))}

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

        <div className="character-panel__bottom-slots">
          <div className="character-panel__potion-slot" />
          <div className="character-panel__potion-slot" />
          <div className="character-panel__potion-slot" />
        </div>
        <div className="character-panel__special-slot" />
      </div>
    </section>
  );
}
