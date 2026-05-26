import { useMemo, useState } from 'react';
import {
  CLASS_META,
  formatModifiers,
  getAvatarUrl,
  POWER_FACTION_LABELS,
  RACE_META,
} from '../../config/characterCatalog';
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

function formatMainStat(stat: (typeof CLASS_META)[PlayerClassId]['mainStat']) {
  if (stat === 'strength') return '膂力';
  if (stat === 'agility') return '身法';
  return '谋略';
}

export function CharacterCreationScreen() {
  const { createCharacter, pendingAction, errorMessage } = useGameState();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [classId, setClassId] = useState<PlayerClassId>('CLASS_A');
  const [raceId, setRaceId] = useState<RaceId>('RACE_01');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [nickname, setNickname] = useState(randomNickname);

  const selectedClass = CLASS_META[classId];
  const selectedRace = RACE_META[raceId];
  const avatarId = AVATAR_IDS[avatarIndex];
  const raceCards = useMemo(() => Object.entries(RACE_META) as Array<[RaceId, (typeof RACE_META)[RaceId]]>, []);
  const classCards = useMemo(() => Object.entries(CLASS_META) as Array<[PlayerClassId, (typeof CLASS_META)[PlayerClassId]]>, []);
  const classFitsOrigin = selectedRace.recommendedClassIds.includes(classId);

  return (
    <div className="creation-screen">
      <div className="creation-screen__panel">
        <header className="creation-screen__header">
          <div className="creation-screen__eyebrow">入册造档</div>
          <h1 className="creation-screen__title">领差入局</h1>
          <p className="creation-screen__subtitle">
            第 {step} 步 / 3
            {' · '}
            {step === 1 ? '先定出身' : step === 2 ? '再领职司' : '定头像与名号'}
          </p>
        </header>

        {step === 1 ? (
          <div className="creation-screen__origin-layout">
            <div className="creation-screen__race-grid creation-screen__race-grid--large">
              {raceCards.map(([id, meta]) => (
                <button
                  key={id}
                  className={`creation-race-card creation-race-card--detailed${id === raceId ? ' creation-race-card--active' : ''}`}
                  type="button"
                  onClick={() => {
                    setRaceId(id);
                    if (!meta.recommendedClassIds.includes(classId)) {
                      setClassId(meta.recommendedClassIds[0]);
                    }
                  }}
                >
                  <div className="creation-card__kicker">{POWER_FACTION_LABELS[meta.powerFaction]}</div>
                  <div className="creation-race-card__name">{meta.name}</div>
                  <div className="creation-race-card__status">{meta.status}</div>
                  <div className="creation-race-card__mods">{formatModifiers(meta.modifiers)}</div>
                </button>
              ))}
            </div>

            <aside className="creation-screen__brief">
              <div className="creation-screen__brief-label">出身评断</div>
              <h2>{selectedRace.name}</h2>
              <p>{selectedRace.socialReview}</p>
              <dl>
                <div>
                  <dt>权力背后</dt>
                  <dd>{selectedRace.rightsRepresentative}</dd>
                </div>
                <div>
                  <dt>较顺路线</dt>
                  <dd>{selectedRace.route}</dd>
                </div>
                <div>
                  <dt>身份限制</dt>
                  <dd>{selectedRace.limits}</dd>
                </div>
              </dl>
            </aside>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="creation-screen__class-layout">
            <div className="creation-screen__route-banner">
              <span>当前出身：{selectedRace.name}</span>
              <strong>{selectedRace.route}</strong>
            </div>

            <div className="creation-screen__class-grid">
              {classCards.map(([id, meta]) => {
                const recommended = selectedRace.recommendedClassIds.includes(id);

                return (
                  <button
                    key={id}
                    className={`creation-class-card${id === classId ? ' creation-class-card--active' : ''}${recommended ? ' creation-class-card--recommended' : ''}`}
                    type="button"
                    onClick={() => setClassId(id)}
                  >
                    <div className="creation-card__kicker">
                      {POWER_FACTION_LABELS[meta.powerFaction]}
                      {recommended ? ' · 举荐' : ' · 偏门'}
                    </div>
                    <div className="creation-class-card__name">{meta.name}</div>
                    <div className="creation-class-card__trait">{meta.trait}</div>
                    <div className="creation-class-card__summary">{meta.summary}</div>
                    <div className="creation-class-card__stat">主属性：{formatMainStat(meta.mainStat)}</div>
                    <div className="creation-class-card__bureau">{meta.bureau}</div>
                  </button>
                );
              })}
            </div>

            <aside className="creation-screen__brief creation-screen__brief--wide">
              <div className="creation-screen__brief-label">职司风险</div>
              <h2>{selectedClass.name}</h2>
              <p>{selectedClass.route}</p>
              <dl>
                <div>
                  <dt>所属衙门</dt>
                  <dd>{selectedClass.bureau}</dd>
                </div>
                <div>
                  <dt>权力归属</dt>
                  <dd>{POWER_FACTION_LABELS[selectedClass.powerFaction]}</dd>
                </div>
                <div>
                  <dt>限制代价</dt>
                  <dd>{selectedClass.restriction}</dd>
                </div>
                <div>
                  <dt>路线判断</dt>
                  <dd>{classFitsOrigin ? '此职司合乎你的出身门路。' : '此职司偏离出身常路，后续更依赖投名状和靠山。'}</dd>
                </div>
              </dl>
            </aside>
          </div>
        ) : null}

        {step === 3 ? (
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
                <div>出身：{selectedRace.name}</div>
                <div>职司：{selectedClass.name}</div>
                <div>权力归属：{POWER_FACTION_LABELS[selectedClass.powerFaction]}</div>
                <div>特性：{selectedClass.trait}</div>
                <div>修正：{formatModifiers(selectedRace.modifiers)}</div>
                <div>{classFitsOrigin ? '路线：合乎出身门路' : '路线：偏离常路，需靠投名状打开局面'}</div>
              </div>
            </section>
          </div>
        ) : null}

        {errorMessage ? <div className="creation-screen__error">{errorMessage}</div> : null}

        <footer className="creation-screen__footer">
          {step > 1 ? (
            <button className="creation-screen__secondary" type="button" onClick={() => setStep((previous) => (previous - 1) as 1 | 2)}>
              返回上一步
            </button>
          ) : <div />}

          {step < 3 ? (
            <button className="creation-screen__primary" type="button" onClick={() => setStep((previous) => (previous + 1) as 2 | 3)}>
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
              {pendingAction === 'CREATE_CHARACTER' ? '造册中...' : '领牌入局'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
