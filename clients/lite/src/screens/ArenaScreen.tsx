import { useState } from 'react';
import type { GameState } from '@core/gameState';
import { getTotalAttributes, getTotalArmor } from '@core/gameState';
import { MathCore, CLASS_CONFIG, checkLevelUp } from '@core/mathCore';
import { simulateBattle, type Combatant } from '@core/battleCore';
import { XP_TABLE } from '@data/xpTable';

interface Props { gameState: GameState; setGameState: (u: GameState | ((p: GameState) => GameState)) => void; }

function genNPC(playerLevel: number, prestige: number): Combatant & { prestige: number; avatar: string } {
  const classIds = ['CLASS_A', 'CLASS_B', 'CLASS_C', 'CLASS_D'] as const;
  const classId = classIds[Math.floor(Math.random() * 4)];
  const lv = Math.max(1, playerLevel + Math.floor((Math.random() - 0.5) * 4));
  const b = lv * 8;
  const rnd = () => Math.floor(b * (0.8 + Math.random() * 0.4));
  const names = ['落魄游侠', '失意剑客', '草莽英雄', '野路子', '独行大盗', '行走的刀'];
  return {
    name: names[Math.floor(Math.random() * names.length)],
    level: lv, classId,
    attributes: { strength: rnd(), intelligence: rnd(), agility: rnd(), constitution: rnd(), luck: rnd() },
    armor: Math.floor(b * 0.5),
    weaponDamage: { min: Math.floor(b * 0.6), max: Math.floor(b * 1.2) },
    hasShield: classId === 'CLASS_A',
    prestige: Math.max(0, prestige + Math.floor((Math.random() - 0.5) * 600)),
    avatar: ['🥷','👺','👹','💀','🧔','👳'][Math.floor(Math.random() * 6)],
  };
}

function getToday() { return new Date().toISOString().slice(0, 10); }

export function ArenaScreen({ gameState, setGameState }: Props) {
  const [opponents, setOpponents] = useState(() => Array.from({ length: 3 }, () => genNPC(gameState.playerLevel, gameState.resources.prestige)));
  const [lastResult, setLastResult] = useState<{ win: boolean; xp: number; coin: number; prestige: number } | null>(null);

  const today = getToday();
  const dailyXP = gameState.arenaDailyXP || { date: '', wins: 0 };
  const winsToday = dailyXP.date === today ? dailyXP.wins : 0;
  const xpLeft = Math.max(0, 10 - winsToday);
  const cdEnd = gameState.arenaCooldownEndTime ?? 0;
  const inCD = cdEnd > Date.now();
  const cdSecs = Math.max(0, Math.ceil((cdEnd - Date.now()) / 1000));

  const pAttrs = getTotalAttributes(gameState).total;
  const pArmor = getTotalArmor(gameState);
  const pC: Combatant = {
    name: '无名好汉', level: gameState.playerLevel, classId: gameState.classId,
    attributes: pAttrs, armor: pArmor,
    weaponDamage: gameState.equipped?.mainHand?.weaponDamage ?? { min: gameState.playerLevel * 2, max: gameState.playerLevel * 4 },
    hasShield: gameState.equipped?.offHand?.subType === 'shield',
  };

  const fight = (opp: typeof opponents[0]) => {
    if (inCD) return;
    const result = simulateBattle(pC, opp);
    const newCD = Date.now() + 10 * 60 * 1000;
    let xpGain = 0, coinGain = 0, prestigeDiff = 0;

    if (result.pWin) {
      if (xpLeft > 0) xpGain = Math.floor((XP_TABLE[gameState.playerLevel] ?? 400) * 0.05);
      prestigeDiff = Math.max(0, Math.floor(10 + (opp.prestige - gameState.resources.prestige) * 0.1));
      coinGain = Math.floor(opp.level * 20 * (1 + Math.random() * 0.2));
    } else {
      prestigeDiff = -Math.max(5, Math.floor(gameState.resources.prestige * 0.02));
    }

    setLastResult({ win: result.pWin, xp: xpGain, coin: coinGain, prestige: prestigeDiff });
    setGameState(prev => {
      const newWins = (prev.arenaDailyXP?.date === today ? (prev.arenaDailyXP?.wins ?? 0) : 0) + (result.pWin ? 1 : 0);
      const rawExp = (prev.exp ?? 0) + xpGain;
      const { newLevel, newExp } = checkLevelUp(prev.playerLevel, rawExp);
      return {
        ...prev, playerLevel: newLevel, exp: newExp,
        arenaWins: (prev.arenaWins ?? 0) + (result.pWin ? 1 : 0),
        arenaCooldownEndTime: newCD,
        arenaDailyXP: { date: today, wins: newWins },
        resources: { ...prev.resources, copper: prev.resources.copper + coinGain, prestige: Math.max(0, prev.resources.prestige + prestigeDiff) },
      };
    });
    setOpponents(Array.from({ length: 3 }, () => genNPC(gameState.playerLevel, gameState.resources.prestige)));
  };

  return (
    <div className="screen">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>每日XP战 <strong style={{ color: 'var(--gold)' }}>{winsToday}/10</strong></span>
        {inCD
          ? <span style={{ fontFamily: 'var(--mono)', color: 'var(--red)', fontSize: 13 }}>冷却 {Math.floor(cdSecs / 60)}:{(cdSecs % 60).toString().padStart(2, '0')}</span>
          : <span style={{ color: 'var(--green)', fontSize: 12 }}>✅ 可出战</span>
        }
      </div>

      {lastResult && (
        <div className={`result-banner ${lastResult.win ? 'win' : 'loss'}`}>
          <div className="result-title" style={{ color: lastResult.win ? 'var(--green)' : 'var(--red)' }}>{lastResult.win ? '胜利' : '失败'}</div>
          <div className="result-meta">
            {lastResult.win ? `+${lastResult.xp} XP · +${lastResult.coin}🪙 · 声望 +${lastResult.prestige}` : `声望 ${lastResult.prestige}`}
          </div>
        </div>
      )}

      {opponents.map((opp, i) => {
        const oppHP = MathCore.getMaxHP(opp.attributes.constitution, opp.level, opp.classId);
        const pHP = MathCore.getMaxHP(pAttrs.constitution, gameState.playerLevel, gameState.classId);
        const pd = opp.prestige - gameState.resources.prestige;
        return (
          <div className="opponent-card" key={i}>
            <div className="opp-header">
              <div>
                <div style={{ fontSize: 18 }}>{opp.avatar}</div>
                <div className="opp-name">{opp.name}</div>
                <div className="opp-level">Lv.{opp.level} · 声望 {opp.prestige} <span className={pd >= 0 ? 'diff-pos' : 'diff-neg'}>{pd >= 0 ? '+' : ''}{pd}</span></div>
              </div>
              <button className="btn btn-primary btn-sm" disabled={inCD} onClick={() => fight(opp)}>挑战</button>
            </div>
            <div className="mini-stats">
              <span>HP <span>{oppHP}</span><span className={oppHP >= pHP ? 'diff-neg' : 'diff-pos'} style={{ marginLeft: 4 }}>{oppHP - pHP > 0 ? '+' : ''}{oppHP - pHP}</span></span>
              <span>武力 <span>{opp.attributes.strength}</span></span>
              <span>身法 <span>{opp.attributes.agility}</span></span>
            </div>
          </div>
        );
      })}
      <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setOpponents(Array.from({ length: 3 }, () => genNPC(gameState.playerLevel, gameState.resources.prestige)))}>🔄 换一批对手</button>
    </div>
  );
}
