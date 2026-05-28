import type { SceneId, PowerLocationService, PowerLocationStatus } from '../../types/game';
import { CharacterPortraitCard } from '../character/CharacterPortraitCard';

export type LocationSceneArt = {
  background: string;
  npcImage: string;
  npcName: string;
};

export type LocationSceneServiceEntry = {
  service: PowerLocationService;
  sceneId: SceneId | null;
  label: string;
  summary: string;
  sourceLocationId?: string;
  sourcePositionId?: string;
  issuerActorId?: string;
  issuerDisplayName?: string;
  issuerAvatarId?: string;
  issuerTitle?: string;
  issuerLevel?: number;
  issuerRankText?: string;
};

export type LocationSceneNpcCard = {
  id: string;
  actorId?: string;
  avatarUrl: string;
  name: string;
  title: string;
  level: number;
  rankText: string;
  xpProgress?: number;
  services: LocationSceneServiceEntry[];
  incomeHint?: string;
  replaceHint?: string;
  positionStatus?: string;
  ownerLabel?: string;
  minLevel?: number;
};

type LocationSceneViewProps = {
  art: LocationSceneArt;
  title: string;
  ownerLabel: string;
  status: PowerLocationStatus;
  statusLabel: string;
  dialogue: string;
  meta: string[];
  npcCards: LocationSceneNpcCard[];
  serviceMessage: string | null;
  onBack: () => void;
  onService: (entry: LocationSceneServiceEntry) => void;
  onNpcClick: (npc: LocationSceneNpcCard) => void;
};

/**
 * Modular UI component.
 * Every roleplay location should reuse this structure: scene art, NPC cards,
 * dialogue copy, and service buttons bound to those NPCs. Scenes may choose
 * NPC/service data, but should not fork this visual layout unless the module
 * itself changes globally.
 */
export function LocationSceneView({
  art,
  title,
  ownerLabel,
  status,
  statusLabel,
  dialogue,
  meta,
  npcCards,
  serviceMessage,
  onBack,
  onService,
  onNpcClick,
}: LocationSceneViewProps) {
  return (
    <div className="scene scene--city">
      <div className="location-scene" style={{ backgroundImage: `url("${art.background}")` }}>
        <button className="location-scene__back" type="button" onClick={onBack}>
          返回京城
        </button>
        <div className="location-scene__scrim" />
        <section className="location-scene__dialogue">
          <span className="location-scene__faction">{ownerLabel}</span>
          <span className={`location-scene__status location-scene__status--${status}`}>{statusLabel}</span>
          <h2>{title}</h2>
          <h3>{art.npcName}</h3>
          <p>{dialogue}</p>
          <div className="location-scene__meta">
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          {serviceMessage ? <div className="location-scene__notice">{serviceMessage}</div> : null}
        </section>

        <section className="location-scene__npc-strip" aria-label={`${title}人物`}>
          {npcCards.length > 0 ? (
            npcCards.map((npc) => (
              <article key={npc.id} className="location-scene__npc-card">
                <button
                  className="location-scene__npc-card-action"
                  type="button"
                  onClick={() => onNpcClick(npc)}
                >
                  <CharacterPortraitCard
                    avatarUrl={npc.avatarUrl}
                    level={npc.level}
                    name={npc.name}
                    rankText={npc.rankText}
                    title={npc.title}
                    xpProgress={npc.xpProgress}
                  />
                </button>
                <div className="location-scene__npc-services">
                  {npc.services.map((entry) => (
                    <button
                      key={`${npc.id}:${entry.service}:${entry.sceneId ?? entry.summary}`}
                      type="button"
                      onClick={() => onService(entry)}
                    >
                      <strong>{entry.label}</strong>
                      <span>{entry.summary}</span>
                    </button>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <div className="location-scene__empty-service">暂无可办事务</div>
          )}
        </section>
      </div>
    </div>
  );
}
