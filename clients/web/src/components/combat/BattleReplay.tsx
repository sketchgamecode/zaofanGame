import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CLASS_META, getAvatarUrl } from '../../config/characterCatalog';
import type { BattleHitEvent, BattleResultV2 } from '../../types/combat';

type BattleReplayAction = {
  key: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'quiet';
};

type BattleReplayProps = {
  battleResult: BattleResultV2;
  heading: string;
  subheading?: string;
  contextLabel?: string;
  resultBody?: ReactNode;
  actions?: BattleReplayAction[];
};

type PlaybackHit = {
  actionIndex: number;
  roundNumber: number;
  attacker: 'player' | 'enemy';
  hit: BattleHitEvent;
};

const HIT_STEP_MS = 440;

function flattenHits(battleResult: BattleResultV2): PlaybackHit[] {
  return battleResult.actions.flatMap((action) => action.hits.map((hit) => ({
    actionIndex: action.actionIndex,
    roundNumber: action.roundNumber,
    attacker: action.attacker,
    hit,
  })));
}

function getDisplayedHp(battleResult: BattleResultV2, hits: PlaybackHit[], shownHitCount: number) {
  let playerHp = battleResult.player.hpMax;
  let enemyHp = battleResult.enemy.hpMax;

  for (let index = 0; index < shownHitCount; index += 1) {
    const entry = hits[index];
    if (!entry) {
      break;
    }

    if (entry.hit.defender === 'player') {
      playerHp = entry.hit.targetHpAfter;
    } else {
      enemyHp = entry.hit.targetHpAfter;
    }
  }

  return { playerHp, enemyHp };
}

function describeHit(entry: PlaybackHit) {
  const parts: string[] = [];
  if (entry.hit.wasDodged) {
    parts.push('闪避');
  } else {
    if (entry.hit.wasBlocked) {
      parts.push('格挡');
    }
    if (entry.hit.wasCrit) {
      parts.push('暴击');
    }
    parts.push(`-${entry.hit.damage}`);
  }
  return parts.join(' · ');
}

export function BattleReplay({
  battleResult,
  heading,
  subheading,
  contextLabel,
  resultBody,
  actions = [],
}: BattleReplayProps) {
  const hits = useMemo(() => flattenHits(battleResult), [battleResult]);
  const [shownHitCount, setShownHitCount] = useState(0);
  const playbackComplete = shownHitCount >= hits.length;

  useEffect(() => {
    setShownHitCount(0);
  }, [battleResult]);

  useEffect(() => {
    if (playbackComplete) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setShownHitCount((previous) => previous + 1);
    }, HIT_STEP_MS);

    return () => window.clearTimeout(timerId);
  }, [playbackComplete, shownHitCount]);

  const hpState = useMemo(() => (
    playbackComplete
      ? {
          playerHp: battleResult.player.hpEnd,
          enemyHp: battleResult.enemy.hpEnd,
        }
      : getDisplayedHp(battleResult, hits, shownHitCount)
  ), [battleResult, hits, playbackComplete, shownHitCount]);

  const latestHit = shownHitCount > 0 ? hits[Math.min(shownHitCount - 1, hits.length - 1)] : null;
  const playerHpPercent = battleResult.player.hpMax > 0
    ? (hpState.playerHp / battleResult.player.hpMax) * 100
    : 0;
  const enemyHpPercent = battleResult.enemy.hpMax > 0
    ? (hpState.enemyHp / battleResult.enemy.hpMax) * 100
    : 0;

  return (
    <div className="battle-replay">
      <div className="battle-replay__stage">
        <header className="battle-replay__header">
          {contextLabel ? <div className="battle-replay__eyebrow">{contextLabel}</div> : null}
          <div className="battle-replay__title">{heading}</div>
          {subheading ? <div className="battle-replay__subtitle">{subheading}</div> : null}
        </header>

        <section className="battle-replay__side battle-replay__side--player">
          <div className="battle-replay__portrait-frame">
            <img
              alt={battleResult.player.name}
              className="battle-replay__portrait"
              src={getAvatarUrl(battleResult.player.avatarId ?? battleResult.player.snapshot.avatarId)}
            />
          </div>
          <div className="battle-replay__combatant-name">{battleResult.player.name}</div>
          <div className="battle-replay__combatant-meta">
            Lv.{battleResult.player.level} · {CLASS_META[battleResult.player.classId].name}
          </div>
          <div className="battle-replay__hp-bar">
            <div className="battle-replay__hp-fill battle-replay__hp-fill--player" style={{ width: `${playerHpPercent}%` }} />
          </div>
          <div className="battle-replay__hp-text">{hpState.playerHp} / {battleResult.player.hpMax}</div>
        </section>

        <section className="battle-replay__side battle-replay__side--enemy">
          <div className="battle-replay__portrait-frame">
            <img
              alt={battleResult.enemy.name}
              className="battle-replay__portrait"
              src={getAvatarUrl(battleResult.enemy.avatarId ?? battleResult.enemy.snapshot.avatarId)}
            />
          </div>
          <div className="battle-replay__combatant-name">{battleResult.enemy.name}</div>
          <div className="battle-replay__combatant-meta">
            Lv.{battleResult.enemy.level} · {CLASS_META[battleResult.enemy.classId].name}
          </div>
          <div className="battle-replay__hp-bar">
            <div className="battle-replay__hp-fill battle-replay__hp-fill--enemy" style={{ width: `${enemyHpPercent}%` }} />
          </div>
          <div className="battle-replay__hp-text">{hpState.enemyHp} / {battleResult.enemy.hpMax}</div>
        </section>

        <section className="battle-replay__log">
          {latestHit ? (
            <>
              <div className="battle-replay__round">第 {latestHit.roundNumber} 回合 · 动作 {latestHit.actionIndex + 1}</div>
              <div className="battle-replay__actor">
                {latestHit.attacker === 'player' ? battleResult.player.name : battleResult.enemy.name} 出手
              </div>
              <div className="battle-replay__damage">{describeHit(latestHit)}</div>
              <div className="battle-replay__detail">
                武器掷值 {latestHit.hit.rawWeaponRoll} · 目标剩余 HP {latestHit.hit.targetHpAfter}
              </div>
            </>
          ) : (
            <>
              <div className="battle-replay__round">战斗开始</div>
              <div className="battle-replay__actor">双方拉开架势</div>
              <div className="battle-replay__damage">等待第一击</div>
            </>
          )}
        </section>

        {!playbackComplete ? (
          <button className="battle-replay__skip" type="button" onClick={() => setShownHitCount(hits.length)}>
            跳过演示
          </button>
        ) : null}

        {playbackComplete ? (
          <div className="battle-replay__result-panel">
            <div className={`battle-replay__result-badge${battleResult.playerWon ? ' battle-replay__result-badge--win' : ' battle-replay__result-badge--lose'}`}>
              {battleResult.playerWon ? '胜' : '败'}
            </div>
            <div className="battle-replay__result-copy">
              历经 {battleResult.totalRounds} 回合 / {battleResult.totalActions} 次出手，
              {battleResult.endedBy === 'KNOCKOUT' ? ' 分出高下。' : ' 回合耗尽。'}
            </div>
            {resultBody ? <div className="battle-replay__result-body">{resultBody}</div> : null}
            {actions.length ? (
              <div className="battle-replay__result-actions">
                {actions.map((action) => (
                  <button
                    key={action.key}
                    className={`battle-replay__result-action battle-replay__result-action--${action.variant ?? 'primary'}`}
                    type="button"
                    disabled={action.disabled}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
