import { useState, useEffect } from 'react';
import type { GameState } from '@core/gameState';
import { checkLevelUp } from '@core/mathCore';
import { XP_TABLE } from '@data/xpTable';

interface Props { gameState: GameState; setGameState: (u: GameState | ((p: GameState) => GameState)) => void; }

const MISSION_TEMPLATES = [
  { type: 'A', name: '刺探情报', durationMin: 30, foodCost: 5, expMult: 0.10, coinMult: 0.20 },
  { type: 'B', name: '劫持粮道', durationMin: 90, foodCost: 15, expMult: 0.28, coinMult: 0.55 },
  { type: 'C', name: '攻打官兵', durationMin: 180, foodCost: 30, expMult: 0.50, coinMult: 1.0 },
];

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function MissionScreen({ gameState, setGameState }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);

  const active = gameState.activeMission;
  const remaining = active ? active.endTime - now : 0;
  const isDone = active && remaining <= 0;
  const xpNeeded = XP_TABLE[gameState.playerLevel] ?? 400;

  const startMission = (tpl: typeof MISSION_TEMPLATES[0]) => {
    if (gameState.resources.rations < tpl.foodCost) return;
    const endTime = Date.now() + tpl.durationMin * 60 * 1000;
    const expReward = Math.floor(xpNeeded * tpl.expMult * (0.9 + Math.random() * 0.2));
    const coinReward = Math.floor(gameState.playerLevel * 50 * tpl.coinMult * (0.9 + Math.random() * 0.2));
    setGameState(prev => ({
      ...prev,
      resources: { ...prev.resources, rations: prev.resources.rations - tpl.foodCost },
      activeMission: { id: `m_${Date.now()}`, type: tpl.type as any, name: tpl.name, durationSec: tpl.durationMin * 60, foodCost: tpl.foodCost, expReward, coinReward, dropRate: 0.1, endTime },
    }));
  };

  const collectReward = () => {
    if (!active) return;
    setGameState(prev => {
      const rawExp = (prev.exp ?? 0) + active.expReward;
      const { newLevel, newExp } = checkLevelUp(prev.playerLevel, rawExp);
      return {
        ...prev,
        playerLevel: newLevel,
        exp: newExp,
        resources: { ...prev.resources, copper: prev.resources.copper + active.coinReward },
        activeMission: null,
      };
    });
  };

  return (
    <div className="screen">
      {active && (
        <div className="mission-card active-mission">
          <div className="mission-type">进行中</div>
          <div className="mission-name">{active.name}</div>
          <div className="mission-meta">
            <span>奖励约 {active.expReward} XP</span>
            <span>{active.coinReward} 铜钱</span>
          </div>
          {isDone ? (
            <button className="btn btn-gold" style={{ width: '100%' }} onClick={collectReward}>✅ 领取奖励</button>
          ) : (
            <>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${Math.max(0, 100 - (remaining / (active.durationSec * 1000)) * 100)}%` }} />
              </div>
              <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', color: 'var(--gold)', fontSize: 20, marginBottom: 8 }}>{fmt(remaining)}</div>
            </>
          )}
        </div>
      )}

      {!active && (
        <>
          <div className="card">
            <div className="card-title">干粮 {gameState.resources.rations}/100 · 选择任务</div>
            {MISSION_TEMPLATES.map(tpl => {
              const canStart = gameState.resources.rations >= tpl.foodCost;
              const xpEst = Math.floor(xpNeeded * tpl.expMult);
              const coinEst = Math.floor(gameState.playerLevel * 50 * tpl.coinMult);
              return (
                <div className="mission-card" key={tpl.type} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <span className="mission-type">类型 {tpl.type}</span>
                      <div className="mission-name">{tpl.name}</div>
                    </div>
                    <button className="btn btn-primary btn-sm" disabled={!canStart} onClick={() => startMission(tpl)} style={{ width: 64 }}>出发</button>
                  </div>
                  <div className="mission-meta">
                    <span>⏱ {tpl.durationMin}分钟</span>
                    <span>🍚 -{tpl.foodCost}</span>
                    <span>≈{xpEst}XP</span>
                    <span>≈{coinEst}🪙</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
