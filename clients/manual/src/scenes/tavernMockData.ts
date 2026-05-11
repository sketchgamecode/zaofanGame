import type { ActiveMissionView, MissionOffer, TavernInfoData, TavernNpcGreeting } from '../types/tavern';

export type ManualBattleRound = {
  attacker: 'player' | 'enemy';
  damage: number;
  targetHpAfter: number;
  wasCrit?: boolean;
};

export type ManualBattlePlayback = {
  playerName: string;
  enemyName: string;
  playerHpMax: number;
  enemyHpMax: number;
  playerHpEnd: number;
  enemyHpEnd: number;
  playerWon: boolean;
  rounds: ManualBattleRound[];
};

const NPC_POOL: TavernNpcGreeting[] = [
  { npcId: 'npc_laobao', name: '老鲍', dialogue: '喝完这碗，跟我走，城东有码头上的买卖。' },
  { npcId: 'npc_cuihua', name: '翠花', dialogue: '客官，今夜有笔钱可赚，只看你敢不敢接。' },
  { npcId: 'npc_daoye', name: '刀爷', dialogue: '你这身手别浪费，替我去把人收拾了。' },
  { npcId: 'npc_mao_jiu', name: '茂九', dialogue: '路子我有，就差个腿脚利索的人。' },
  { npcId: 'npc_xue_gu', name: '薛姑', dialogue: '老身有件事求你，事成以后少不了你的酒钱。' },
];

function createMissionOffers(now: number): MissionOffer[] {
  return [
    {
      offerSetId: 'manual_offer_set',
      missionId: 'manual_offer_0',
      offerSeq: 1,
      slotIndex: 0,
      title: '追踪密探',
      description: '追踪密探，前往汴京暗巷活动 20 分钟。',
      locationName: '汴京暗巷',
      baseDurationSec: 1200,
      actualDurationSec: 1200,
      thirstCostSec: 1200,
      visibleReward: {
        xp: 180,
        copper: 96,
        hasEquipment: true,
        equipmentPreview: { slot: 'weapon', rarity: 1, name: '朴刀' },
        hasDungeonKey: false,
        hasHourglass: false,
      },
      enemyPreview: {
        enemyId: 'enemy_manual_0',
        name: '密探',
        level: 12,
        archetype: 'scout',
      },
      generatedAt: now,
    },
    {
      offerSetId: 'manual_offer_set',
      missionId: 'manual_offer_1',
      offerSeq: 1,
      slotIndex: 1,
      title: '截获密信',
      description: '截获密信，前往盐帮码头活动 35 分钟。',
      locationName: '盐帮码头',
      baseDurationSec: 2100,
      actualDurationSec: 2100,
      thirstCostSec: 2100,
      visibleReward: {
        xp: 255,
        copper: 142,
        hasEquipment: false,
        hasDungeonKey: true,
        dungeonKeyPreview: { dungeonId: 'dungeon_ink', name: '校场钥牌' },
        hasHourglass: false,
      },
      enemyPreview: {
        enemyId: 'enemy_manual_1',
        name: '护卫',
        level: 13,
        archetype: 'guard',
      },
      generatedAt: now,
    },
    {
      offerSetId: 'manual_offer_set',
      missionId: 'manual_offer_2',
      offerSeq: 1,
      slotIndex: 2,
      title: '夜探仓库',
      description: '夜探仓库，前往西市黑铺活动 50 分钟。',
      locationName: '西市黑铺',
      baseDurationSec: 3000,
      actualDurationSec: 3000,
      thirstCostSec: 3000,
      visibleReward: {
        xp: 330,
        copper: 188,
        hasEquipment: false,
        hasDungeonKey: false,
        hasHourglass: true,
      },
      enemyPreview: {
        enemyId: 'enemy_manual_2',
        name: '账房',
        level: 14,
        archetype: 'rogue',
      },
      generatedAt: now,
    },
  ];
}

export function createInitialMockTavernInfo(): TavernInfoData {
  const now = Date.now();
  const missionOffers = createMissionOffers(now);
  const npcGreeting = NPC_POOL[Math.floor(Math.random() * NPC_POOL.length)] ?? NPC_POOL[0];

  return {
    tavern: {
      status: 'IDLE',
      thirstSecRemaining: 7200,
      drinksUsedToday: 0,
      firstMissionBonusAvailable: true,
      missionOffers,
      activeMission: null,
      npcGreeting,
    },
    mount: {
      timeMultiplierBp: 10000,
      expiresAt: null,
    },
  };
}

export function buildActiveMissionFromOffer(offer: MissionOffer, now: number): ActiveMissionView {
  return {
    missionId: offer.missionId,
    offerSetId: offer.offerSetId,
    offerSeq: offer.offerSeq,
    slotIndex: offer.slotIndex,
    title: offer.title,
    description: offer.description,
    locationName: offer.locationName,
    startedAt: now,
    endTime: now + offer.actualDurationSec * 1000,
    remainingSec: offer.actualDurationSec,
    baseDurationSec: offer.baseDurationSec,
    actualDurationSec: offer.actualDurationSec,
    thirstCostSec: offer.thirstCostSec,
    rewardPreview: {
      xp: offer.visibleReward.xp,
      copper: offer.visibleReward.copper,
      hasEquipment: offer.visibleReward.hasEquipment,
      hasDungeonKey: offer.visibleReward.hasDungeonKey,
      hasHourglass: offer.visibleReward.hasHourglass,
    },
    mountSnapshot: {
      timeMultiplierBp: 10000,
      capturedAt: now,
    },
  };
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function resolveTaskBackgroundPath(locationName?: string) {
  if (!locationName) {
    return '/assets/backgrounds/bg_system_tavern_task_bg_placeholder.png';
  }

  const backgroundIndex = hashString(locationName) % 6;
  return `/assets/backgrounds/bg_system_tavern_task_bg_0${backgroundIndex}.png`;
}

export function buildBattlePlayback(offer: MissionOffer): ManualBattlePlayback {
  const playerName = '张某';
  const enemyName = offer.enemyPreview.name;
  const playerHpMax = 860;
  const enemyHpMax = 540 + offer.slotIndex * 110;

  const rounds: ManualBattleRound[] = [];
  let playerHp = playerHpMax;
  let enemyHp = enemyHpMax;

  const playerDamages = [132, 96, 168, 124];
  const enemyDamages = [48, 72, 58];

  for (let roundIndex = 0; roundIndex < playerDamages.length; roundIndex += 1) {
    enemyHp = Math.max(0, enemyHp - playerDamages[roundIndex]);
    rounds.push({
      attacker: 'player',
      damage: playerDamages[roundIndex],
      targetHpAfter: enemyHp,
      wasCrit: roundIndex === 2,
    });

    if (enemyHp <= 0) {
      break;
    }

    const enemyDamage = enemyDamages[roundIndex] ?? 44;
    playerHp = Math.max(0, playerHp - enemyDamage);
    rounds.push({
      attacker: 'enemy',
      damage: enemyDamage,
      targetHpAfter: playerHp,
      wasCrit: false,
    });
  }

  return {
    playerName,
    enemyName,
    playerHpMax,
    enemyHpMax,
    playerHpEnd: playerHp,
    enemyHpEnd: enemyHp,
    playerWon: enemyHp <= 0,
    rounds,
  };
}
