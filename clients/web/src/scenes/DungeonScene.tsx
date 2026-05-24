import { useMemo, useState } from 'react';
import { postGameAction } from '../api/gameApi';
import { BattleReplay } from '../components/combat/BattleReplay';
import { DUNGEON_CHAPTERS, getDungeonChapterMeta } from '../config/dungeonCatalog';
import { toActionErrorMessage } from '../lib/manualErrors';
import { useGameState } from '../state/GameStateContext';
import type { DungeonFightData } from '../types/combat';

type DungeonPlaybackState = {
  chapterName: string;
  bossId: string;
  result: 'WIN' | 'LOSE';
  progressAfter: number;
  reward: DungeonFightData['grantedReward'];
  battleResult: DungeonFightData['battleResult'];
};

export function DungeonScene() {
  const { character, refreshCharacterInfo, runServerAction } = useGameState();
  const [selectedChapterId, setSelectedChapterId] = useState(DUNGEON_CHAPTERS[0]?.id ?? 'chapter_1');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [playback, setPlayback] = useState<DungeonPlaybackState | null>(null);
  const [progressByChapter, setProgressByChapter] = useState<Record<string, number>>({});

  const selectedChapter = useMemo(
    () => getDungeonChapterMeta(selectedChapterId) ?? DUNGEON_CHAPTERS[0],
    [selectedChapterId],
  );

  const currentLevel = character?.player.level ?? 1;

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
      });
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '江湖历练失败。'));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="scene scene--dungeon">
      {requestError ? <div className="scene-error-banner">{requestError}</div> : null}

      <div className="dungeon-scene">
        <section className="dungeon-scene__chapter-list">
          <div className="dungeon-scene__heading">江湖地界</div>
          <div className="dungeon-scene__subheading">按你的名望和功夫，逐章向外闯荡。</div>
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
                  <div className="dungeon-scene__chapter-meta">
                    <span>解锁 Lv.{chapter.unlockLevel}</span>
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
                <div className="dungeon-scene__detail-row">
                  <span>当前等级</span>
                  <strong>Lv.{currentLevel}</strong>
                </div>
                <div className="dungeon-scene__detail-row">
                  <span>解锁要求</span>
                  <strong>Lv.{selectedChapter.unlockLevel}</strong>
                </div>
                <div className="dungeon-scene__detail-row">
                  <span>本地记录</span>
                  <strong>已通 {progressByChapter[selectedChapter.id] ?? 0} 关</strong>
                </div>
              </div>
              <button
                className="dungeon-scene__fight"
                type="button"
                disabled={currentLevel < selectedChapter.unlockLevel || pendingAction === 'DUNGEON_FIGHT'}
                onClick={() => void handleFight()}
              >
                {pendingAction === 'DUNGEON_FIGHT' ? '闯关中...' : currentLevel < selectedChapter.unlockLevel ? '尚未解锁' : '进入战斗'}
              </button>
            </>
          ) : null}
        </section>
      </div>

      {playback ? (
        <BattleReplay
          battleResult={playback.battleResult}
          heading="江湖历练"
          subheading={`${playback.chapterName} · ${playback.bossId}`}
          contextLabel="DUNGEON"
          resultBody={(
            <div className="battle-summary">
              <div className="battle-summary__line"><span>结果</span><strong>{playback.result === 'WIN' ? '闯关成功' : '挑战失败'}</strong></div>
              <div className="battle-summary__line"><span>章节进度</span><strong>{playback.progressAfter}</strong></div>
              <div className="battle-summary__line"><span>奖励</span><strong>经验 {playback.reward.xp} / 铜钱 {playback.reward.copper}</strong></div>
            </div>
          )}
          actions={[
            {
              key: 'close',
              label: '返回江湖',
              onClick: () => setPlayback(null),
            },
          ]}
        />
      ) : null}
    </div>
  );
}
