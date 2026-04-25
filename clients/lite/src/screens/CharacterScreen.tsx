import type { GameState } from '@core/gameState';
import { getTotalAttributes, getTotalArmor } from '@core/gameState';
import { MathCore, CLASS_CONFIG } from '@core/mathCore';
import { XP_TABLE } from '@data/xpTable';

interface Props { gameState: GameState; setGameState: (u: GameState | ((p: GameState) => GameState)) => void; }

const ATTR_LABELS: [keyof ReturnType<typeof getTotalAttributes>['total'], string, string][] = [
  ['strength', '武力', '⚔️'],
  ['agility', '身法', '💨'],
  ['intelligence', '智谋', '📖'],
  ['constitution', '体质', '🛡️'],
  ['luck', '福缘', '🍀'],
];

export function CharacterScreen({ gameState, setGameState }: Props) {
  const total = getTotalAttributes(gameState);
  const baseAttrs = gameState.attributes;
  const totalAttrs = total.total;
  const armor = getTotalArmor(gameState);
  const cls = CLASS_CONFIG[gameState.classId];
  const maxHP = MathCore.getMaxHP(totalAttrs.constitution, gameState.playerLevel, gameState.classId);
  const xpNeeded = XP_TABLE[gameState.playerLevel] ?? 9999;
  const xpPct = Math.min(100, (gameState.exp / xpNeeded) * 100);
  const res = gameState.resources;

  const upgrade = (attr: keyof typeof baseAttrs) => {
    const cost = MathCore.getUpgradeCost(baseAttrs[attr]);
    if (res.copper < cost) return;
    setGameState(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [attr]: prev.attributes[attr] + 1 },
      resources: { ...prev.resources, copper: prev.resources.copper - cost },
    }));
  };

  return (
    <div className="screen">
      {/* 角色概览 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>无名好汉</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Lv.{gameState.playerLevel} &nbsp;
              <span className={`tag tag-${gameState.classId.slice(-1).toLowerCase()}`}>{cls.name}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--mono)', color: 'var(--green)', fontSize: 13 }}>HP {maxHP}</div>
            <div style={{ fontFamily: 'var(--mono)', color: 'var(--muted)', fontSize: 11 }}>护甲 {armor}</div>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="xp-text">{gameState.exp} / {xpNeeded} XP</div>
          <div className="xp-bar-wrap"><div className="xp-bar-fill" style={{ width: `${xpPct}%` }} /></div>
        </div>
      </div>

      {/* 资源 */}
      <div className="card">
        <div className="card-title">资源</div>
        <div className="res-grid">
          <div className="res-item"><div className="res-item-label">🪙 铜钱</div><div className="res-item-value">{res.copper.toLocaleString()}</div></div>
          <div className="res-item"><div className="res-item-label">⭐ 声望</div><div className="res-item-value">{res.prestige.toLocaleString()}</div></div>
          <div className="res-item"><div className="res-item-label">🍚 干粮</div><div className="res-item-value">{res.rations}/100</div></div>
          <div className="res-item"><div className="res-item-label">💎 通宝</div><div className="res-item-value">{res.tokens}</div></div>
        </div>
      </div>

      {/* 属性 + 升级 */}
      <div className="card">
        <div className="card-title">属性升级</div>
        {ATTR_LABELS.map(([key, label, icon]) => {
          const base = baseAttrs[key as keyof typeof baseAttrs];
          const bonus = totalAttrs[key as keyof typeof totalAttrs] - base;
          const cost = MathCore.getUpgradeCost(base);
          const canAfford = res.copper >= cost;
          return (
            <div className="upgrade-row" key={key}>
              <span>{icon} {label}</span>
              <span className="upgrade-val">{totalAttrs[key as keyof typeof totalAttrs]}{bonus > 0 && <span className="stat-bonus">+{bonus}</span>}</span>
              <span className="upgrade-cost" style={{ color: canAfford ? 'var(--gold)' : 'var(--muted)' }}>{cost}🪙</span>
              <button className="upgrade-btn" disabled={!canAfford} onClick={() => upgrade(key as keyof typeof baseAttrs)}>＋</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
