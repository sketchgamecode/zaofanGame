import { useMemo, useState } from 'react';
import type {
  SceneId,
  LocationChiefDashboardView,
  LocationFinanceReportView,
  LocationTreasuryView,
  OfficeLedgerEntry,
  OfficeTributeTerm,
  PowerLocationService,
  PowerLocationStatus,
} from '../../types/game';
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
  treasury: LocationTreasuryView | null;
  treasuryLoading?: boolean;
  raidLoading?: boolean;
  guardActionLoading?: string | null;
  ledgerEntries: OfficeLedgerEntry[];
  ledgerLoading?: boolean;
  tributeTerms: OfficeTributeTerm[];
  tributeLoading?: boolean;
  tributePayLoading?: boolean;
  financeReport: LocationFinanceReportView | null;
  financeReportLoading?: boolean;
  chiefDashboard: LocationChiefDashboardView | null;
  chiefDashboardLoading?: boolean;
  canPayTribute?: boolean;
  serviceMessage: string | null;
  onBack: () => void;
  onService: (entry: LocationSceneServiceEntry) => void;
  onNpcClick: (npc: LocationSceneNpcCard) => void;
  onLedgerActorClick: (actorId: string) => void;
  onRaid: () => void;
  onGuardJoin: (durationMinutes: number) => void;
  onGuardLeave: (dutyId: string) => void;
  onGuardClaim: (dutyId: string) => void;
  onFinanceReportOpen: () => void;
  onChiefDashboardOpen: () => void;
  onTributePay: (tributeId: string, amountCopper: number) => void;
};

type LedgerFilter = 'all' | 'mission' | 'raid' | 'guard' | 'income' | 'office';

const LEDGER_FILTERS: Array<{ id: LedgerFilter; label: string }> = [
  { id: 'all', label: '\u5168\u90e8' },
  { id: 'mission', label: '\u5dee\u4e8b' },
  { id: 'raid', label: '\u52ab\u63a0' },
  { id: 'guard', label: '\u5b88\u536b' },
  { id: 'income', label: '\u6536\u76ca' },
  { id: 'office', label: '\u8003\u529f' },
];

function toDateFromEpoch(value: number) {
  return new Date(value > 10_000_000_000 ? value : value * 1000);
}

function formatLedgerTime(createdAt: number) {
  if (!createdAt) {
    return '--';
  }

  return toDateFromEpoch(createdAt).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

function formatLedgerDelta(entry: OfficeLedgerEntry) {
  if (entry.type === 'guard_join') {
    return '\u5e94\u4e0b\u5b88\u536b';
  }

  if (entry.type === 'guard_leave') {
    return '\u64c5\u81ea\u79bb\u5c97';
  }

  if (entry.type === 'guard_wage') {
    return entry.taxValueDelta ? `\u9886\u9977 ${Math.abs(entry.taxValueDelta)}` : '\u9886\u9977';
  }

  if (entry.type === 'guard_wage_shortfall') {
    return entry.taxValueDelta ? `\u77ed\u53d1 ${Math.abs(entry.taxValueDelta)}` : '\u77ed\u53d1\u9977\u94f6';
  }

  if (entry.type === 'raid_failed') {
    return '\u52ab\u63a0\u672a\u6210';
  }

  if (entry.type === 'raid_wealth') {
    return entry.taxValueDelta ? `\u88ab\u593a\u8d22 ${entry.taxValueDelta}` : '\u88ab\u593a\u8d22';
  }

  if (entry.type === 'raid_power') {
    return entry.powerValueDelta ? `\u88ab\u593a\u6743 ${(entry.powerValueDelta / 100).toFixed(2)}%` : '\u88ab\u593a\u6743';
  }

  if (entry.type === 'raid_fame') {
    return '\u88ab\u626c\u540d\u6311\u8845';
  }

  if (entry.type === 'mission_power') {
    return entry.powerValueDelta ? `\u5dee\u4e8b\u593a\u6743 ${(entry.powerValueDelta / 100).toFixed(2)}%` : '\u5dee\u4e8b\u593a\u6743';
  }

  if (entry.type === 'mission_tax') {
    return entry.taxValueDelta ? `\u5dee\u4e8b\u5165\u8d26 ${entry.taxValueDelta}` : '\u5dee\u4e8b\u5165\u8d26';
  }

  const parts = [
    entry.taxValueDelta ? `\u7a0e\u94b1 +${entry.taxValueDelta}` : null,
    entry.powerValueDelta ? `\u6743\u67c4 +${(entry.powerValueDelta / 100).toFixed(2)}%` : null,
  ].filter(Boolean);

  return parts.join(' / ') || '\u8bb0\u8d26';
}

function getLedgerFilter(entry: OfficeLedgerEntry): LedgerFilter {
  if (entry.type === 'mission_power' || entry.type === 'mission_tax') {
    return 'mission';
  }

  if (entry.type.startsWith('raid_')) {
    return 'raid';
  }

  if (entry.type.startsWith('guard_')) {
    return 'guard';
  }

  if (entry.type === 'evaluation') {
    return 'office';
  }

  return 'income';
}

function formatGuardRemaining(seconds: number) {
  if (seconds <= 0) {
    return '\u53ef\u9886\u9977';
  }

  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes}\u5206`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}\u65f6${rest}\u5206` : `${hours}\u65f6`;
}

