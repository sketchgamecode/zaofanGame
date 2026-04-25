import { useState } from 'react';
import type { GameState } from '@core/gameState';
import { getTotalAttributes, getTotalArmor } from '@core/gameState';
import { MathCore, checkLevelUp } from '@core/mathCore';
import { simulateBattle, type Combatant } from '@core/battleCore';
import { DUNGEON_CHAPTERS } from '@data/dungeonTable';

interface Props { gameState: GameState; setGameState: (u: GameState | ((p: GameState) => GameState)) => void; }

function getToday() { return new Date().toISOString().slice(0, 10); }

export function DungeonScreen({ gameState, setGameState }: Props) {
  const [lastResult, setLastResult] = useState<{ win: boolean; bossName: string; xp: number; coin: number } | null>(null);

  const today = getToday();
  const dailyAttempt = gameState.dungeonDailyAttempt ?? { date: '', used: 0 };
  const usedToday = dailyAttempt.date === today ? dailyAttempt.used : 0;
  const canChallenge = usedToday < 1;

  // Figure out which chapter/boss is current
  const chapterKey = (id: string) => id;
  const progress = gameState.dungeonProgress ?? {};
  
  // Find first incomplete chapter
  let currentChapter = DUNGEON_CHAPTERS[0];
  let currentBossIdx = 0;
  let allDone = false;

  for (const ch of DUNGEON_CHAPTERS) {
    const beaten = progress[ch.id] ?? 0;
    if (beaten < ch.bosses.length) {
      currentChapter = ch;
      currentBossIdx = beaten;
      break;
    }
    if (ch === DUNGEON_CHAPTERS[DUNGEON_CHAPTERS.length - 1]) allDone = true;
  }

  const currentBoss = currentChapter.bosses[currentBossIdx];

  const challenge = () => {
    if (!canChallenge || !currentBoss) return;
    const pAttrs = getTotalAttributes(gameState).total;
    const pArmor = getTotalArmor(gameState);
    const pC: Combatant = {
      name: '无名好汉', level: gameState.playerLevel, classId: gameState.classId,
      attributes: pAttrs, armor: pArmor,
      weaponDamage: gameState.equipped?.mainHand?.weaponDamage ?? { min: gameState.playerLevel * 2, max: gameState.playerLevel * 4 },
      hasShield: gameState.equipped?.offHand?.subType === 'shield',
    };
    const bossC: Combatant = {
      name: currentBoss.name, level: currentBoss.level, classId: currentBoss.class,
      attributes: {
        strength: currentBoss.attributes.strength,
        agility: currentBoss.attributes.dexterity,
        intelligence: currentBoss.attributes.intelligence,
        constitution: currentBoss.attributes.constitution,
        luck: currentBoss.attributes.luck,
      },
      armor: currentBoss.armor,
      weaponDamage: { min: Math.floor(currentBoss.weaponDamage * 0.8), max: Math.floor(currentBoss.weaponDamage * 1.2) },
      hasShield: false,
    };

    const result = simulateBattle(pC, bossC);
    const newProgress = { ...progress };
    if (result.pWin) {
      newProgress[currentChapter.id] = (newProgress[currentChapter.id] ?? 0) + 1;
    }

    setLastResult({ win: result.pWin, bossName: currentBoss.name, xp: result.pWin ? currentBoss.rewardXp : 0, coin: result.pWin ? currentBoss.rewardCoins : 0 });

    setGameState(prev => {
      const rawExp = (prev.exp ?? 0) + (result.pWin ? currentBoss.rewardXp : 0);
      const { newLevel, newExp } = checkLevelUp(prev.playerLevel, rawExp);
      return {
        ...prev,
        playerLevel: newLevel, exp: newExp,
        dungeonProgress: newProgress,
        dungeonDailyAttempt: { date: today, used: usedToday + 1 },
        resources: { ...prev.resources, copper: prev.resources.copper + (result.pWin ? currentBoss.rewardCoins : 0) },
      };
    });
  };

  return (
    <div className="screen">
      <div className="card">
        <div className="card-title">{currentChapter.name}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
          解锁等级 Lv.{currentChapter.unlockLevel} · 今日次数 {usedToday}/1
        </div>

        {currentChapter.bosses.map((boss, idx) => {
          const beaten = (progress[currentChapter.id] ?? 0) > idx;
          const isCurrent = idx === currentBossIdx;
          return (
            <div className="boss-row" key={boss.id}>
              <div className="boss-status">{beaten ? '✅' : isCurrent ? '▶' : '🔒'}</div>
              <div className="boss-info">
                <div className="boss-name" style={{ color: isCurrent ? 'var(--gold)' : beaten ? 'var(--muted)' : 'var(--text)' }}>{boss.name}</div>
                <div className="boss-attr">Lv.{boss.level} · HP≈{boss.attributes.constitution * boss.level * 5} · 武力{boss.attributes.strength} 身法{boss.attributes.dexterity}</div>
              </div>
            </div>
          );
        })}
      </div>

      {lastResult && (
        <div className={`result-banner ${lastResult.win ? 'win' : 'loss'}`}>
          <div className="result-title" style={{ color: lastResult.win ? 'var(--green)' : 'var(--red)' }}>{lastResult.win ? '讨伐成功' : '落败而逃'}</div>
          <div className="result-meta">
            {lastResult.win ? `击败 ${lastResult.bossName} · +${lastResult.xp}XP · +${lastResult.coin}🪙` : `败于 ${lastResult.bossName}`}
          </div>
        </div>
      )}

      {!allDone && currentBoss && (
        <button className="btn btn-primary" disabled={!canChallenge} onClick={challenge}>
          {canChallenge ? `⚔️ 挑战 ${currentBoss.name}` : '今日次数已用（明日再战）'}
        </button>
      )}

      {allDone && <div className="empty">🏆 所有副本已通关！</div>}
    </div>
  );
}
