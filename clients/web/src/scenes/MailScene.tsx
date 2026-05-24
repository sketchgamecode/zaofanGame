import { useCallback, useEffect, useMemo, useState } from 'react';
import { postGameAction } from '../api/gameApi';
import { BattleReplay } from '../components/combat/BattleReplay';
import { formatTimestamp } from '../lib/formatters';
import { toActionErrorMessage } from '../lib/manualErrors';
import { useGameState } from '../state/GameStateContext';
import type {
  BattleReplayListItem,
  BattleReplayRecord,
  MailBattleReplayData,
  MailBattleReplayListData,
  MailDeleteBattleReplayData,
} from '../types/combat';

const CONTEXT_LABELS: Record<BattleReplayRecord['context'], string> = {
  MISSION: '客栈任务',
  ARENA: '校场挑战',
  DUNGEON: '江湖历练',
  FORTRESS_ATTACK: '攻城战报',
  FORTRESS_DEFENSE: '守城战报',
};

export function MailScene() {
  const { runServerAction } = useGameState();
  const [replays, setReplays] = useState<BattleReplayListItem[]>([]);
  const [selectedReplayId, setSelectedReplayId] = useState<string | null>(null);
  const [selectedReplay, setSelectedReplay] = useState<BattleReplayRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [playbackOpen, setPlaybackOpen] = useState(false);

  const loadReplays = useCallback(async () => {
    setLoading(true);
    setRequestError(null);

    try {
      const data = await runServerAction(
        'MAIL_GET_BATTLE_REPLAYS',
        () => postGameAction<MailBattleReplayListData>('MAIL_GET_BATTLE_REPLAYS', { limit: 50 }),
      );
      setReplays(data.replays);
      setSelectedReplayId((previous) => previous ?? data.replays[0]?.replayId ?? null);
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '战报列表读取失败。'));
    } finally {
      setLoading(false);
    }
  }, [runServerAction]);

  useEffect(() => {
    void loadReplays();
  }, [loadReplays]);

  useEffect(() => {
    if (!selectedReplayId) {
      setSelectedReplay(null);
      return;
    }

    const controller = new AbortController();
    setPendingAction('MAIL_GET_BATTLE_REPLAY');
    setRequestError(null);

    void runServerAction(
      'MAIL_GET_BATTLE_REPLAY',
      () => postGameAction<MailBattleReplayData>('MAIL_GET_BATTLE_REPLAY', { replayId: selectedReplayId }),
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setSelectedReplay(data.replay);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setRequestError(toActionErrorMessage(error, '战报读取失败。'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setPendingAction(null);
        }
      });

    return () => controller.abort();
  }, [runServerAction, selectedReplayId]);

  const handleDelete = async () => {
    if (!selectedReplay) {
      return;
    }

    const replayIdToDelete = selectedReplay.replayId;
    setPendingAction('MAIL_DELETE_BATTLE_REPLAY');
    setRequestError(null);

    try {
      const data = await runServerAction(
        'MAIL_DELETE_BATTLE_REPLAY',
        () => postGameAction<MailDeleteBattleReplayData>('MAIL_DELETE_BATTLE_REPLAY', {
          replayId: replayIdToDelete,
        }),
      );
      const nextReplays = replays.filter((item) => item.replayId !== data.replayId);
      setReplays(nextReplays);
      setSelectedReplayId((current) => (current !== data.replayId ? current : nextReplays[0]?.replayId ?? null));
      setSelectedReplay((previous) => (previous?.replayId === data.replayId ? null : previous));
    } catch (error) {
      setRequestError(toActionErrorMessage(error, '删除战报失败。'));
    } finally {
      setPendingAction(null);
    }
  };

  const selectedListItem = useMemo(
    () => replays.find((item) => item.replayId === selectedReplayId) ?? null,
    [replays, selectedReplayId],
  );

  if (loading && !replays.length) {
    return (
      <div className="scene scene--mail scene-status">
        <div className="scene-status__panel">正在归拢江湖战报...</div>
      </div>
    );
  }

  return (
    <div className="scene scene--mail">
      {requestError ? <div className="scene-error-banner">{requestError}</div> : null}

      <div className="mail-scene">
        <section className="mail-scene__list">
          <div className="mail-scene__heading">战报匣</div>
          <div className="mail-scene__subheading">竞技场、江湖与客栈战斗都收纳在这里。</div>
          <div className="mail-scene__scroll">
            {replays.map((replay) => (
              <button
                key={replay.replayId}
                className={`mail-item${selectedReplayId === replay.replayId ? ' mail-item--active' : ''}`}
                type="button"
                onClick={() => setSelectedReplayId(replay.replayId)}
              >
                <div className="mail-item__title">{replay.title}</div>
                <div className="mail-item__context">{CONTEXT_LABELS[replay.context]}</div>
                <div className="mail-item__meta">
                  <span>{replay.preview.result === 'WIN' ? '胜' : '败'}</span>
                  <span>{formatTimestamp(replay.createdAt)}</span>
                </div>
              </button>
            ))}
            {!replays.length ? <div className="mail-scene__empty">暂无战报。</div> : null}
          </div>
        </section>

        <section className="mail-scene__detail">
          {selectedListItem ? (
            <>
              <div className="mail-scene__detail-title">{selectedListItem.title}</div>
              <div className="mail-scene__detail-copy">{CONTEXT_LABELS[selectedListItem.context]} · {formatTimestamp(selectedListItem.createdAt)}</div>
              <div className="mail-scene__detail-card">
                <div className="mail-scene__detail-line"><span>对手</span><strong>{selectedListItem.opponentName}</strong></div>
                <div className="mail-scene__detail-line"><span>结果</span><strong>{selectedListItem.preview.result === 'WIN' ? '取胜' : '失利'}</strong></div>
                <div className="mail-scene__detail-line"><span>类型</span><strong>{selectedListItem.preview.type}</strong></div>
              </div>
              <div className="mail-scene__detail-actions">
                <button
                  className="mail-scene__action"
                  type="button"
                  disabled={!selectedReplay || pendingAction === 'MAIL_GET_BATTLE_REPLAY'}
                  onClick={() => setPlaybackOpen(true)}
                >
                  观看回放
                </button>
                <button
                  className="mail-scene__action mail-scene__action--quiet"
                  type="button"
                  disabled={!selectedReplay || pendingAction === 'MAIL_DELETE_BATTLE_REPLAY'}
                  onClick={() => void handleDelete()}
                >
                  删除
                </button>
              </div>
            </>
          ) : (
            <div className="mail-scene__empty mail-scene__empty--detail">请选择一条战报。</div>
          )}
        </section>
      </div>

      {playbackOpen && selectedReplay ? (
        <BattleReplay
          battleResult={selectedReplay.battleResult}
          heading={selectedReplay.title}
          subheading={`${selectedReplay.battleResult.player.name} 对阵 ${selectedReplay.battleResult.enemy.name}`}
          contextLabel={CONTEXT_LABELS[selectedReplay.context]}
          resultBody={(
            <div className="battle-summary">
              <div className="battle-summary__line"><span>来源</span><strong>{CONTEXT_LABELS[selectedReplay.context]}</strong></div>
              <div className="battle-summary__line"><span>时间</span><strong>{formatTimestamp(selectedReplay.createdAt)}</strong></div>
              <div className="battle-summary__line"><span>结果</span><strong>{selectedReplay.preview.result === 'WIN' ? '取胜' : '失利'}</strong></div>
            </div>
          )}
          actions={[
            {
              key: 'close',
              label: '关闭回放',
              onClick: () => setPlaybackOpen(false),
            },
          ]}
        />
      ) : null}
    </div>
  );
}
