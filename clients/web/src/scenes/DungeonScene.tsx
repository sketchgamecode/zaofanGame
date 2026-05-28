import { useEffect, useMemo, useState } from 'react';
import { postGameAction } from '../api/gameApi';
import { CharacterPortraitCard } from '../components/character/CharacterPortraitCard';
import { BattleReplay } from '../components/combat/BattleReplay';
import { getAvatarUrl, getClassPowerFaction, POWER_FACTION_LABELS } from '../config/characterCatalog';
import { DUNGEON_CHAPTERS, getDungeonChapterMeta } from '../config/dungeonCatalog';
import { getSceneRegistryEntryForFaction } from '../config/sceneRegistry';
import { toActionErrorMessage } from '../lib/manualErrors';
import { useGameState } from '../state/GameStateContext';
import type { DungeonFightData } from '../types/combat';
import type { PowerFactionId, PowerTransferResult, WorldActorsOverview } from '../types/game';

type DungeonPlaybackState = {
  chapterName: string;
  bossId: string;
  result: 'WIN' | 'LOSE';
  progressAfter: number;
  reward: DungeonFightData['grantedReward'];
  battleResult: DungeonFightData['battleResult'];
  powerCase?: DungeonFightData['powerCase'];
  powerResult?: DungeonFightData['powerResult'];
};

export type DungeonSource = {
  locationId: string;
  servicePositionId?: string;
  issuerActorId?: string;
  issuerDisplayName?: string;
  issuerAvatarId?: string;
  issuerTitle?: string;
  issuerLevel?: number;
  issuerRankText?: string;
  sourceLabel?: string;
};

function formatFaction(faction: PowerFactionId) {
  return POWER_FACTION_LABELS[faction];
}

function formatFactionList(factions: PowerFactionId[]) {
  return factions.map(formatFaction).join(' / ');
}

function formatPowerDelta(delta?: Partial<Record<PowerFactionId, number>>) {
  const entries = Object.entries(delta ?? {})
    .filter(([, value]) => typeof value === 'number' && value !== 0) as Array<[PowerFactionId, number]>;

  if (entries.length === 0) {
    return '无明显牵连';
  }

  return entries
    .map(([faction, value]) => `${formatFaction(faction)} ${value > 0 ? '+' : ''}${value}`)
    .join(' / ');
}

function formatPowerShare(value: number) {
  return `${(value / 100).toFixed(2)}%`;
}

function formatPowerTransferDelta(delta?: Partial<Record<PowerFactionId, number>>) {
  const entries = Object.entries(delta ?? {})
    .filter(([, value]) => typeof value === 'number' && value !== 0) as Array<[PowerFactionId, number]>;

  if (entries.length === 0) {
    return '无明显变化';
  }

  return entries
    .map(([faction, value]) => `${formatFaction(faction)} ${value > 0 ? '+' : ''}${formatPowerShare(value)}`)
    .join(' / ');
}

function formatPowerTransfer(transfer?: PowerTransferResult) {
  if (!transfer) {
    return null;
  }

  const issuerText = formatPowerTransferDelta(transfer.issuerFactionPowerDelta);
  const targetText = formatPowerTransferDelta(transfer.targetFactionPowerDelta);
  const actorText = transfer.actorPowerDelta ? `本人 ${transfer.actorPowerDelta > 0 ? '+' : ''}${formatPowerShare(transfer.actorPowerDelta)}` : '';

  return [issuerText, targetText, actorText]
    .filter((text) => text && text !== '无明显变化')
    .join(' / ') || '权柄无明显变化';
}

function formatTargetWorldPresence(overview: WorldActorsOverview | null, factions: PowerFactionId[]) {
  if (!overview) {
    return '世界角色池同步中';
  }

  return factions
    .map((faction) => {
      const entry = overview.byFaction.find((item) => item.faction === faction);
      if (!entry) {
        return `${formatFaction(faction)} 0人`;
      }
      return `${formatFaction(faction)} ${entry.actorCount}人 / 权柄${formatPowerShare(entry.powerShare)}`;
    })
    .join('；');
}

