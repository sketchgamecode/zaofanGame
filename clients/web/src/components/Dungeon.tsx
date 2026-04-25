import { useState, useRef, useEffect, useCallback } from "react";
import { Castle, Sword, Wand2, Zap, Shield, SkipForward, ChevronRight, Lock, ChevronLeft } from "lucide-react";
import type { GameState } from "../core/gameState";
import { getTotalAttributes, saveGameState, getTotalArmor } from "../core/gameState";
import { generateEquipment } from "../core/equipmentGenerator";
import { simulateBattle, type Combatant, type TurnEvent, type BattleResult } from "../core/battleCore";
import { CLASS_CONFIG, MathCore, checkLevelUp } from "../core/mathCore";
import { DUNGEON_CHAPTERS, type DungeonBoss } from "../data/dungeonTable";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FCT { id:number; text:string; targetId:"player"|"enemy"; variant:"damage"|"crit"|"dodge"|"block" }
interface SlashFX { id:number; targetId:"player"|"enemy"; classId:string }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getSlashIcon(classId:string, size=36) {
  if (classId==="CLASS_C") return <Wand2 className="text-purple-400" size={size}/>;
  if (classId==="CLASS_B") return <Zap   className="text-emerald-400" size={size}/>;
  if (classId==="CLASS_A") return <Shield className="text-blue-400" size={size}/>;
  return <Sword className="text-red-400" size={size}/>;
}