function formatCopper(value = 0) {
  return value.toLocaleString('zh-CN');
}

const SERVICE_LABELS: Partial<Record<PowerLocationService, string>> = {
  missions: '\u5dee\u4e8b',
  shop: '\u91c7\u4e70',
  dungeon: '\u6848\u5377',
  arena: '\u8003\u7ee9',
  promotion: '\u5347\u8fc1',
  intel: '\u60c5\u62a5',
  stamina: '\u8865\u7ed9',
  office_registry: '\u540d\u518c',
  appointment: '\u4efb\u514d',
  evaluation: '\u8003\u529f',
  tribute_registry: '\u8d21\u7eb3',
};

function formatServiceLabel(service: PowerLocationService) {
  return SERVICE_LABELS[service] ?? service;
}

function formatShortDate(value: number) {
  if (!value) {
    return '--';
  }

  return toDateFromEpoch(value).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

function formatTributeStatus(term: OfficeTributeTerm) {
  if (term.status === 'passed') {
    return '\u5df2\u8db3\u989d';
  }

  if (term.status === 'failed') {
    return term.reviewLabel || '\u6b20\u8d21';
  }

  return term.reviewLabel || '\u672c\u5468\u672a\u8003';
}

function getTributeProgress(term: OfficeTributeTerm | undefined) {
  if (!term || term.dueCopper <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, term.paidCopper / term.dueCopper));
}

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
  treasury,
  treasuryLoading = false,
  raidLoading = false,
  guardActionLoading = null,
  ledgerEntries,
  ledgerLoading = false,
  tributeTerms,
  tributeLoading = false,
  tributePayLoading = false,
  financeReport,
  financeReportLoading = false,
  chiefDashboard,
  chiefDashboardLoading = false,
  canPayTribute = false,
  serviceMessage,
  onBack,
  onService,
  onNpcClick,
  onLedgerActorClick,
  onRaid,
  onGuardJoin,
  onGuardLeave,
  onGuardClaim,
  onFinanceReportOpen,
  onChiefDashboardOpen,
  onTributePay,
}: LocationSceneViewProps) {
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>('all');
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [chiefOpen, setChiefOpen] = useState(false);
  const [treasuryOpen, setTreasuryOpen] = useState(false);
  const [tributeAmount, setTributeAmount] = useState('500');
  const filteredLedgerEntries = useMemo(() => {
    if (ledgerFilter === 'all') {
      return ledgerEntries;
    }

    return ledgerEntries.filter((entry) => getLedgerFilter(entry) === ledgerFilter);
  }, [ledgerEntries, ledgerFilter]);
  const activeGuardCount = treasury?.guards.filter((guard) => guard.remainingSeconds > 0 && !guard.canClaimWage).length ?? 0;
  const claimableGuardCount = treasury?.guards.filter((guard) => guard.canClaimWage).length ?? 0;
  const activeTribute = tributeTerms.find((term) => term.status === 'active') ?? tributeTerms[0];
  const tributeProgress = getTributeProgress(activeTribute);
  const maxReportAbsDelta = Math.max(
    1,
    ...(financeReport?.dailyRows ?? []).map((row) => Math.abs(row.netCopperDelta)),
  );
  const maxDashboardAbsDelta = Math.max(
    1,
    ...(chiefDashboard?.financeSummary ?? []).map((row) => Math.abs(row.netCopperDelta)),
  );

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

        <button className="location-scene__treasury-toggle" type="button" onClick={() => setTreasuryOpen(true)}>
          {'\u516c\u8d26 / \u5b88\u536b / \u52ab\u63a0'}
        </button>

        <section className={`location-scene__ledger${treasuryOpen ? ' location-scene__ledger--mobile-open' : ''}`} aria-label={`${title}\u8fd1\u65e5\u62a5\u544a`}>
          <button className="location-scene__treasury-close" type="button" onClick={() => setTreasuryOpen(false)}>
            {'\u5173\u95ed'}
          </button>
          <div className="location-scene__treasury">
            <div className="location-scene__treasury-head">
              <span>{'\u573a\u6240\u516c\u8d26'}</span>
              <strong>{treasuryLoading ? '\u540c\u6b65\u4e2d' : treasury ? treasury.ownerLabel : '--'}</strong>
            </div>
            {treasury ? (
              <>
                {treasury.chiefActor ? (
                  <div className="location-scene__chief">
                    <button type="button" onClick={() => onLedgerActorClick(treasury.chiefActor!.actorId)}>
                      <strong>{treasury.chiefActor.displayName}</strong>
                      <span>{treasury.chiefActor.title ?? '\u573a\u6240\u4e3b\u5b98'}</span>
                    </button>
                    <div>
                      <span>{'\u4e3b\u5b98\u66b4\u9732\u94dc\u94b1'}</span>
                      <strong>{formatCopper(treasury.chiefActor.personalCopperExposed)}</strong>
                    </div>
                  </div>
                ) : null}
                <div className="location-scene__treasury-grid">
                  <div><span>{'\u94dc\u94b1'}</span><strong>{treasury.copperBalance}</strong></div>
                  <div><span>{'\u5b88\u536b'}</span><strong>{activeGuardCount}/{treasury.guardSlotsMax}</strong></div>
                  <div><span>{'\u5206\u8d26'}</span><strong>{toDateFromEpoch(treasury.nextDistributionAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</strong></div>
                </div>
                <div className="location-scene__tribute">
                  <div className="location-scene__tribute-head">
                    <span>{'\u672c\u5468\u4e0a\u7f34'}</span>
                    <strong>{tributeLoading ? '\u540c\u6b65\u4e2d' : activeTribute ? formatTributeStatus(activeTribute) : '\u672a\u767b\u8bb0'}</strong>
                  </div>
                  {activeTribute ? (
                    <>
                      <div className="location-scene__tribute-meter">
                        <span style={{ width: `${Math.round(tributeProgress * 100)}%` }} />
                      </div>
                      <div className="location-scene__tribute-grid">
                        <div><span>{'\u5df2\u7f34'}</span><strong>{formatCopper(activeTribute.paidCopper)}</strong></div>
                        <div><span>{'\u5e94\u7f34'}</span><strong>{formatCopper(activeTribute.dueCopper)}</strong></div>
                        <div><span>{'\u622a\u6b62'}</span><strong>{formatShortDate(activeTribute.termEndsAt)}</strong></div>
                      </div>
                      {canPayTribute && activeTribute.status === 'active' ? (
                        <div className="location-scene__tribute-pay">
                          <input
                            min="1"
                            inputMode="numeric"
                            type="number"
                            value={tributeAmount}
                            onChange={(event) => setTributeAmount(event.target.value)}
                          />
                          <button
                            type="button"
                            disabled={tributePayLoading || Number(tributeAmount) <= 0}
                            onClick={() => onTributePay(activeTribute.tributeId, Math.max(0, Math.floor(Number(tributeAmount))))}
                          >
                            {tributePayLoading ? '\u7f34\u7eb3\u4e2d' : '\u7f34\u7eb3'}
                          </button>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p>{'\u6b64\u5730\u5c1a\u672a\u5efa\u7acb\u5468\u8d21\u8d26\u671f\u3002'}</p>
                  )}
                </div>
                <p>{treasury.raidRiskHint}</p>
                <p>{treasury.carryHint}</p>
                <div className="location-scene__guard-box">
                  <div className="location-scene__guard-head">
                    <span>{'\u503c\u5b88\u5b88\u536b'}</span>
                    <strong>
                      {`\u5f53\u524d ${activeGuardCount}/${treasury.guardSlotsMax} \u540d\u5b88\u536b\u6b63\u5728\u503c\u5b88${claimableGuardCount > 0 ? `\uff0c${claimableGuardCount}\u540d\u5df2\u5230\u65f6\u5f85\u9886\u9977` : ''}\u3002\u52ab\u63a0\u65f6\u53ea\u6709\u6b63\u5728\u503c\u5b88\u8005\u4f1a\u51fa\u6218\u3002`}
                    </strong>
                  </div>
                  {treasury.guards.length > 0 ? (
                    <div className="location-scene__guard-list">
                      {treasury.guards.map((guard) => (
                        <article key={guard.dutyId} className="location-scene__guard-entry">
                          <button type="button" onClick={() => onLedgerActorClick(guard.actorId)}>
                            <strong>{guard.actorDisplayName}</strong>
                            <span>{`\u7b49\u7ea7 ${guard.level}`}</span>
                          </button>
                          <div>
                            <span>{guard.canClaimWage ? '\u5f85\u9886\u9977' : formatGuardRemaining(guard.remainingSeconds)}</span>
                            <small>{`\u9977\u94f6 ${guard.wageCopper}`}</small>
                          </div>
                          {guard.canClaimWage ? (
                            <button
                              type="button"
                              disabled={guardActionLoading === guard.dutyId}
                              onClick={() => onGuardClaim(guard.dutyId)}
                            >
                              {guardActionLoading === guard.dutyId ? '\u9886\u9977\u4e2d' : '\u9886\u9977'}
                            </button>
                          ) : guard.canLeave ? (
                            <button
                              type="button"
                              disabled={guardActionLoading === guard.dutyId}
                              onClick={() => onGuardLeave(guard.dutyId)}
                            >
                              {guardActionLoading === guard.dutyId ? '\u79bb\u5c97\u4e2d' : '\u79bb\u5c97'}
                            </button>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p>{'\u6682\u65e0\u73a9\u5bb6\u5728\u6b64\u5b88\u591c\u3002'}</p>
                  )}
                  {activeGuardCount < treasury.guardSlotsMax ? (
                    <div className="location-scene__guard-actions">
                      {[30, 60, 120].map((duration) => (
                        <button
                          key={duration}
                          type="button"
                          disabled={guardActionLoading === `join:${duration}`}
                          onClick={() => onGuardJoin(duration)}
                        >
                          {guardActionLoading === `join:${duration}` ? '\u5e94\u5dee\u4e2d' : `\u5b88 ${duration}\u5206`}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p>{'\u5b88\u536b\u5e2d\u4f4d\u5df2\u6ee1\uff0c\u6b64\u5730\u6682\u4e0d\u6536\u4eba\u3002'}</p>
                  )}
                </div>
                <button className="location-scene__raid-button" type="button" disabled={raidLoading} onClick={onRaid}>
                  {raidLoading ? '\u6b63\u5728\u53ec\u96c6\u4eba\u624b...' : '\u591c\u95ef\u6b64\u5730'}
                </button>
                <button className="location-scene__ledger-button" type="button" onClick={() => setLedgerOpen(true)}>
                  {ledgerLoading ? '\u8fd1\u65e5\u62a5\u544a\u540c\u6b65\u4e2d' : `\u67e5\u770b\u8fd1\u65e5\u62a5\u544a ${ledgerEntries.length}\u6761`}
                </button>
                <button
                  className="location-scene__ledger-button"
                  type="button"
                  onClick={() => {
                    setFinanceOpen(true);
                    onFinanceReportOpen();
                  }}
                >
                  {financeReportLoading ? '\u8d22\u52a1\u62a5\u8868\u540c\u6b65\u4e2d' : '\u67e5\u770b\u8d22\u52a1\u62a5\u8868'}
                </button>
                <button
                  className="location-scene__ledger-button"
                  type="button"
                  onClick={() => {
                    setChiefOpen(true);
                    onChiefDashboardOpen();
                  }}
                >
                  {chiefDashboardLoading ? '\u4e3b\u5b98\u7ba1\u4e8b\u540c\u6b65\u4e2d' : '\u4e3b\u5b98\u7ba1\u4e8b'}
                </button>
              </>
            ) : (
              <p className="location-scene__ledger-empty">{treasuryLoading ? '\u6b63\u5728\u7ffb\u770b\u516c\u8d26...' : '\u6b64\u5730\u5c1a\u672a\u5efa\u7acb\u53ef\u89c1\u516c\u8d26\u3002'}</p>
            )}
          </div>
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
        {ledgerOpen ? (
          <div className="location-scene__ledger-modal" role="dialog" aria-modal="true" aria-label={`${title}\u8fd1\u65e5\u62a5\u544a`}>
            <div className="location-scene__ledger-panel">
              <div className="location-scene__ledger-head">
                <span>{'\u8fd1\u65e5\u62a5\u544a'}</span>
                <strong>{ledgerLoading ? '\u540c\u6b65\u4e2d' : `${filteredLedgerEntries.length}/${ledgerEntries.length}\u6761`}</strong>
              </div>
              <button className="location-scene__ledger-close" type="button" onClick={() => setLedgerOpen(false)}>
                {'\u5173\u95ed'}
              </button>
              <div className="location-scene__ledger-filters">
                {LEDGER_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    className={ledgerFilter === filter.id ? 'is-active' : undefined}
                    type="button"
                    onClick={() => setLedgerFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              {ledgerLoading ? (
                <p className="location-scene__ledger-empty">{'\u6b63\u5728\u7ffb\u770b\u672c\u5730\u8d26\u672c...'}</p>
              ) : filteredLedgerEntries.length > 0 ? (
                <div className="location-scene__ledger-list">
                  {filteredLedgerEntries.map((entry) => (
                    <article key={entry.entryId} className="location-scene__ledger-entry">
                      <div className="location-scene__ledger-entry-head">
                        <span>{formatLedgerTime(entry.createdAt)}</span>
                        <strong>{formatLedgerDelta(entry)}</strong>
                      </div>
                      <p>{entry.description}</p>
                      <div className="location-scene__ledger-actors">
                        {entry.sourceActorId ? (
                          <button type="button" onClick={() => onLedgerActorClick(entry.sourceActorId!)}>
                            {entry.sourceActorDisplayName ?? '\u7ecf\u624b\u4eba'}
                          </button>
                        ) : null}
                        {entry.targetActorId ? (
                          <button type="button" onClick={() => onLedgerActorClick(entry.targetActorId!)}>
                            {entry.targetActorDisplayName ?? '\u76ee\u6807'}
                          </button>
                        ) : null}
                        {entry.beneficiaryActorId ? (
                          <button type="button" onClick={() => onLedgerActorClick(entry.beneficiaryActorId!)}>
                            {entry.beneficiaryDisplayName ?? '\u5165\u8d26\u4eba'}
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="location-scene__ledger-empty">{ledgerEntries.length > 0 ? '\u8fd9\u4e00\u7c7b\u8fd1\u65e5\u6ca1\u6709\u53ef\u89c1\u6d41\u6c34\u3002' : '\u672c\u5730\u8fd1\u65e5\u8fd8\u6ca1\u6709\u53ef\u89c1\u6d41\u6c34\u3002'}</p>
              )}
            </div>
          </div>
        ) : null}
        {financeOpen ? (
          <div className="location-scene__ledger-modal" role="dialog" aria-modal="true" aria-label={`${title}\u8d22\u52a1\u62a5\u8868`}>
            <div className="location-scene__ledger-panel location-scene__finance-panel">
              <div className="location-scene__ledger-head">
                <span>{'\u8d22\u52a1\u62a5\u8868'}</span>
                <strong>{financeReportLoading ? '\u540c\u6b65\u4e2d' : financeReport ? `${financeReport.dailyRows.length}\u65e5` : '--'}</strong>
              </div>
              <button className="location-scene__ledger-close" type="button" onClick={() => setFinanceOpen(false)}>
                {'\u5173\u95ed'}
              </button>
              {financeReportLoading ? (
                <p className="location-scene__ledger-empty">{'\u6b63\u5728\u7ffb\u770b\u4e3b\u5b98\u8d26\u9762...'}</p>
              ) : financeReport ? (
                <>
                  <div className="location-scene__finance-summary">
                    <div><span>{'\u4e3b\u5b98'}</span><strong>{financeReport.chiefActor.displayName}</strong></div>
                    <div><span>{'\u66b4\u9732\u94dc\u94b1'}</span><strong>{formatCopper(financeReport.currentExposedCopper)}</strong></div>
                    <div><span>{'\u4e0b\u671f\u8d21\u989d'}</span><strong>{financeReport.nextTribute ? `${formatCopper(financeReport.nextTribute.paidCopper)} / ${formatCopper(financeReport.nextTribute.dueCopper)}` : '\u672a\u767b\u8bb0'}</strong></div>
                  </div>
                  <div className="location-scene__finance-list">
                    {financeReport.dailyRows.map((row) => (
                      <article key={row.dayKey} className="location-scene__finance-row">
                        <div className="location-scene__finance-row-head">
                          <strong>{row.dayKey}</strong>
                          <span>{row.netCopperDelta >= 0 ? `+${formatCopper(row.netCopperDelta)}` : formatCopper(row.netCopperDelta)}</span>
                        </div>
                        <div className="location-scene__finance-bar">
                          <span
                            className={row.netCopperDelta >= 0 ? 'is-positive' : 'is-negative'}
                            style={{ width: `${Math.max(6, Math.round((Math.abs(row.netCopperDelta) / maxReportAbsDelta) * 100))}%` }}
                          />
                        </div>
                        <div className="location-scene__finance-cells">
                          <span>{`\u5cf0\u503c ${formatCopper(row.peakCopper)}`}</span>
                          <span>{`\u6536\u5165 ${formatCopper(row.incomeCopper)}`}</span>
                          <span>{`\u652f\u51fa ${formatCopper(row.expenseCopper)}`}</span>
                          <span>{`\u88ab\u52ab ${formatCopper(row.raidLossCopper)}`}</span>
                          <span>{`\u9977\u94f6 ${formatCopper(row.guardWageCopper)}`}</span>
                          <span>{`\u4e0a\u7f34 ${formatCopper(row.tributePaidCopper)}`}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <p className="location-scene__ledger-empty">{'\u6b64\u5730\u8d22\u52a1\u62a5\u8868\u6682\u65e0\u53ef\u89c1\u6570\u636e\u3002'}</p>
              )}
            </div>
          </div>
        ) : null}
        {chiefOpen ? (
          <div className="location-scene__ledger-modal" role="dialog" aria-modal="true" aria-label={`${title}\u4e3b\u5b98\u7ba1\u4e8b`}>
            <div className="location-scene__ledger-panel location-scene__finance-panel">
              <div className="location-scene__ledger-head">
                <span>{'\u4e3b\u5b98\u7ba1\u4e8b'}</span>
                <strong>{chiefDashboardLoading ? '\u540c\u6b65\u4e2d' : chiefDashboard?.chiefActor.displayName ?? '--'}</strong>
              </div>
              <button className="location-scene__ledger-close" type="button" onClick={() => setChiefOpen(false)}>
                {'\u5173\u95ed'}
              </button>
              {chiefDashboardLoading ? (
                <p className="location-scene__ledger-empty">{'\u6b63\u5728\u6838\u5bf9\u4e3b\u5b98\u8d26\u9762...'}</p>
              ) : chiefDashboard ? (
                <>
                  <div className="location-scene__chief-dashboard-summary">
                    <button type="button" onClick={() => onLedgerActorClick(chiefDashboard.chiefActor.actorId)}>
                      <strong>{chiefDashboard.chiefActor.displayName}</strong>
                      <span>{chiefDashboard.chiefActor.title ?? '\u573a\u6240\u4e3b\u5b98'}</span>
                    </button>
                    <div>
                      <span>{'\u66b4\u9732\u94dc\u94b1'}</span>
                      <strong>{formatCopper(chiefDashboard.treasury.copperBalance)}</strong>
                    </div>
                    <div>
                      <span>{'\u672c\u5468\u8d21\u989d'}</span>
                      <strong>
                        {chiefDashboard.activeTribute
                          ? `${formatCopper(chiefDashboard.activeTribute.paidCopper)} / ${formatCopper(chiefDashboard.activeTribute.dueCopper)}`
                          : '\u672a\u767b\u8bb0'}
                      </strong>
                    </div>
                    <div>
                      <span>{'\u5b88\u536b'}</span>
                      <strong>{chiefDashboard.treasury.guardSlotsUsed}/{chiefDashboard.treasury.guardSlotsMax}</strong>
                    </div>
                  </div>
                  <section className="location-scene__chief-dashboard-section">
                    <h3>{'\u6838\u5fc3\u804c\u4f4d'}</h3>
                    <div className="location-scene__chief-position-list">
                      {chiefDashboard.topPositions.map((position) => (
                        <article key={position.positionId}>
                          <div>
                            <strong>{position.title}</strong>
                            <span>{formatServiceLabel(position.service)}</span>
                          </div>
                          <button type="button" onClick={() => onLedgerActorClick(position.occupant.actorId)}>
                            {position.occupant.displayName}
                          </button>
                        </article>
                      ))}
                    </div>
                  </section>
                  <section className="location-scene__chief-dashboard-section">
                    <h3>{'\u8fd17\u65e5\u8d26\u9762'}</h3>
                    <div className="location-scene__finance-list">
                      {chiefDashboard.financeSummary.map((row) => (
                        <article key={row.dayKey} className="location-scene__finance-row">
                          <div className="location-scene__finance-row-head">
                            <strong>{row.dayKey}</strong>
                            <span>{row.netCopperDelta >= 0 ? `+${formatCopper(row.netCopperDelta)}` : formatCopper(row.netCopperDelta)}</span>
                          </div>
                          <div className="location-scene__finance-bar">
                            <span
                              className={row.netCopperDelta >= 0 ? 'is-positive' : 'is-negative'}
                              style={{ width: `${Math.max(6, Math.round((Math.abs(row.netCopperDelta) / maxDashboardAbsDelta) * 100))}%` }}
                            />
                          </div>
                          <div className="location-scene__finance-cells">
                            <span>{`\u6536\u5165 ${formatCopper(row.incomeCopper)}`}</span>
                            <span>{`\u652f\u51fa ${formatCopper(row.expenseCopper)}`}</span>
                            <span>{`\u88ab\u52ab ${formatCopper(row.raidLossCopper)}`}</span>
                            <span>{`\u9977\u94f6 ${formatCopper(row.guardWageCopper)}`}</span>
                            <span>{`\u4e0a\u7f34 ${formatCopper(row.tributePaidCopper)}`}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                  <section className="location-scene__chief-dashboard-section">
                    <h3>{'\u8fd1\u671f\u6d41\u6c34'}</h3>
                    <div className="location-scene__ledger-list">
                      {chiefDashboard.recentLedger.length > 0 ? chiefDashboard.recentLedger.map((entry) => (
                        <article key={entry.entryId} className="location-scene__ledger-entry">
                          <div className="location-scene__ledger-entry-head">
                            <span>{formatLedgerTime(entry.createdAt)}</span>
                            <strong>{formatLedgerDelta(entry)}</strong>
                          </div>
                          <p>{entry.description}</p>
                        </article>
                      )) : (
                        <p className="location-scene__ledger-empty">{'\u8fd1\u671f\u5c1a\u65e0\u4e3b\u8981\u6d41\u6c34\u3002'}</p>
                      )}
                    </div>
                  </section>
                </>
              ) : (
                <p className="location-scene__ledger-empty">{'\u6b64\u5730\u4e3b\u5b98\u7ba1\u4e8b\u4fe1\u606f\u6682\u65e0\u53ef\u89c1\u6570\u636e\u3002'}</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