export function DungeonScene({
  dungeonSource,
  onBack,
}: {
  dungeonSource?: DungeonSource;
  onBack?: () => void;
} = {}) {
  const { character, refreshCharacterInfo, runServerAction } = useGameState();
  const dungeonEntry = getSceneRegistryEntryForFaction('dungeon', getClassPowerFaction(character?.player.classId));
  const [selectedChapterId, setSelectedChapterId] = useState(DUNGEON_CHAPTERS[0]?.id ?? 'chapter_1');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [playback, setPlayback] = useState<DungeonPlaybackState | null>(null);
  const [progressByChapter, setProgressByChapter] = useState<Record<string, number>>({});
  const [worldOverview, setWorldOverview] = useState<WorldActorsOverview | null>(null);
  const [worldOverviewError, setWorldOverviewError] = useState<string | null>(null);

  const selectedChapter = useMemo(
    () => getDungeonChapterMeta(selectedChapterId) ?? DUNGEON_CHAPTERS[0],
    [selectedChapterId],
  );

  const currentLevel = character?.player.level ?? 1;

  useEffect(() => {
    let cancelled = false;

    async function loadWorldOverview() {
      try {
        const overview = await runServerAction(
          'WORLD_ACTORS_GET_OVERVIEW',
          () => postGameAction<WorldActorsOverview>('WORLD_ACTORS_GET_OVERVIEW'),
        );
        if (!cancelled) {
          setWorldOverview(overview);
          setWorldOverviewError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setWorldOverviewError(toActionErrorMessage(error, '世界权柄名册读取失败。'));
        }
      }
    }

    void loadWorldOverview();

    return () => {
      cancelled = true;
    };
  }, [runServerAction]);

  const handleFight = async () => {
    if (!selectedChapter) {
      return;
    }

    setPendingAction('DUNGEON_FIGHT');
    setRequestError(null);

    try {
      const data = await runServerAction('DUNGEON_FIGHT', async () => {
        const result = await postGameAction<DungeonFightData>('DUNGEON_FIGHT', {
          chapterId: selectedChapter.id,
        });
        await refreshCharacterInfo().catch(() => {});
        return result;
      });
      setProgressByChapter((previous) => ({
        ...previous,
        [data.chapterId]: data.progressAfter,
      }));
      setPlayback({
        chapterName: getDungeonChapterMeta(data.chapterId)?.name ?? data.chapterId,
        bossId: data.bossId,
        result: data.result,
        progressAfter: data.progressAfter,
        reward: data.grantedReward,
        battleResult: data.battleResult,
        powerCase: data.powerCase,
        powerResult: data.powerResult,
      });
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '案卷差事失败。'));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="scene scene--dungeon">
      {onBack ? (
        <button className="service-source-back" type="button" onClick={onBack}>
          返回场所
        </button>
      ) : null}
      {requestError ? <div className="scene-error-banner">{requestError}</div> : null}

      <div className="dungeon-scene">
        <section className="dungeon-scene__chapter-list">
          <div className="dungeon-scene__heading">{dungeonEntry?.channelName ?? '案牍房'}</div>
          <div className="dungeon-scene__subheading">{dungeonEntry?.fallbackDetail ?? '按你的资历和官声，逐件接办凶险差事。'}</div>
          {dungeonSource?.issuerDisplayName && dungeonSource.issuerAvatarId ? (
            <div className="service-source-card">
              <CharacterPortraitCard
                avatarUrl={getAvatarUrl(dungeonSource.issuerAvatarId)}
                level={dungeonSource.issuerLevel}
                name={dungeonSource.issuerDisplayName}
                rankText={dungeonSource.issuerRankText}
                title={dungeonSource.issuerTitle}
                xpProgress={0.36}
              />
              <div className="service-source-card__copy">
                <span>{dungeonSource.sourceLabel ?? '案卷来源'}</span>
                <strong>{dungeonSource.issuerDisplayName}</strong>
                {dungeonSource.issuerTitle ? <em>{dungeonSource.issuerTitle}</em> : null}
              </div>
            </div>
          ) : null}
          <div className="dungeon-scene__world-overview">
            <span>大明权力名册</span>
            <strong>{worldOverview ? `${worldOverview.totalActors}人 / 权柄${formatPowerShare(worldOverview.totalPowerShare)}` : '同步中'}</strong>
            {worldOverviewError ? <em>{worldOverviewError}</em> : null}
          </div>
          <div className="dungeon-scene__chapter-scroll">
            {DUNGEON_CHAPTERS.map((chapter) => {
              const unlocked = currentLevel >= chapter.unlockLevel;
              const progress = progressByChapter[chapter.id] ?? 0;
              return (
                <button
                  key={chapter.id}
                  className={`dungeon-scene__chapter${selectedChapterId === chapter.id ? ' dungeon-scene__chapter--active' : ''}${unlocked ? '' : ' dungeon-scene__chapter--locked'}`}
                  type="button"
                  onClick={() => setSelectedChapterId(chapter.id)}
                >
                  <div className="dungeon-scene__chapter-name">{chapter.name}</div>
                  <div className="dungeon-scene__chapter-flavor">{chapter.flavor}</div>
                  {chapter.powerCase ? (
                    <div className="dungeon-scene__case-tags">
                      <span>{formatFaction(chapter.powerCase.issuerFaction)}发案</span>
                      <span>目标 {formatFactionList(chapter.powerCase.targetFactions)}</span>
                    </div>
                  ) : null}
                  <div className="dungeon-scene__chapter-meta">
                  <span>资历 Lv.{chapter.unlockLevel}</span>
                    <span>进度 {progress}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="dungeon-scene__detail">
          {selectedChapter ? (
            <>
              <div className="dungeon-scene__detail-title">{selectedChapter.name}</div>
              <div className="dungeon-scene__detail-flavor">{selectedChapter.flavor}</div>
              <div className="dungeon-scene__detail-panel">
                {selectedChapter.powerCase ? (
                  <>
                    <div className="dungeon-scene__detail-row">
                      <span>发起方</span>
                      <strong>{formatFaction(selectedChapter.powerCase.issuerFaction)}</strong>
                    </div>
                    <div className="dungeon-scene__detail-row">
                      <span>目标方</span>
                      <strong>{formatFactionList(selectedChapter.powerCase.targetFactions)}</strong>
                    </div>
                    <div className="dungeon-scene__detail-row">
                      <span>牵连代价</span>
                      <strong>{formatPowerDelta(selectedChapter.powerCase.suspicionDeltaOnWin)}</strong>
                    </div>
                    <div className="dungeon-scene__detail-row">
                      <span>牵连目标</span>
                      <strong>{formatTargetWorldPresence(worldOverview, selectedChapter.powerCase.targetFactions)}</strong>
                    </div>
                    <div className="dungeon-scene__case-hook">
                      {selectedChapter.powerCase.historicalHook}
                    </div>
                  </>
                ) : null}
                <div className="dungeon-scene__detail-row">
                  <span>当前资历</span>
                  <strong>Lv.{currentLevel}</strong>
                </div>
                <div className="dungeon-scene__detail-row">
                  <span>接办要求</span>
                  <strong>Lv.{selectedChapter.unlockLevel}</strong>
                </div>
                <div className="dungeon-scene__detail-row">
                  <span>案卷记录</span>
                  <strong>已办 {progressByChapter[selectedChapter.id] ?? 0} 段</strong>
                </div>
              </div>
              <button
                className="dungeon-scene__fight"
                type="button"
                disabled={currentLevel < selectedChapter.unlockLevel || pendingAction === 'DUNGEON_FIGHT'}
                onClick={() => void handleFight()}
              >
                {pendingAction === 'DUNGEON_FIGHT' ? '办差中...' : currentLevel < selectedChapter.unlockLevel ? '资历不足' : '接办差事'}
              </button>
            </>
          ) : null}
        </section>
      </div>

      {playback ? (
        <BattleReplay
          battleResult={playback.battleResult}
          heading="案卷差事"
          subheading={`${playback.chapterName} · ${playback.bossId}`}
          contextLabel="DUNGEON"
          resultBody={(
            <div className="battle-summary">
              <div className="battle-summary__line"><span>结果</span><strong>{playback.result === 'WIN' ? '办差得手' : '差事失手'}</strong></div>
              <div className="battle-summary__line"><span>案卷进度</span><strong>{playback.progressAfter}</strong></div>
              <div className="battle-summary__line"><span>奖励</span><strong>经验 {playback.reward.xp} / 铜钱 {playback.reward.copper}</strong></div>
              {playback.powerCase ? (
                <div className="battle-summary__line">
                  <span>权力案件</span>
                  <strong>{formatFaction(playback.powerCase.issuerFaction)}清查{formatFactionList(playback.powerCase.targetFactions)}</strong>
                </div>
              ) : null}
              {playback.powerResult ? (
                <>
                  <div className="battle-summary__line">
                    <span>牵连变化</span>
                    <strong>{formatPowerDelta(playback.powerResult.suspicionDelta)}</strong>
                  </div>
                  <div className="battle-summary__line">
                    <span>当前牵连</span>
                    <strong>{formatPowerDelta(playback.powerResult.suspicionAfter)}</strong>
                  </div>
                  {playback.powerResult.powerTransfer ? (
                    <div className="battle-summary__line">
                      <span>权柄变化</span>
                      <strong>{formatPowerTransfer(playback.powerResult.powerTransfer)}</strong>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          )}
          actions={[
            {
              key: 'close',
              label: '返回案牍房',
              onClick: () => setPlayback(null),
            },
          ]}
        />
      ) : null}
    </div>
  );
}
