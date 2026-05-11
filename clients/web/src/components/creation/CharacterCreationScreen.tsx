import { useMemo, useState } from 'react';
import { CLASS_META, formatModifiers, getAvatarUrl, RACE_META } from '../../config/characterCatalog';
import { useGameState } from '../../state/GameStateContext';
import type { PlayerClassId, RaceId } from '../../types/game';

const AVATAR_IDS = Array.from({ length: 64 }, (_, index) => `avatar_placeholder_${String(index).padStart(3, '0')}`);
const RANDOM_NAME_PREFIX = ['张', '赵', '韩', '岳', '辛', '裴', '卢', '顾'];
const RANDOM_NAME_SUFFIX = ['二牛', '三刀', '青禾', '半城', '惊鸿', '守拙', '无算', '铁山'];

function randomNickname() {
  const prefix = RANDOM_NAME_PREFIX[Math.floor(Math.random() * RANDOM_NAME_PREFIX.length)];
  const suffix = RANDOM_NAME_SUFFIX[Math.floor(Math.random() * RANDOM_NAME_SUFFIX.length)];
  return `${prefix}${suffix}`;
}

export function CharacterCreationScreen() {
  const { createCharacter, pendingAction, errorMessage } = useGameState();
  const [step, setStep] = useState<1 | 2>(1);
  const [classId, setClassId] = useState<PlayerClassId>('CLASS_A');
  const [raceId, setRaceId] = useState<RaceId>('RACE_01');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [nickname, setNickname] = useState(randomNickname);

  const selectedClass = CLASS_META[classId];
  const selectedRace = RACE_META[raceId];
  const avatarId = AVATAR_IDS[avatarIndex];
  const raceCards = useMemo(() => Object.entries(RACE_META) as Array<[RaceId, (typeof RACE_META)[RaceId]]>, []);
  const classCards = useMemo(() => Object.entries(CLASS_META) as Array<[PlayerClassId, (typeof CLASS_META)[PlayerClassId]]>, []);

  return (
    <div className="creation-screen">
      <div className="creation-screen__panel">
        <header className="creation-screen__header">
          <div className="creation-screen__eyebrow">新号开局</div>
          <h1 className="creation-screen__title">开始造反</h1>
          <p className="creation-screen__subtitle">
            第 {step} 步 / 2
            {' · '}
            {step === 1 ? '选职业' : '定种族、头像与名号'}
          </p>
        </header>

        {step === 1 ? (
          <div className="creation-screen__class-grid">
            {classCards.map(([id, meta]) => (
              <button
                key={id}
                className={`creation-class-card${id === classId ? ' creation-class-card--active' : ''}`}
                type="button"
                onClick={() => setClassId(id)}
              >
                <div className="creation-class-card__name">{meta.name}</div>
                <div className="creation-class-card__trait">{meta.trait}</div>
                <div className="creation-class-card__summary">{meta.summary}</div>
                <div className="creation-class-card__stat">主属性：{meta.mainStat === 'strength' ? '力量' : meta.mainStat === 'agility' ? '敏捷' : '智力'}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="creation-screen__identity">
            <section className="creation-screen__portrait">
              <button
                className="creation-screen__arrow"
                type="button"
                onClick={() => setAvatarIndex((previous) => (previous + AVATAR_IDS.length - 1) % AVATAR_IDS.length)}
              >
                ←
              </button>
              <div className="creation-screen__portrait-frame">
                <img alt={avatarId} className="creation-screen__portrait-image" src={getAvatarUrl(avatarId)} />
              </div>
              <button
                className="creation-screen__arrow"
                type="button"
                onClick={() => setAvatarIndex((previous) => (previous + 1) % AVATAR_IDS.length)}
              >
                →
              </button>
              <div className="creation-screen__portrait-id">{avatarId}</div>
            </section>

            <section className="creation-screen__identity-form">
              <div className="creation-screen__race-grid">
                {raceCards.map(([id, meta]) => (
                  <button
                    key={id}
                    className={`creation-race-card${id === raceId ? ' creation-race-card--active' : ''}`}
                    type="button"
                    onClick={() => setRaceId(id)}
                  >
                    <div className="creation-race-card__name">{meta.name}</div>
                    <div className="creation-race-card__mods">{formatModifiers(meta.modifiers)}</div>
                  </button>
                ))}
              </div>

              <label className="creation-screen__field">
                <span>名号</span>
                <div className="creation-screen__field-row">
                  <input
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    maxLength={12}
                    minLength={2}
                    placeholder="请输入 2-12 字名号"
                  />
                  <button className="creation-screen__dice" type="button" onClick={() => setNickname(randomNickname())}>
                    随机
                  </button>
                </div>
              </label>

              <div className="creation-screen__summary-card">
                <div>职业：{selectedClass.name}</div>
                <div>特性：{selectedClass.trait}</div>
                <div>种族：{selectedRace.name}</div>
                <div>修正：{formatModifiers(selectedRace.modifiers)}</div>
              </div>
            </section>
          </div>
        )}

        {errorMessage ? <div className="creation-screen__error">{errorMessage}</div> : null}

        <footer className="creation-screen__footer">
          {step === 2 ? (
            <button className="creation-screen__secondary" type="button" onClick={() => setStep(1)}>
              返回上一步
            </button>
          ) : <div />}

          {step === 1 ? (
            <button className="creation-screen__primary" type="button" onClick={() => setStep(2)}>
              继续
            </button>
          ) : (
            <button
              className="creation-screen__primary"
              type="button"
              disabled={pendingAction === 'CREATE_CHARACTER' || nickname.trim().length < 2}
              onClick={() => {
                void createCharacter({
                  nickname,
                  classId,
                  raceId,
                  avatarId,
                });
              }}
            >
              {pendingAction === 'CREATE_CHARACTER' ? '提交中...' : '开始造反'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
