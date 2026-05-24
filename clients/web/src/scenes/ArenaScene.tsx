import { useCallback, useEffect, useMemo, useState } from 'react';
import { postGameAction } from '../api/gameApi';
import { BattleReplay } from '../components/combat/BattleReplay';
import { CLASS_META, getAvatarUrl } from '../config/characterCatalog';
import { formatCountdown, formatSignedNumber } from '../lib/formatters';
import { toActionErrorMessage } from '../lib/manualErrors';
import { useGameState } from '../state/GameStateContext';
import type {
  ArenaFightData,
  ArenaGetInfoData,
  ArenaOpponentPreview,
  ArenaRefreshCandidatesData,
  ArenaSkipCooldownData,
  BattleResultV2,
} from '../types/combat';

type ArenaPlaybackState = {
  battleResult: BattleResultV2;
  reward: ArenaFightData['grantedReward'];
  honorDelta: number;
  rankDelta: number | null;
  result: 'WIN' | 'LOSE';
};

export function ArenaScene() {
  const { refreshCharacterInfo, runServerAction } = useGameState();
  const [info, setInfo] = useState<ArenaGetInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [playback, setPlayback] = useState<ArenaPlaybackState | null>(null);

  const applyArenaSnapshot = useCallback((snapshot: ArenaGetInfoData) => {
    setInfo(snapshot);
    setCooldownRemainingMs(snapshot.playerSummary.cooldownRemainingMs);
    setRequestError(null);
  }, []);

  const loadArena = useCallback(async () => {
    setLoading(true);
    setRequestError(null);

    try {
      const data = await runServerAction(
        'ARENA_GET_INFO',
        () => postGameAction<ArenaGetInfoData>('ARENA_GET_INFO'),
      );
      applyArenaSnapshot(data);
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '校场情报读取失败。'));
    } finally {
      setLoading(false);
    }
  }, [applyArenaSnapshot, runServerAction]);

  useEffect(() => {
    void loadArena();
  }, [loadArena]);

  useEffect(() => {
    if (cooldownRemainingMs <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setCooldownRemainingMs((previous) => Math.max(0, previous - 1000));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [cooldownRemainingMs]);

  const handleRefreshCandidates = useCallback(async () => {
    setPendingAction('ARENA_REFRESH_CANDIDATES');
    setRequestError(null);

    try {
      const data = await runServerAction(
        'ARENA_REFRESH_CANDIDATES',
        () => postGameAction<ArenaRefreshCandidatesData>('ARENA_REFRESH_CANDIDATES'),
      );
      setInfo((previous) => (
        previous
          ? {
              ...previous,
              arena: {
                ...previous.arena,
                candidateSetId: data.candidateSetId,
                candidates: data.candidates,
              },
            }
          : previous
      ));
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '刷新候选失败。'));
    } finally {
      setPendingAction(null);
    }
  }, [runServerAction]);

  const handleFight = useCallback(async (candidate: ArenaOpponentPreview) => {
    const candidateSetId = info?.arena.candidateSetId ?? null;
    setPendingAction(`ARENA_FIGHT:${candidate.playerId}`);
    setRequestError(null);

    try {
      const data = await runServerAction(`ARENA_FIGHT:${candidate.playerId}`, async () => {
        const result = await postGameAction<ArenaFightData>('ARENA_FIGHT', {
          targetPlayerId: candidate.playerId,
          candidateSetId,
        });
        const refreshed = await postGameAction<ArenaGetInfoData>('ARENA_GET_INFO');
        applyArenaSnapshot(refreshed);
        await refreshCharacterInfo().catch(() => {});
        return result;
      });
      setPlayback({
        battleResult: data.battleResult,
        reward: data.grantedReward,
        honorDelta: data.honorDelta,
        rankDelta: data.rankDelta,
        result: data.result,
      });
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '挑战失败。'));
    } finally {
      setPendingAction(null);
    }
  }, [applyArenaSnapshot, info?.arena.candidateSetId, refreshCharacterInfo, runServerAction]);

  const handleSkipCooldown = useCallback(async () => {
    setPendingAction('ARENA_SKIP_COOLDOWN');
    setRequestError(null);

    try {
      const data = await runServerAction('ARENA_SKIP_COOLDOWN', async () => {
        const result = await postGameAction<ArenaSkipCooldownData>('ARENA_SKIP_COOLDOWN');
        await refreshCharacterInfo().catch(() => {});
        return result;
      });
      setInfo((previous) => (
        previous
          ? {
              ...previous,
              arena: {
                ...previous.arena,
                cooldownEndTime: data.cooldownEndTime,
              },
              playerSummary: {
                ...previous.playerSummary,
                cooldownRemainingMs: 0,
              },
            }
          : previous
      ));
      setCooldownRemainingMs(0);
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '跳过冷却失败。'));
    } finally {
      setPendingAction(null);
    }
  }, [refreshCharacterInfo, runServerAction]);

  const candidates = info?.arena.candidates ?? [];
  const canFight = cooldownRemainingMs <= 0;
  const statusText = useMemo(() => {
    if (!info) {
      return '正在调取校场名册...';
    }
    if (cooldownRemainingMs > 0) {
      return `冷却中 ${formatCountdown(cooldownRemainingMs)}`;
    }
    return '可立即挑战';
  }, [cooldownRemainingMs, info]);

  if (loading && !info) {
    return (
      <div className="scene scene--arena scene-status">
        <div className="scene-status__panel">正在整理校场挑战名册...</div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="scene scene--arena scene-status">
        <div className="scene-status__panel scene-status__panel--error">
          {requestError ?? '校场情报暂不可用。'}
        </div>
      </div>
    );
  }

  return (
    <div className="scene scene--arena">
      {requestError ? <div className="scene-error-banner">{requestError}</div> : null}

      <div className="arena-scene">
        <header className="arena-scene__summary">
          <div className="arena-scene__summary-block">
            <div className="arena-scene__summary-label">荣誉</div>
            <div className="arena-scene__summary-value">{info.playerSummary.honor}</div>
          </div>
          <div className="arena-scene__summary-block">
            <div className="arena-scene__summary-label">排名</div>
            <div className="arena-scene__summary-value">{info.playerSummary.rank ?? '未上榜'}</div>
          </div>
          <div className="arena-scene__summary-block">
            <div className="arena-scene__summary-label">今日 XP 胜场</div>
            <div className="arena-scene__summary-value">
              {info.playerSummary.dailyXpWins} / {info.playerSummary.maxDailyXpWins}
            </div>
          </div>
          <div className="arena-scene__summary-block">
            <div className="arena-scene__summary-label">状态</div>
            <div className="arena-scene__summary-value">{statusText}</div>
          </div>
          <div className="arena-scene__summary-actions">
            <button className="arena-scene__action" type="button" disabled={pendingAction === 'ARENA_REFRESH_CANDIDATES'} onClick={handleRefreshCandidates}>
              刷新名册
            </button>
            <button className="arena-scene__action arena-scene__action--quiet" type="button" disabled={cooldownRemainingMs <= 0 || pendingAction === 'ARENA_SKIP_COOLDOWN'} onClick={handleSkipCooldown}>
              跳过冷却
            </button>
          </div>
        </header>

        <section className="arena-scene__board">
          <div className="arena-scene__heading">
            <div className="arena-scene__title">校场擂台</div>
            <div className="arena-scene__subtitle">挑三名当日可战对手，胜则夺荣誉与阅历。</div>
          </div>

          <div className="arena-scene__candidates">
            {candidates.map((candidate) => {
              const classMeta = CLASS_META[candidate.classId];
              const isBusy = pendingAction === `ARENA_FIGHT:${candidate.playerId}`;

              return (
                <article key={candidate.candidateId} className="arena-card">
                  <div className="arena-card__portrait-frame">
                    <img alt={candidate.displayName} className="arena-card__portrait" src={getAvatarUrl(candidate.avatarId)} />
                  </div>
                  <div className="arena-card__name">{candidate.displayName}</div>
                  <div className="arena-card__meta">Lv.{candidate.level} · {classMeta.name}</div>
                  <div className="arena-card__stat-row"><span>荣誉</span><strong>{candidate.honor}</strong></div>
                  <div className="arena-card__stat-row"><span>排名</span><strong>{candidate.rank}</strong></div>
                  <div className="arena-card__stat-row"><span>战力</span><strong>{candidate.combatPreview.hp} HP</strong></div>
                  <button className="arena-card__fight" type="button" disabled={!canFight || isBusy} onClick={() => void handleFight(candidate)}>
                    {isBusy ? '交锋中...' : canFight ? '挑战' : '冷却中'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {playback ? (
        <BattleReplay
          battleResult={playback.battleResult}
          heading="校场对决"
          subheading={`${playback.battleResult.player.name} 对阵 ${playback.battleResult.enemy.name}`}
          contextLabel="ARENA"
          resultBody={(
            <div className="battle-summary">
              <div className="battle-summary__line"><span>结果</span><strong>{playback.result === 'WIN' ? '取胜' : '失利'}</strong></div>
              <div className="battle-summary__line"><span>荣誉变化</span><strong>{formatSignedNumber(playback.honorDelta)}</strong></div>
              <div className="battle-summary__line"><span>排名变化</span><strong>{formatSignedNumber(playback.rankDelta)}</strong></div>
              <div className="battle-summary__line"><span>奖励</span><strong>经验 {playback.reward.xp} / 铜钱 {playback.reward.copper}</strong></div>
            </div>
          )}
          actions={[
            {
              key: 'close',
              label: '返回校场',
              onClick: () => setPlayback(null),
            },
          ]}
        />
      ) : null}
    </div>
  );
}
