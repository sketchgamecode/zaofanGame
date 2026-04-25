import { useState, useRef, useEffect, useCallback } from 'react';
import { Shield, Wand2, Zap, Sword, RefreshCw, Info } from 'lucide-react';
import type { GameState } from '../core/gameState';
import { getTotalAttributes, getTotalArmor, saveGameState } from '../core/gameState';
import { simulateBattle, type Combatant, type TurnEvent, type BattleResult } from '../core/battleCore';
import { MathCore, checkLevelUp } from '../core/mathCore';
import { XP_TABLE } from '../data/xpTable';

// ─── Types ────────────────────────────────────────────────────────────────────
type ClassId = 'CLASS_A' | 'CLASS_B' | 'CLASS_C' | 'CLASS_D';
interface FCT { id: number; text: string; targetId: 'player' | 'enemy'; variant: 'damage' | 'crit' | 'dodge' | 'block' }
interface SlashFX { id: number; targetId: 'player' | 'enemy'; classId: string }

interface Opponent extends Combatant {
  uiAvatar: string;
  prestige: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getToday() { return new Date().toISOString().slice(0, 10); }

function getSlashIcon(classId: string, size = 32) {
  if (classId === 'CLASS_C') return <Wand2 className="text-purple-400" size={size} />;
  if (classId === 'CLASS_B') return <Zap className="text-emerald-400" size={size} />;
  if (classId === 'CLASS_A') return <Shield className="text-blue-400" size={size} />;
  return <Sword className="text-red-400" size={size} />;
}

// ─── NPC Generation ──────────────────────────────────────────────────────────
function generateNPC(playerLevel: number, playerPrestige: number): Opponent {
  const classIds: ClassId[] = ['CLASS_A', 'CLASS_B', 'CLASS_C', 'CLASS_D'];
  const classId = classIds[Math.floor(Math.random() * classIds.length)];
  const avatars = ['👨', '👳', '👲', '🧔', '👴', '👺', '👹', '💀', '👽', '🥷'];
  const uiAvatar = avatars[Math.floor(Math.random() * avatars.length)];
  const rangeFactor = 0.7 + Math.random() * 0.6; // 70% to 130% variation roughly
  const npcLevel = Math.max(1, Math.floor(playerLevel * rangeFactor));

  const baseAttr = npcLevel * 8;
  const rnd = () => Math.floor(baseAttr * (0.8 + Math.random() * 0.4));
  const npcNames = ['落魄游侠', '失意江湖客', '行走的剑客', '独行大盗', '贩夫走卒', '狂徒', '野路子'];
  
  const prestigeDiff = Math.floor((Math.random() - 0.5) * 800); 
  const prestige = Math.max(0, playerPrestige + prestigeDiff);

  return {
    name: npcNames[Math.floor(Math.random() * npcNames.length)],
    level: npcLevel,
    classId,
    uiAvatar,
    prestige,
    attributes: { strength: rnd(), intelligence: rnd(), agility: rnd(), constitution: rnd(), luck: rnd() },
    armor: Math.floor(baseAttr * 0.5),
    weaponDamage: { min: Math.floor(baseAttr * 0.6), max: Math.floor(baseAttr * 1.2) },
    hasShield: classId === 'CLASS_A',
  };
}

// ─── UI Components ────────────────────────────────────────────────────────────
function HPBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? 'from-red-600 to-red-500' : pct > 25 ? 'from-amber-600 to-amber-500' : 'from-red-900 to-red-700';
  return (
    <div className="w-full h-8 bg-black/70 border border-white/10 rounded-sm relative overflow-hidden shadow-inner">
      <div className={`hp-bar-inner h-full bg-gradient-to-r ${color} absolute left-0 top-0`} style={{ width: `${pct}%` }} />
      <span className="absolute inset-0 flex items-center justify-center text-white font-extrabold text-xs tracking-widest drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
        {current.toLocaleString()} / {max.toLocaleString()}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface ArenaProps { gameState: GameState; setGameState: React.Dispatch<React.SetStateAction<GameState>> }

export function Arena({ gameState, setGameState }: ArenaProps) {
  const TICK_MS = 600;
  const CD_DURATION = 10 * 60 * 1000; // 10 minutes

  const today = getToday();
  const dailyXP = gameState.arenaDailyXP || { date: '', wins: 0 };
  const winsToday = dailyXP.date === today ? dailyXP.wins : 0;
  const xpWinsLeft = Math.max(0, 10 - winsToday);

  // CD check
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cooldownEndTime = gameState.arenaCooldownEndTime || 0;
  const inCooldown = cooldownEndTime > now;
  const cooldownSecs = Math.max(0, Math.ceil((cooldownEndTime - now) / 1000));
  const skipCost = 1;
  const canSkip = gameState.resources.tokens >= skipCost;

  // Player Stats Compilation
  const playerTotalAttrs = getTotalAttributes(gameState).total;
  const playerArmor = getTotalArmor(gameState);
  const safeEquipped = gameState.equipped || {};
  const mainHand = safeEquipped.mainHand;
  const offHand = safeEquipped.offHand;
  const safeClass = gameState.classId || 'CLASS_A';
  const pAttr = playerTotalAttrs || { strength: 10, intelligence: 10, agility: 10, constitution: 10, luck: 10 };
  
  const pC: Combatant = {
    name: '无名好汉',
    level: gameState.playerLevel || 1,
    classId: safeClass,
    attributes: pAttr,
    armor: playerArmor || 0,
    weaponDamage: mainHand?.weaponDamage || { min: (gameState.playerLevel || 1) * 2, max: (gameState.playerLevel || 1) * 4 },
    offHandWeaponDamage: offHand?.subType === 'weapon' ? offHand.weaponDamage : undefined,
    hasShield: offHand?.subType === 'shield',
  };

  const pHPMax = MathCore.getMaxHP(pC.attributes.constitution, pC.level, pC.classId);

  // Opponents State
  const [opponents, setOpponents] = useState<Opponent[]>(() => [
    generateNPC(gameState.playerLevel, gameState.resources.prestige),
    generateNPC(gameState.playerLevel, gameState.resources.prestige),
    generateNPC(gameState.playerLevel, gameState.resources.prestige)
  ]);

  type Phase = 'selection' | 'confirming' | 'playing' | 'done';
  const [phase, setPhase] = useState<Phase>('selection');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  
  const [result, setResult] = useState<BattleResult | null>(null);
  const [playerHP, setPlayerHP] = useState(0);
  const [enemyHP, setEnemyHP] = useState(0);
  const [maxEHP, setMaxEHP] = useState(1);
  const [fcList, setFcList] = useState<FCT[]>([]);
  const [slashFX, setSlashFX] = useState<SlashFX | null>(null);
  const [playerHit, setPlayerHit] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [hoveredOpIdx, setHoveredOpIdx] = useState<number | null>(null);

  const [settlePDiff, setSettlePDiff] = useState(0);
  const [settleXp, setSettleXp] = useState(0);
  const [settleCoin, setSettleCoin] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fctCounter = useRef(0);
  const slashCounter = useRef(0);

  const clearTicker = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };

  const spawnFCT = (text: string, targetId: 'player' | 'enemy', variant: FCT['variant']) => {
    const id = ++fctCounter.current;
    setFcList(prev => [...prev, { id, text, targetId, variant }]);
    setTimeout(() => setFcList(prev => prev.filter(f => f.id !== id)), 1100);
  };
  const spawnSlash = (targetId: 'player' | 'enemy', classId: string) => {
    const id = ++slashCounter.current;
    setSlashFX({ id, targetId, classId });
    setTimeout(() => setSlashFX(prev => prev?.id === id ? null : prev), 280);
  };
  const triggerHit = (side: 'player' | 'enemy') => {
    if (side === 'player') { setPlayerHit(true); setTimeout(() => setPlayerHit(false), 400); }
    else { setEnemyHit(true); setTimeout(() => setEnemyHit(false), 400); }
  };

  const processEvent = useCallback((ev: TurnEvent) => {
    setPlayerHP(ev.playerHP); setEnemyHP(ev.enemyHP);
    if (ev.actionType === 'dodge') { spawnFCT('闪避!', ev.defenderId, 'dodge'); return; }
    if (ev.actionType === 'block') { spawnFCT('格挡!', ev.defenderId, 'block'); return; }
    if (ev.actionType === 'miss_offhand') return;
    const ac = ev.attackerId === 'player' ? pC.classId : (selectedIdx !== null ? opponents[selectedIdx].classId : 'CLASS_A');
    spawnSlash(ev.defenderId, ac);
    triggerHit(ev.defenderId);
    if (ev.isCrit) spawnFCT(`${ev.damage} 暴击!`, ev.defenderId, 'crit');
    else spawnFCT(`${ev.damage}`, ev.defenderId, 'damage');
  }, [pC.classId, selectedIdx, opponents]);

  const handleRefreshNPC = () => {
    setOpponents([
      generateNPC(gameState.playerLevel, gameState.resources.prestige),
      generateNPC(gameState.playerLevel, gameState.resources.prestige),
      generateNPC(gameState.playerLevel, gameState.resources.prestige)
    ]);
  };

  const skipCooldown = () => {
    if (!canSkip) return;
    setGameState(prev => {
      const newState = {
        ...prev,
        arenaCooldownEndTime: 0, // Reset
        resources: { ...prev.resources, tokens: prev.resources.tokens - skipCost }
      };
      saveGameState(newState);
      return newState;
    });
  };

  const confirmFight = () => {
    if (selectedIdx === null || inCooldown) return;
    const npc = opponents[selectedIdx];
    const eHPMax = MathCore.getMaxHP(npc.attributes.constitution, npc.level, npc.classId as ClassId);
    const sim = simulateBattle(pC, npc);
    
    setResult(sim); setMaxEHP(eHPMax);
    setPlayerHP(pHPMax); setEnemyHP(eHPMax);
    setFcList([]); setSlashFX(null); setPhase('playing');

    // Calculate Settlement Values
    let calculatedXp = 0;
    let calculatedPDiff = 0;
    let calculatedCoin = 0;

    if (sim.pWin) {
      if (xpWinsLeft > 0) {
        calculatedXp = Math.floor((XP_TABLE[gameState.playerLevel] ?? 400) * 0.05);
      }
      const prestigeGainBase = 10 + Math.floor((npc.prestige - gameState.resources.prestige) * 0.1);
      calculatedPDiff = Math.max(0, Math.floor(prestigeGainBase));
      calculatedCoin = Math.floor(npc.level * 20 * (1 + Math.random() * 0.2));
    } else {
      calculatedPDiff = -Math.max(5, Math.floor(gameState.resources.prestige * 0.02)); // Min loss 5
    }

    setSettleXp(calculatedXp);
    setSettlePDiff(calculatedPDiff);
    setSettleCoin(calculatedCoin);

    // Apply State Changes immediately
    setGameState(prev => {
      let newState: GameState;
      const newCooldown = Date.now() + CD_DURATION;

      if (sim.pWin) {
        const newWins = (dailyXP.date === today ? dailyXP.wins : 0) + 1;
        const newExpRaw = (prev.exp ?? 0) + calculatedXp;
        const { newLevel, newExp } = checkLevelUp(prev.playerLevel, newExpRaw);
        
        newState = {
          ...prev,
          playerLevel: newLevel,
          exp: newExp,
          arenaWins: (prev.arenaWins ?? 0) + 1,
          arenaDailyXP: { date: today, wins: newWins },
          arenaCooldownEndTime: newCooldown,
          resources: { 
            ...prev.resources, 
            copper: prev.resources.copper + calculatedCoin,
            prestige: Math.max(0, prev.resources.prestige + calculatedPDiff)
          },
        };
      } else {
        newState = {
          ...prev,
          arenaCooldownEndTime: newCooldown,
          resources: {
            ...prev.resources,
            prestige: Math.max(0, prev.resources.prestige + calculatedPDiff)
          }
        };
      }
      saveGameState(newState);
      return newState;
    });

    let idx = 0;
    intervalRef.current = setInterval(() => {
      if (idx < sim.events.length) { processEvent(sim.events[idx]); idx++; }
      else { clearTicker(); setPlayerHP(sim.finalPlayerHP); setEnemyHP(sim.finalEnemyHP); setPhase('done'); }
    }, TICK_MS);
  };

  const jumpToSettlement = () => {
    if (!result) return;
    clearTicker(); setPlayerHP(result.finalPlayerHP); setEnemyHP(result.finalEnemyHP);
    setFcList([]); setSlashFX(null); setPhase('done');
  };

  const handleReturn = () => {
    clearTicker(); setPhase('selection'); setResult(null); setSelectedIdx(null);
    setFcList([]); setSlashFX(null); setPlayerHit(false); setEnemyHit(false);
    handleRefreshNPC(); // Auto refresh for next fight
  };

  const renderDiffNum = (playerV: number, opV: number) => {
    const diff = playerV - opV;
    if (diff > 0) return <span className="text-emerald-500 font-bold tracking-wider">+{diff}</span>;
    if (diff < 0) return <span className="text-red-500 font-bold tracking-wider">{diff}</span>;
    return <span className="text-gray-500 font-bold ml-1">0</span>;
  };

  const renderCardArea = () => {
    if (phase === 'selection') {
      return (
        <div className="flex-1 flex flex-col md:flex-row gap-6 mt-4 w-full h-full pb-8">
          {opponents.map((op, i) => {
            const eMaxHP = MathCore.getMaxHP(op.attributes.constitution, op.level, op.classId as ClassId);
            const showTooltip = hoveredOpIdx === i;

            return (
              <div 
                key={i} 
                onMouseEnter={() => setHoveredOpIdx(i)}
                onMouseLeave={() => setHoveredOpIdx(null)}
                className="flex-1 relative flex flex-col items-center p-6 border-2 border-[#1c1a24] rounded-xl bg-gradient-to-b from-[#111] to-black hover:border-yellow-600/50 hover:shadow-[0_0_20px_rgba(202,138,4,0.15)] transition-all cursor-pointer group"
                onClick={() => { setSelectedIdx(i); setPhase('confirming'); }}
              >
                {/* Avatar Portrait */}
                <div className="w-24 h-24 rounded shadow-inner border-2 border-[#1c1a24] group-hover:border-yellow-600 flex items-center justify-center bg-darkSurface text-5xl select-none mb-3">
                  {op.uiAvatar}
                </div>
                <div className="text-center w-full mb-3">
                  <h3 className="font-bold text-gray-200">{op.name}</h3>
                  <p className="text-xs text-textMuted font-mono">Level {op.level}</p>
                </div>
                
                {/* Thick Red HP Bar */}
                <div className="w-full mt-auto">
                    <HPBar current={eMaxHP} max={eMaxHP} />
                </div>

                {/* Base Attributes Mini View */}
                <div className="w-full mt-4 flex flex-col gap-1.5 font-mono text-xs">
                   { [
                      { label: "Strength", val: op.attributes.strength, c: "text-red-400" },
                      { label: "Dexterity", val: op.attributes.agility, c: "text-emerald-400" },
                      { label: "Intelligence", val: op.attributes.intelligence, c: "text-blue-400" },
                      { label: "Constitution", val: op.attributes.constitution, c: "text-orange-400" },
                      { label: "Luck", val: op.attributes.luck, c: "text-purple-400" }
                    ].map(row => (
                      <div key={row.label} className="flex justify-between">
                         <span className={row.c}>{row.label}</span>
                         <span className="text-gray-300">{row.val}</span>
                      </div>
                    ))}
                </div>

                {/* --- Hover Tooltip Full Comparison Mode --- */}
                {showTooltip && (
                  <div className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-black/95 border border-white/20 shadow-2xl rounded p-4 pointer-events-none anim-fade-in text-sm font-mono flex flex-col">
                     <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-2 text-white items-center">
                        <div className="col-span-1 text-gray-400 border-b border-white/20 pb-1">Stat</div>
                        <div className="col-span-1 text-center border-b border-white/20 pb-1 w-12">{op.name}</div>
                        <div className="col-span-1 border-b border-white/20 pb-1 w-12 text-right">Diff</div>
                        
                        <div className="text-blue-300">Level</div>
                        <div className="text-center">{op.level}</div>
                        <div className="text-right">{renderDiffNum(pC.level, op.level)}</div>
                        
                        <div className="text-yellow-500 font-bold">Prestige</div>
                        <div className="text-center">{op.prestige}</div>
                        <div className="text-right">{renderDiffNum(gameState.resources.prestige, op.prestige)}</div>

                        <div className="text-red-400 font-bold mt-2">Hit Points</div>
                        <div className="text-center mt-2">{eMaxHP}</div>
                        <div className="text-right mt-2">{renderDiffNum(pHPMax, eMaxHP)}</div>

                        <div className="mt-2 text-gray-400">Strength</div>
                        <div className="text-center mt-2">{op.attributes.strength}</div>
                        <div className="text-right mt-2">{renderDiffNum(pAttr.strength, op.attributes.strength)}</div>

                        <div className="text-gray-400">Dexterity</div>
                        <div className="text-center">{op.attributes.agility}</div>
                        <div className="text-right">{renderDiffNum(pAttr.agility, op.attributes.agility)}</div>

                        <div className="text-gray-400">Intelligence</div>
                        <div className="text-center">{op.attributes.intelligence}</div>
                        <div className="text-right">{renderDiffNum(pAttr.intelligence, op.attributes.intelligence)}</div>

                        <div className="text-gray-400">Constitution</div>
                        <div className="text-center">{op.attributes.constitution}</div>
                        <div className="text-right">{renderDiffNum(pAttr.constitution, op.attributes.constitution)}</div>

                        <div className="text-gray-400">Luck</div>
                        <div className="text-center">{op.attributes.luck}</div>
                        <div className="text-right">{renderDiffNum(pAttr.luck, op.attributes.luck)}</div>
                     </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    
    if (phase === 'playing' || phase === 'done') {
      const npc = opponents[selectedIdx!];
      return (
        <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center p-8 relative">
           
           {/* Left Player Side */}
           <div className={`w-64 flex flex-col bg-[#0c0c10] border-2 border-primary/40 rounded-xl overflow-hidden relative ${playerHit? 'anim-hit' : ''}`}>
             <div className="p-4 bg-black/50 text-center relative border-b border-white/5 h-40 flex flex-col items-center justify-center">
                 <div className="text-5xl mb-2 z-10">🥷</div>
                 <h3 className="font-bold text-primary z-10">无名好汉</h3>
                 <p className="text-xs text-textMuted z-10 font-mono">Lv. {pC.level}</p>
                 {slashFX && slashFX.targetId === 'player' && (
                    <div className="anim-slash absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      {getSlashIcon(slashFX.classId, 42)}
                    </div>
                  )}
                 {fcList.filter(f => f.targetId === 'player').map(f => (
                    <div key={f.id} className={`anim-fct absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-30 font-extrabold select-none
                      ${f.variant === 'crit' ? 'text-2xl text-amber-400 [text-shadow:0_0_6px_#000]' :
                        f.variant === 'dodge' ? 'text-base text-slate-300 [text-shadow:0_0_4px_#000]' :
                        f.variant === 'block' ? 'text-base text-yellow-400 [text-shadow:0_0_4px_#000]' :
                        'text-xl text-red-400 [text-shadow:0_0_6px_#000]'}`}>{f.text}</div>
                  ))}
             </div>
             <div className="p-2 bg-black"><HPBar current={playerHP} max={pHPMax} /></div>
             <div className="w-full bg-[#111] p-4 flex flex-col gap-2 font-mono text-xs border-t border-white/5">
                { [
                  { label: "Strength", val: pAttr.strength, c: "text-red-400" },
                  { label: "Dexterity", val: pAttr.agility, c: "text-emerald-400" },
                  { label: "Intelligence", val: pAttr.intelligence, c: "text-blue-400" },
                  { label: "Constitution", val: pAttr.constitution, c: "text-orange-400" },
                  { label: "Luck", val: pAttr.luck, c: "text-purple-400" }
                ].map(row => (
                  <div key={row.label} className="flex justify-between border-b border-white/5 pb-1 last:border-0 last:pb-0">
                     <span className={row.c}>{row.label}</span>
                     <span className="text-gray-300 font-bold">{row.val}</span>
                  </div>
                ))}
             </div>
           </div>

           {/* VS vs Skip Layout Center */}
           <div className="shrink-0 flex flex-col items-center justify-center gap-6 z-10 mx-6">
             {phase === 'playing' && (
               <button onClick={jumpToSettlement} className="px-10 py-4 bg-blue-900/60 border-2 border-blue-500 hover:bg-blue-700 font-black tracking-widest text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all rounded-lg active:scale-95 text-lg">
                 SKIP
               </button>
             )}
             <div className="w-16 h-16 rounded-full border border-darkBorder bg-black flex items-center justify-center">
                <span className="font-bold italic text-white/50">VS</span>
             </div>
           </div>

           {/* Right Enemy Side */}
           <div className={`w-64 flex flex-col bg-[#0c0c10] border-2 border-orange-900/50 rounded-xl overflow-hidden relative ${enemyHit? 'anim-hit' : ''}`}>
             <div className="p-4 bg-black/50 text-center relative border-b border-white/5 h-40 flex flex-col items-center justify-center">
                 <div className="text-5xl mb-2 z-10">{npc.uiAvatar}</div>
                 <h3 className="font-bold text-orange-400 z-10">{npc.name}</h3>
                 <p className="text-xs text-textMuted z-10 font-mono">Lv. {npc.level}</p>
                 {slashFX && slashFX.targetId === 'enemy' && (
                    <div className="anim-slash absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      {getSlashIcon(slashFX.classId, 42)}
                    </div>
                  )}
                 {fcList.filter(f => f.targetId === 'enemy').map(f => (
                    <div key={f.id} className={`anim-fct absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-30 font-extrabold select-none
                      ${f.variant === 'crit' ? 'text-2xl text-amber-400 [text-shadow:0_0_6px_#000]' :
                        f.variant === 'dodge' ? 'text-base text-slate-300 [text-shadow:0_0_4px_#000]' :
                        f.variant === 'block' ? 'text-base text-yellow-400 [text-shadow:0_0_4px_#000]' :
                        'text-xl text-red-400 [text-shadow:0_0_6px_#000]'}`}>{f.text}</div>
                  ))}
             </div>
             <div className="p-2 bg-black"><HPBar current={enemyHP} max={maxEHP} /></div>
             <div className="w-full bg-[#111] p-4 flex flex-col gap-2 font-mono text-xs border-t border-white/5">
                { [
                  { label: "Strength", val: npc.attributes.strength, c: "text-red-400" },
                  { label: "Dexterity", val: npc.attributes.agility, c: "text-emerald-400" },
                  { label: "Intelligence", val: npc.attributes.intelligence, c: "text-blue-400" },
                  { label: "Constitution", val: npc.attributes.constitution, c: "text-orange-400" },
                  { label: "Luck", val: npc.attributes.luck, c: "text-purple-400" }
                ].map(row => (
                  <div key={row.label} className="flex justify-between border-b border-white/5 pb-1 last:border-0 last:pb-0">
                     <span className={row.c}>{row.label}</span>
                     <span className="text-gray-300 font-bold">{row.val}</span>
                  </div>
                ))}
             </div>
           </div>

           {/* Settlement Post Battle */}
           {phase === 'done' && result && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center anim-fade-in">
              <div className="border-4 border-yellow-700 bg-gradient-to-b from-[#111] to-[#050505] p-1 shadow-2xl relative w-full max-w-lg">
                <div className="border border-yellow-800/50 bg-[#161616] p-8 flex flex-col items-center">
                  
                  {/* Result Header Badge */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center drop-shadow-2xl">
                    <div className="bg-[#222] border-2 border-yellow-600 rounded-full px-6 py-2 shadow-xl shadow-yellow-600/20">
                      <h2 className={`text-2xl font-black tracking-wider ${result.pWin ? 'text-emerald-400' : 'text-red-500'}`}>
                        {result.pWin ? 'VICTORY' : 'LOSS'}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6 w-full text-center mb-6">
                    <p className="text-sm font-mono text-gray-400 px-4">
                      {result.pWin 
                        ? "You have brought honor to yourself and crushed your opponent in the bloody sands of the arena." 
                        : "Now you know how it feels when the audience whistles and boos... but they are right."
                      }
                    </p>
                  </div>
                  
                  {/* Results Pane */}
                  <div className="w-full bg-[#0d0d0d] border border-[#2a2a2a] p-5 mb-8 flex flex-col gap-3 font-mono text-sm leading-relaxed">
                     <div className="text-yellow-600 font-bold mb-1 underline underline-offset-4 decoration-yellow-900">PROGRESS:</div>
                     
                     <div className="flex justify-between items-center text-yellow-400">
                        <span>Honor {result.pWin ? 'gained' : 'lost'}</span>
                        <span className={`font-bold ${result.pWin ? 'text-green-500' : 'text-red-500'}`}>
                          {settlePDiff > 0 ? `+${settlePDiff}` : settlePDiff}
                        </span>
                     </div>
                     
                     {result.pWin && (
                       <>
                         <div className="flex justify-between items-center text-amber-500/80">
                            <span>Coins looted</span>
                            <span className="font-bold text-amber-400">+{settleCoin}</span>
                         </div>
                         <div className="flex justify-between items-center text-blue-400/80">
                            <span>Experience Point</span>
                            <span className="font-bold text-blue-400">{settleXp > 0 ? `+${settleXp}` : '0 (Daily Cap)'}</span>
                         </div>
                       </>
                     )}
                  </div>

                  <button 
                    onClick={handleReturn}
                    className="w-40 py-2.5 bg-blue-900 border border-blue-500/50 hover:bg-blue-600 font-bold text-white tracking-widest shadow-lg rounded transition-all active:scale-95 text-sm"
                  >
                     OK
                  </button>
                </div>
              </div>
            </div>
           )}

        </div>
      );
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#0a0a0c] bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] relative overflow-x-hidden font-sans select-none">
      
      {/* Top Banner & Cooldown Control */}
      <div className="shrink-0 flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-black rounded-lg border border-yellow-700/50 flex flex-col items-center justify-center shadow-inner">
             <span className="text-xs text-yellow-700 font-bold tracking-widest">XP</span>
             <span className="text-sm font-black text-yellow-500">{winsToday}/10</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-[0.2em] text-white/90 uppercase drop-shadow">
              Arena
            </h1>
            <p className="text-xs text-textMuted font-light italic">Spill blood for honor and gold.</p>
          </div>
        </div>
        
        {/* Cooldown Module */}
        <div className="flex items-center gap-4 border border-darkBorder bg-darkSurface/50 px-4 py-2 rounded">
           {inCooldown ? (
             <>
               <span className="text-sm font-mono text-red-400 font-bold">
                 Wait {Math.floor(cooldownSecs / 60)}:{(cooldownSecs % 60).toString().padStart(2, '0')}
               </span>
               <button 
                 onClick={skipCooldown}
                 disabled={!canSkip}
                 className="text-xs px-3 py-1 bg-yellow-900/30 border border-yellow-600/50 text-yellow-500 disabled:opacity-30 disabled:border-gray-700 disabled:text-gray-500 transition-colors flex items-center gap-1 hover:bg-yellow-600 hover:text-black rounded"
                 title="Spend a token to bypass wait time"
               >
                 SKIP 1💎
               </button>
             </>
           ) : (
             <span className="text-sm font-mono text-emerald-500 font-bold">Ready to Fight</span>
           )}
           <button onClick={handleRefreshNPC} className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors" title="Reroll Opponents" disabled={phase !== 'selection'}>
             <RefreshCw size={16} />
           </button>
        </div>
      </div>

      {/* Main Body */}
      {renderCardArea()}

      {/* Confirmation Modal */}
      {phase === 'confirming' && selectedIdx !== null && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center anim-fade-in">
          {inCooldown ? (
             <div className="bg-black border border-red-900 p-8 rounded-lg shadow-2xl flex flex-col items-center">
               <Info className="w-12 h-12 text-red-500 mb-4" />
               <p className="text-white text-lg max-w-sm text-center mb-6">You must wait before entering another fight, or bribe the guard to skip the wait.</p>
               <button onClick={() => setPhase('selection')} className="px-8 py-2 bg-darkSurface border border-darkBorder text-white hover:bg-red-900 hover:border-red-500 transition-all">Back</button>
             </div>
          ) : (
             <div className="bg-[#111] border border-blue-900 p-8 rounded-xl shadow-[0_0_40px_rgba(30,58,138,0.3)] flex flex-col items-center">
               <p className="text-white text-lg max-w-sm text-center font-mono leading-relaxed mb-8">
                 Do you want to challenge <span className="font-bold text-yellow-500">{opponents[selectedIdx].name}</span> in the arena?
                 <br/><br/>
                 <span className="text-sm text-gray-500">XP Fights Remaining: {xpWinsLeft}/10</span>
               </p>
               <div className="flex gap-4">
                 <button onClick={() => setPhase('selection')} className="px-6 py-2 bg-transparent text-gray-400 hover:text-white border border-transparent hover:border-gray-600 transition-colors">Cancel</button>
                 <button onClick={confirmFight} className="px-8 py-2 bg-blue-900 hover:bg-blue-600 text-white font-bold border border-blue-500 transition-colors shadow-lg">OK</button>
               </div>
             </div>
          )}
        </div>
      )}

    </div>
  );
}