function bossToC(boss:DungeonBoss): Combatant {
  return {
    name: boss.name,
    level: boss.level,
    classId: boss.class,
    attributes: {
      strength:     boss.attributes.strength,
      intelligence: boss.attributes.intelligence,
      agility:      boss.attributes.dexterity,
      constitution: boss.attributes.constitution,
      luck:         boss.attributes.luck,
    },
    armor: boss.armor,
    weaponDamage: { min: Math.floor(boss.weaponDamage*0.7), max: Math.floor(boss.weaponDamage*1.3) },
    hasShield: boss.class === "CLASS_A",
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function HPBar({current,max}:{current:number;max:number}) {
  const pct = Math.max(0,Math.min(100,(current/max)*100));
  const color = pct>50?"from-red-600 to-red-500":pct>25?"from-amber-600 to-amber-500":"from-red-900 to-red-700";
  return (
    <div className="w-full h-9 bg-black/70 border border-white/10 rounded-sm relative overflow-hidden shadow-inner">
      <div className={`hp-bar-inner h-full bg-gradient-to-r ${color} absolute left-0 top-0`} style={{width:`${pct}%`}}/>
      <span className="absolute inset-0 flex items-center justify-center text-white font-extrabold text-sm tracking-widest drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
        {current.toLocaleString()} / {max.toLocaleString()}
      </span>
    </div>
  );
}

interface CardProps {
  combatant:Combatant; isPlayer:boolean; currentHP:number; maxHP:number;
  fcList:FCT[]; slashFX:SlashFX|null; isHit:boolean;
}
function CombatantCard({combatant,isPlayer,currentHP,maxHP,fcList,slashFX,isHit}:CardProps) {
  const side = isPlayer?"player":"enemy";
  const border = isPlayer?"border-primary/60":"border-red-900/70";
  const nameColor = isPlayer?"text-primary":"text-red-400";
  return (
    <div className={`flex-1 flex flex-col bg-[#0c0c10] rounded-xl border-2 ${border} overflow-visible relative`}>
      {/* Avatar */}
      <div className="relative h-52 flex flex-col items-center justify-center bg-black/60 border-b border-white/5">
        <div className={`relative w-28 h-28 rounded-lg border-2 ${isPlayer?"border-primary/70":"border-red-700"} flex items-center justify-center bg-gradient-to-b from-darkSurface to-black shadow-[0_4px_20px_rgba(0,0,0,0.8)] z-10 ${isHit?"anim-hit":""}`}>
          <span className="text-5xl select-none">{isPlayer?"🥷":"👺"}</span>
          {slashFX&&slashFX.targetId===side&&(
            <div key={slashFX.id} className="anim-slash absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              {getSlashIcon(slashFX.classId,52)}
            </div>
          )}
        </div>
        <h3 className={`mt-3 text-sm font-bold tracking-widest z-10 ${nameColor} text-center px-2 leading-tight`}>{combatant.name}</h3>
        <p className="text-textMuted text-xs z-10 mt-0.5">Lv.{combatant.level} · {CLASS_CONFIG[combatant.classId].name}</p>
        {fcList.filter(f=>f.targetId===side).map(f=>(
          <div key={f.id} className={`anim-fct absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none z-30 font-extrabold select-none
            ${f.variant==="crit"?"text-3xl text-amber-400 [text-shadow:0_0_6px_#000]":
              f.variant==="dodge"?"text-lg text-slate-300 [text-shadow:0_0_4px_#000]":
              f.variant==="block"?"text-lg text-yellow-400 [text-shadow:0_0_4px_#000]":
              "text-2xl text-red-400 [text-shadow:0_0_6px_#000]"}`}>{f.text}</div>
        ))}
      </div>
      {/* HP */}
      <div className="px-3 py-2 bg-black/80 border-b border-white/5"><HPBar current={currentHP} max={maxHP}/></div>
      {/* Stats */}
      <div className="flex-1 px-5 py-4 font-mono text-sm space-y-2 bg-black/30">
        {[["Strength",combatant.attributes.strength],["Dexterity",combatant.attributes.agility],
          ["Intelligence",combatant.attributes.intelligence],["Constitution",combatant.attributes.constitution],
          ["Luck",combatant.attributes.luck]].map(([l,v])=>(
          <div key={l as string} className="flex justify-between items-center hover:bg-white/5 px-1 rounded">
            <span className="text-textMuted">{l as string}</span>
            <span className="text-gray-200 font-semibold">{(v as number).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chapter Selection UI ─────────────────────────────────────────────────────
interface ChapterListProps {
  gameState: GameState;
  onSelect: (chapterId: string) => void;
}
function ChapterList({ gameState, onSelect }: ChapterListProps) {
  const playerLevel = gameState.playerLevel || 1;
  const today = getToday();
  const dailyAttempt = gameState.dungeonDailyAttempt || { date: '', used: 0 };
  const usedToday = dailyAttempt.date === today ? dailyAttempt.used : 0;
  const attemptsLeft = Math.max(0, 1 - usedToday);

  return (
    <div className="w-full h-full flex flex-col p-6 bg-darkBg relative overflow-y-auto custom-scrollbar select-none">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2 shrink-0">
        <Castle className="text-red-500 w-7 h-7"/>
        <h2 className="text-xl font-bold tracking-[0.4em] text-textMain">州  府  讨  伐</h2>
        <span className={`ml-auto text-xs font-mono border px-3 py-1 rounded ${
          attemptsLeft > 0
            ? "border-red-700/60 text-red-400 bg-red-900/20"
            : "border-darkBorder text-textMuted bg-darkSurface"
        }`}>
          剩余次数 {attemptsLeft}/1
        </span>
      </div>
      {attemptsLeft === 0 && (
        <p className="text-xs text-amber-500/80 font-mono mb-4 text-right">今日挑战次数已用尽，明日再战</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        {DUNGEON_CHAPTERS.map((chapter) => {
          const isUnlocked = playerLevel >= chapter.unlockLevel;
          const progress = gameState.dungeonProgress?.[chapter.id] ?? 0;
          const total = chapter.bosses.length;
          const isComplete = progress >= total;

          return (
            <button
              key={chapter.id}
              onClick={() => isUnlocked && attemptsLeft > 0 ? onSelect(chapter.id) : undefined}
              disabled={!isUnlocked || attemptsLeft === 0}
              className={`relative flex flex-col text-left p-5 rounded-xl border-2 transition-all duration-200
                ${isUnlocked && attemptsLeft > 0
                  ? "border-red-800/70 bg-darkSurface hover:border-red-600 hover:bg-red-900/10 hover:scale-[1.02] cursor-pointer"
                  : "border-darkBorder/50 bg-darkSurface/40 cursor-not-allowed opacity-60"
                }`}
            >
              {/* Top bar accent */}
              <div className={`absolute top-0 left-0 w-full h-0.5 rounded-t-xl ${isComplete ? "bg-yellow-500" : isUnlocked ? "bg-red-700" : "bg-darkBorder"}`}/>

              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className={`font-bold tracking-wide text-base leading-tight ${isUnlocked ? "text-textMain" : "text-textMuted"}`}>
                  {chapter.name}
                </h3>
                {!isUnlocked && <Lock size={16} className="text-textMuted shrink-0 mt-0.5"/>}
                {isComplete && <span className="text-yellow-400 text-xs font-mono shrink-0">✦ 已通关</span>}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-black/50 rounded-full mb-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isComplete ? "bg-yellow-500" : "bg-red-600"}`}
                  style={{ width: `${Math.min(100, (progress / total) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-textMuted">
                  已通关 <span className={isComplete ? "text-yellow-400" : "text-red-400"}>{progress}</span>/{total}
                </span>
                {isUnlocked ? (
                  <span className="text-textMuted">Lv.{chapter.bosses[0]?.level}~{chapter.bosses[total-1]?.level}</span>
                ) : (
                  <span className="text-textMuted">需达到 Lv.{chapter.unlockLevel} 解锁</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface DungeonProps { gameState:GameState; setGameState:(s:GameState)=>void }

export function Dungeon({gameState,setGameState}:DungeonProps) {
  const TICK_MS = 700;

  // ── Chapter selection state ──────────────────────────────────────────────
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const chapter = selectedChapterId
    ? DUNGEON_CHAPTERS.find(c => c.id === selectedChapterId) ?? DUNGEON_CHAPTERS[0]
    : DUNGEON_CHAPTERS[0];

  const progress = gameState.dungeonProgress?.[chapter.id] ?? 0;
  const isChapterDone = progress >= chapter.bosses.length;
  const currentBoss: DungeonBoss | undefined = !isChapterDone ? chapter.bosses[progress] : undefined;

  // ── Battle state ─────────────────────────────────────────────────────────
  type Phase = "idle"|"playing"|"done";
  const [phase,setPhase]         = useState<Phase>("idle");
  const [result,setResult]       = useState<BattleResult|null>(null);
  const [playerHP,setPlayerHP]   = useState(0);
  const [enemyHP,setEnemyHP]     = useState(0);
  const [maxPHP,setMaxPHP]       = useState(1);
  const [maxEHP,setMaxEHP]       = useState(1);
  const [fcList,setFcList]       = useState<FCT[]>([]);
  const [slashFX,setSlashFX]     = useState<SlashFX|null>(null);
  const [playerHit,setPlayerHit] = useState(false);
  const [enemyHit,setEnemyHit]   = useState(false);
  const [loot,setLoot]           = useState<ReturnType<typeof generateEquipment>>(null);
  const [levelUpTo,setLevelUpTo] = useState<number|null>(null);

  const intervalRef  = useRef<ReturnType<typeof setInterval>|null>(null);
  const fctCounter   = useRef(0);
  const slashCounter = useRef(0);

  // build player combatant
  const playerTotalAttrs = getTotalAttributes(gameState).total;
  const playerArmor      = getTotalArmor(gameState);
  const safeEquipped     = gameState.equipped||{};
  const mainHand  = safeEquipped.mainHand;
  const offHand   = safeEquipped.offHand;
  const safeClass = gameState.classId||"CLASS_A";
  const pC: Combatant = {
    name:"无名好汉", level:gameState.playerLevel||1, classId:safeClass,
    attributes: playerTotalAttrs||{strength:10,intelligence:10,agility:10,constitution:10,luck:10},
    armor:playerArmor||0,
    weaponDamage: mainHand?.weaponDamage||{min:(gameState.playerLevel||1)*2,max:(gameState.playerLevel||1)*4},
    offHandWeaponDamage: offHand?.subType==="weapon"?offHand.weaponDamage:undefined,
    hasShield: offHand?.subType==="shield",
  };

  const eC: Combatant | null = currentBoss ? bossToC(currentBoss) : null;

  const clearTicker = () => { if(intervalRef.current){clearInterval(intervalRef.current);intervalRef.current=null} };

  const spawnFCT = (text:string,targetId:"player"|"enemy",variant:FCT["variant"]) => {
    const id=++fctCounter.current;
    setFcList(prev=>[...prev,{id,text,targetId,variant}]);
    setTimeout(()=>setFcList(prev=>prev.filter(f=>f.id!==id)),1200);
  };
  const spawnSlash = (targetId:"player"|"enemy",classId:string) => {
    const id=++slashCounter.current;
    setSlashFX({id,targetId,classId});
    setTimeout(()=>setSlashFX(prev=>prev?.id===id?null:prev),280);
  };
  const triggerHit = (side:"player"|"enemy") => {
    if(side==="player"){setPlayerHit(true);setTimeout(()=>setPlayerHit(false),400)}
    else{setEnemyHit(true);setTimeout(()=>setEnemyHit(false),400)}
  };

  const processEvent = useCallback((ev:TurnEvent) => {
    setPlayerHP(ev.playerHP); setEnemyHP(ev.enemyHP);
    if(ev.actionType==="dodge"){spawnFCT("闪避!",ev.defenderId,"dodge");return}
    if(ev.actionType==="block"){spawnFCT("格挡!",ev.defenderId,"block");return}
    if(ev.actionType==="miss_offhand")return;
    const ac = ev.attackerId==="player"?pC.classId:eC?.classId||"CLASS_A";
    spawnSlash(ev.defenderId,ac);
    triggerHit(ev.defenderId);
    if(ev.isCrit)spawnFCT(`${ev.damage} 暴击!`,ev.defenderId,"crit");
    else spawnFCT(`${ev.damage}`,ev.defenderId,"damage");
  },[pC.classId,eC?.classId]);

  // ── Daily attempt helpers ────────────────────────────────────────────────
  const today = getToday();
  const dailyAttempt = gameState.dungeonDailyAttempt || { date: '', used: 0 };
  const usedToday = dailyAttempt.date === today ? dailyAttempt.used : 0;
  const attemptsLeft = Math.max(0, 1 - usedToday);

  const handleChallenge = () => {
    if(phase==="playing"||!eC||!currentBoss) return;
    if(attemptsLeft <= 0) return;

    const sim = simulateBattle(pC,eC);
    setResult(sim); setMaxPHP(sim.maxPlayerHP); setMaxEHP(sim.maxEnemyHP);
    setPlayerHP(sim.maxPlayerHP); setEnemyHP(sim.maxEnemyHP);
    setFcList([]); setSlashFX(null); setPhase("playing");

    // Compute new state immediately (will be saved after battle)
    let newState: GameState;
    if(sim.pWin){
      const drop = generateEquipment(currentBoss.level*5,"A",true,"blue");
      setLoot(drop);
      const gained = currentBoss.rewardXp;
      const { newLevel, newExp, didLevelUp } = checkLevelUp(
        gameState.playerLevel||1,
        (gameState.exp||0)+gained
      );
      if(didLevelUp) setLevelUpTo(newLevel);
      newState = {
        ...gameState,
        playerLevel: newLevel,
        exp: newExp,
        dungeonProgress: { ...gameState.dungeonProgress, [chapter.id]: progress+1 },
        dungeonDailyAttempt: { date: today, used: 1 },
        resources: {
          ...gameState.resources,
          copper: (gameState.resources?.copper||0)+currentBoss.rewardCoins,
        },
        inventory: drop?[...(gameState.inventory||[]),drop]:(gameState.inventory||[]),
      };
    } else {
      setLoot(null); setLevelUpTo(null);
      newState = {
        ...gameState,
        dungeonDailyAttempt: { date: today, used: 1 },
      };
    }
    setGameState(newState); saveGameState(newState);

    let idx=0;
    intervalRef.current = setInterval(()=>{
      if(idx<sim.events.length){ processEvent(sim.events[idx]); idx++; }
      else{ clearTicker(); setPlayerHP(sim.finalPlayerHP); setEnemyHP(sim.finalEnemyHP); setPhase("done"); }
    },TICK_MS);
  };

  const handleSkip = () => {
    if(!result)return;
    clearTicker(); setPlayerHP(result.finalPlayerHP); setEnemyHP(result.finalEnemyHP);
    setFcList([]); setSlashFX(null); setPhase("done");
  };

  const handleReset = () => {
    clearTicker(); setPhase("idle"); setResult(null);
    setFcList([]); setSlashFX(null); setPlayerHit(false); setEnemyHit(false); setLevelUpTo(null);
    // Return to chapter list after the battle is concluded
    setSelectedChapterId(null);
  };

  useEffect(()=>()=>clearTicker(),[]);

  const showPHP = phase==="idle"?MathCore.getMaxHP(pC.attributes.constitution,pC.level,pC.classId):playerHP;
  const showEHP = phase==="idle"&&eC?MathCore.getMaxHP(eC.attributes.constitution,eC.level,eC.classId):enemyHP;
  const showMaxPHP = phase==="idle"?MathCore.getMaxHP(pC.attributes.constitution,pC.level,pC.classId):maxPHP;
  const showMaxEHP = phase==="idle"&&eC?MathCore.getMaxHP(eC.attributes.constitution,eC.level,eC.classId):maxEHP;

  // ── Chapter list screen ──────────────────────────────────────────────────
  if (selectedChapterId === null) {
    return <ChapterList gameState={gameState} onSelect={setSelectedChapterId} />;
  }

  // ── Battle screen ────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col p-6 bg-darkBg relative overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <button
          onClick={() => { if(phase !== "playing") { clearTicker(); setPhase("idle"); setResult(null); setSelectedChapterId(null); } }}
          className="flex items-center gap-1 text-textMuted hover:text-textMain transition-colors text-sm"
        >
          <ChevronLeft size={16}/> 返回列表
        </button>
        <Castle className="text-red-500 w-7 h-7"/>
        <h2 className="text-xl font-bold tracking-[0.3em] text-textMain">{chapter.name}</h2>
        <span className="ml-auto text-xs text-textMuted font-mono border border-darkBorder px-2 py-1 rounded bg-darkSurface">
          进度 {progress} / {chapter.bosses.length}
        </span>
      </div>

      {/* Boss breadcrumb */}
      {!isChapterDone && currentBoss && (
        <div className="flex items-center gap-2 mb-4 px-1 shrink-0 overflow-x-auto custom-scrollbar pb-1">
          {chapter.bosses.map((b,i)=>(
            <div key={b.id} className="flex items-center gap-1 shrink-0">
              <span className={`text-[10px] font-mono px-2 py-1 rounded border
                ${i<progress?"border-green-700/50 text-green-600 bg-green-900/20":""}
                ${i===progress?"border-red-600/70 text-red-400 bg-red-900/20 font-bold":""}
                ${i>progress?"border-darkBorder text-textMuted/40":""}`}>
                {i+1}.{b.name.slice(0,5)}
              </span>
              {i<chapter.bosses.length-1&&<ChevronRight size={10} className="text-darkBorder shrink-0"/>}
            </div>
          ))}
        </div>
      )}

      {isChapterDone?(
        <div className="flex-1 flex items-center justify-center">
          <h3 className="text-3xl text-yellow-500 font-bold tracking-[0.5em]">【{chapter.name}已光复】</h3>
        </div>
      ):(eC&&currentBoss&&(
        <div className="flex-1 flex gap-6 min-h-0 relative">
          {/* Player */}
          <CombatantCard combatant={pC} isPlayer currentHP={showPHP} maxHP={showMaxPHP} fcList={fcList} slashFX={slashFX} isHit={playerHit}/>
          {/* Center */}
          <div className="w-36 shrink-0 flex flex-col items-center justify-center gap-5 relative z-10">
            <div className="w-20 h-20 rounded-full border-4 border-darkBorder bg-[#0a0a0a] flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.9)]">
              <span className="text-2xl font-black text-yellow-700 italic">VS</span>
            </div>
            {/* Attempt display */}
            <div className={`text-xs font-mono text-center px-2 py-1 rounded border ${
              attemptsLeft > 0
                ? "border-red-700/40 text-red-400/70 bg-red-900/10"
                : "border-darkBorder text-textMuted/50"
            }`}>
              剩余次数 {attemptsLeft}/1
            </div>
            {phase==="idle"&&(
              attemptsLeft > 0 ? (
                <button onClick={handleChallenge}
                  className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 tracking-widest bg-red-900/60 text-red-100 hover:bg-red-700 border-2 border-red-600/50 shadow-[0_0_20px_rgba(185,28,28,0.4)] transition-all hover:scale-105 active:scale-95">
                  出  战
                </button>
              ) : (
                <button disabled
                  className="w-full py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 tracking-wide bg-darkSurface border-2 border-darkBorder text-textMuted/40 cursor-not-allowed">
                  今日已出战
                </button>
              )
            )}
            {phase==="playing"&&(
              <button onClick={handleSkip}
                className="w-full py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 tracking-widest bg-darkSurface border border-darkBorder text-textMuted hover:text-white transition-all">
                <SkipForward size={14}/> 跳过
              </button>
            )}
            {phase==="playing"&&result&&(
              <div className="text-xs text-textMuted font-mono text-center">{result.events.length} 帧</div>
            )}
          </div>
          {/* Boss */}
          <CombatantCard combatant={eC} isPlayer={false} currentHP={showEHP} maxHP={showMaxEHP} fcList={fcList} slashFX={slashFX} isHit={enemyHit}/>

          {/* Post-battle modal */}
          {phase==="done"&&result&&(
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm rounded-xl flex items-center justify-center z-50 anim-fade-in">
              <div className={`w-full max-w-md mx-8 rounded-2xl border-2 p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col items-center text-center gap-4
                ${result.pWin?"bg-[#0a1a0a] border-green-600/70":"bg-[#1a0a0a] border-red-900/70"}`}>
                {result.pWin?(
                  <>
                    <div className="w-20 h-20 rounded-full bg-green-900/50 border-2 border-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                      <span className="text-4xl">🏆</span>
                    </div>
                    <h2 className="text-3xl font-black text-green-400 tracking-widest">讨 伐 成 功</h2>
                    {levelUpTo&&(
                      <div className="w-full py-3 px-4 bg-yellow-900/30 border border-yellow-500/50 rounded-lg flex items-center justify-center gap-3">
                        <span className="text-2xl">⭐</span>
                        <span className="text-yellow-400 font-black text-xl tracking-widest">升级至 Lv.{levelUpTo}！</span>
                      </div>
                    )}
                    <div className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-left space-y-2">
                      <p className="text-xs text-textMuted uppercase tracking-widest mb-2 font-mono">战利品</p>
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                        <span>🪙</span><span>+{currentBoss?.rewardCoins.toLocaleString()} 铜钱</span>
                      </div>
                      <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                        <span>✨</span><span>+{currentBoss?.rewardXp.toLocaleString()} 经验</span>
                      </div>
                      {loot&&(
                        <div className={`mt-3 p-4 rounded-lg border-2 flex items-center gap-4 ${loot.quality==="blue"?"border-blue-500/60 bg-blue-500/10":"border-green-500/60 bg-green-500/10"}`}>
                          <div className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-3xl shrink-0 ${loot.quality==="blue"?"border-blue-400 bg-blue-900/30":"border-green-400 bg-green-900/30"}`}>⚔️</div>
                          <div>
                            <p className={`font-bold text-sm ${loot.quality==="blue"?"text-blue-300":"text-green-300"}`}>{loot.name}</p>
                            <p className="text-xs text-textMuted mt-0.5">{loot.description}</p>
                            {loot.weaponDamage&&<p className="text-xs text-red-400 mt-1">伤害 {loot.weaponDamage.min}-{loot.weaponDamage.max}</p>}
                            {loot.armor&&<p className="text-xs text-blue-300 mt-1">护甲 +{loot.armor}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                    <button onClick={handleReset} className="px-10 py-3 bg-green-900/40 border border-green-600/50 text-green-100 font-bold rounded-lg hover:bg-green-800 transition-all tracking-widest">
                      继 续 征 伐
                    </button>
                  </>
                ):(
                  <>
                    <div className="w-20 h-20 rounded-full bg-red-900/30 border-2 border-red-700 flex items-center justify-center shadow-[0_0_30px_rgba(185,28,28,0.4)]">
                      <span className="text-4xl">💀</span>
                    </div>
                    <h2 className="text-3xl font-black text-red-500 tracking-widest">兵 败 如 山</h2>
                    <p className="text-textMuted text-sm">实力不济，请少侠回去继续修炼。</p>
                    <button onClick={handleReset} className="px-10 py-3 bg-darkSurface border border-darkBorder text-textMuted font-bold rounded-lg hover:bg-white/10 hover:text-white transition-all tracking-widest">
                      收 兵 回 营
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
