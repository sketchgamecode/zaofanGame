import { getTotalAttributes, getTotalArmor, getInitialGameState } from '@core/gameState';
import { MathCore, CLASS_CONFIG, checkLevelUp } from '@core/mathCore';
import { simulateBattle } from '@core/battleCore';
import { XP_TABLE } from '@data/xpTable';
import { DUNGEON_CHAPTERS } from '@data/dungeonTable';
const uid = () => Math.random().toString(36).slice(2, 8);
const mk = (type, text) => ({ id: uid(), type, text });
function getToday() { return new Date().toISOString().slice(0, 10); }
function makePlayerCombatant(gs) {
    const attrs = getTotalAttributes(gs).total;
    return {
        name: '无名好汉', level: gs.playerLevel, classId: gs.classId,
        attributes: attrs, armor: getTotalArmor(gs),
        weaponDamage: gs.equipped?.mainHand?.weaponDamage ?? { min: gs.playerLevel * 2, max: gs.playerLevel * 4 },
        hasShield: gs.equipped?.offHand?.subType === 'shield',
    };
}
function genNPC(playerLevel, prestige) {
    const classIds = ['CLASS_A', 'CLASS_B', 'CLASS_C', 'CLASS_D'];
    const classId = classIds[Math.floor(Math.random() * 4)];
    const lv = Math.max(1, playerLevel + Math.floor((Math.random() - 0.5) * 4));
    const b = lv * 8;
    const rnd = () => Math.floor(b * (0.8 + Math.random() * 0.4));
    return {
        name: ['落魄游侠', '失意剑客', '草莽英雄', '独行大盗'][Math.floor(Math.random() * 4)],
        level: lv, classId, attributes: { strength: rnd(), intelligence: rnd(), agility: rnd(), constitution: rnd(), luck: rnd() },
        armor: Math.floor(b * 0.5), weaponDamage: { min: Math.floor(b * 0.6), max: Math.floor(b * 1.2) }, hasShield: false,
        prestige: Math.max(0, prestige + Math.floor((Math.random() - 0.5) * 600)),
    };
}
const MISSION_TEMPLATES = [
    { type: 'A', name: '刺探情报', min: 30, food: 5, expM: 0.10, coinM: 0.20 },
    { type: 'B', name: '劫持粮道', min: 90, food: 15, expM: 0.28, coinM: 0.55 },
    { type: 'C', name: '攻打官兵', min: 180, food: 30, expM: 0.50, coinM: 1.00 },
];
function applyXP(state, xp) {
    if (xp <= 0)
        return state;
    const { newLevel, newExp } = checkLevelUp(state.playerLevel, (state.exp ?? 0) + xp);
    return { ...state, playerLevel: newLevel, exp: newExp };
}
export function executeCommand(input, state) {
    const parts = input.trim().toLowerCase().split(/\s+/);
    const cmd = parts[0];
    const arg = parts[1] ?? '';
    const logs = [];
    let s = state;
    const say = (type, text) => logs.push(mk(type, text));
    switch (cmd) {
        // ── HELP ──────────────────────────────────────────────────────────────────
        case 'help':
        case '?':
            say('info', '── 命令列表 ───────────────────');
            say('info', 'status / s         — 查看角色状态');
            say('info', 'mission a/b/c      — 开始任务 (m a)');
            say('info', 'collect / c        — 领取完成的任务');
            say('info', 'skip               — 花1通宝跳过任务');
            say('info', 'fight / f          — 竞技场快速出战');
            say('info', 'boss               — 挑战当前副本boss');
            say('info', 'upgrade str/agi/int/con/lck  (up s)');
            say('info', 'shop               — 黑市（开发中）');
            say('info', 'rations / r        — 花1通宝补充50干粮');
            say('info', 'cheat              — [测试] 获得大量资源');
            say('info', 'reset confirm      — [危险] 从头开始游戏');
            say('info', '───────────────────────────────');
            break;
        // ── STATUS ─────────────────────────────────────────────────────────────
        case 'status':
        case 's': {
            const a = getTotalAttributes(s).total;
            const cls = CLASS_CONFIG[s.classId];
            const hp = MathCore.getMaxHP(a.constitution, s.playerLevel, s.classId);
            const xpNeed = XP_TABLE[s.playerLevel] ?? 9999;
            const r = s.resources;
            say('info', `── ${cls.name} Lv.${s.playerLevel} ─────────────────`);
            say('info', `XP ${s.exp}/${xpNeed} | HP ${hp}`);
            say('info', `武力${a.strength} 身法${a.agility} 智谋${a.intelligence} 体质${a.constitution} 福缘${a.luck}`);
            say('info', `铜钱${r.copper} | 声望${r.prestige} | 干粮${r.rations}/100 | 通宝${r.tokens}`);
            break;
        }
        // ── MISSION ────────────────────────────────────────────────────────────
        case 'mission':
        case 'm': {
            if (s.activeMission) {
                say('err', '已有进行中的任务，先领取或跳过');
                break;
            }
            const tpl = MISSION_TEMPLATES.find(t => t.type.toLowerCase() === arg.toUpperCase() || arg === t.type.toLowerCase());
            if (!tpl) {
                say('err', `用法: mission a / b / c`);
                break;
            }
            if (s.resources.rations < tpl.food) {
                say('err', `干粮不足 (需要${tpl.food})`);
                break;
            }
            const xpNeed = XP_TABLE[s.playerLevel] ?? 400;
            const expReward = Math.floor(xpNeed * tpl.expM * (0.9 + Math.random() * 0.2));
            const coinReward = Math.floor(s.playerLevel * 50 * tpl.coinM * (0.9 + Math.random() * 0.2));
            const endTime = Date.now() + tpl.min * 60 * 1000;
            s = { ...s, resources: { ...s.resources, rations: s.resources.rations - tpl.food },
                activeMission: { id: `m_${Date.now()}`, type: tpl.type, name: tpl.name, durationSec: tpl.min * 60, foodCost: tpl.food, expReward, coinReward, dropRate: 0.1, endTime } };
            const endStr = new Date(endTime).toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' });
            say('ok', `📜 开始任务: ${tpl.name} (${tpl.min}min) → 完成于 ${endStr}`);
            say('info', `预计奖励: ~${expReward}XP ~${coinReward}🪙  消耗干粮-${tpl.food}`);
            break;
        }
        // ── COLLECT ────────────────────────────────────────────────────────────
        case 'collect':
        case 'c': {
            const m = s.activeMission;
            if (!m) {
                say('err', '当前没有任务');
                break;
            }
            if (m.endTime > Date.now()) {
                const left = Math.ceil((m.endTime - Date.now()) / 60000);
                say('err', `任务尚未完成，还剩 ${left} 分钟`);
                break;
            }
            s = applyXP({ ...s, resources: { ...s.resources, copper: s.resources.copper + m.coinReward }, activeMission: null }, m.expReward);
            say('reward', `✅ 完成「${m.name}」! +${m.expReward}XP +${m.coinReward}🪙`);
            if (s.playerLevel > state.playerLevel)
                say('ok', `🎉 升级! Lv.${state.playerLevel} → Lv.${s.playerLevel}`);
            break;
        }
        // ── SKIP ──────────────────────────────────────────────────────────────
        case 'skip': {
            if (!s.activeMission) {
                say('err', '当前没有任务');
                break;
            }
            if (s.resources.tokens < 1) {
                say('err', '通宝不足 (需要1💎)');
                break;
            }
            const m = s.activeMission;
            s = applyXP({ ...s, resources: { ...s.resources, tokens: s.resources.tokens - 1, copper: s.resources.copper + m.coinReward }, activeMission: null }, m.expReward);
            say('ok', `⏭ 花费1💎跳过「${m.name}」! +${m.expReward}XP +${m.coinReward}🪙`);
            break;
        }
        // ── FIGHT ─────────────────────────────────────────────────────────────
        case 'fight':
        case 'f': {
            const today = getToday();
            const daily = s.arenaDailyXP ?? { date: '', wins: 0 };
            const cdEnd = s.arenaCooldownEndTime ?? 0;
            if (cdEnd > Date.now()) {
                const secs = Math.ceil((cdEnd - Date.now()) / 1000);
                say('err', `冷却中 (${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')})`);
                break;
            }
            const opp = genNPC(s.playerLevel, s.resources.prestige);
            const result = simulateBattle(makePlayerCombatant(s), opp);
            const winsToday = daily.date === today ? daily.wins : 0;
            const xpLeft = Math.max(0, 10 - winsToday);
            let xpGain = 0, coinGain = 0, pdiff = 0;
            if (result.pWin) {
                if (xpLeft > 0)
                    xpGain = Math.floor((XP_TABLE[s.playerLevel] ?? 400) * 0.05);
                pdiff = Math.max(0, Math.floor(10 + (opp.prestige - s.resources.prestige) * 0.1));
                coinGain = Math.floor(opp.level * 20 * (1 + Math.random() * 0.2));
            }
            else {
                pdiff = -Math.max(5, Math.floor(s.resources.prestige * 0.02));
            }
            s = applyXP({
                ...s, arenaWins: (s.arenaWins ?? 0) + (result.pWin ? 1 : 0),
                arenaCooldownEndTime: Date.now() + 10 * 60 * 1000,
                arenaDailyXP: { date: today, wins: winsToday + (result.pWin ? 1 : 0) },
                resources: { ...s.resources, copper: s.resources.copper + coinGain, prestige: Math.max(0, s.resources.prestige + pdiff) },
            }, xpGain);
            say('battle', `⚔️ 对战: ${opp.name} Lv.${opp.level}`);
            if (result.pWin) {
                say('reward', `🏆 胜利! +${xpGain}XP +${coinGain}🪙 声望${pdiff >= 0 ? '+' : ''}${pdiff}`);
            }
            else {
                say('err', `💀 落败. 声望${pdiff}`);
            }
            if (s.playerLevel > state.playerLevel)
                say('ok', `🎉 升级! Lv.${s.playerLevel}`);
            break;
        }
        // ── BOSS ──────────────────────────────────────────────────────────────
        case 'boss': {
            const today = getToday();
            const da = s.dungeonDailyAttempt ?? { date: '', used: 0 };
            const used = da.date === today ? da.used : 0;
            if (used >= 1) {
                if (s.resources.tokens >= 1) {
                    s = { ...s, resources: { ...s.resources, tokens: s.resources.tokens - 1 } };
                    say('info', '今日次数已尽，消耗 1💎 额外出战');
                }
                else {
                    say('err', '今日副本次数已用完 (额外挑战需要 1💎)');
                    break;
                }
            }
            const prog = s.dungeonProgress ?? {};
            let found = false;
            for (const ch of DUNGEON_CHAPTERS) {
                const beaten = prog[ch.id] ?? 0;
                if (beaten < ch.bosses.length) {
                    const boss = ch.bosses[beaten];
                    const bC = {
                        name: boss.name, level: boss.level, classId: boss.class,
                        attributes: { strength: boss.attributes.strength, agility: boss.attributes.dexterity, intelligence: boss.attributes.intelligence, constitution: boss.attributes.constitution, luck: boss.attributes.luck },
                        armor: boss.armor, weaponDamage: { min: Math.floor(boss.weaponDamage * 0.8), max: Math.floor(boss.weaponDamage * 1.2) }, hasShield: false,
                    };
                    const result = simulateBattle(makePlayerCombatant(s), bC);
                    const newProg = { ...prog };
                    if (result.pWin)
                        newProg[ch.id] = beaten + 1;
                    s = applyXP({
                        ...s, dungeonProgress: newProg,
                        dungeonDailyAttempt: { date: today, used: used + 1 },
                        resources: { ...s.resources, copper: s.resources.copper + (result.pWin ? boss.rewardCoins : 0) },
                    }, result.pWin ? boss.rewardXp : 0);
                    say('battle', `🗺 挑战「${boss.name}」Lv.${boss.level}`);
                    if (result.pWin)
                        say('reward', `🏆 讨伐成功! +${boss.rewardXp}XP +${boss.rewardCoins}🪙`);
                    else
                        say('err', `💀 败于「${boss.name}」`);
                    if (s.playerLevel > state.playerLevel)
                        say('ok', `🎉 升级! Lv.${s.playerLevel}`);
                    found = true;
                    break;
                }
            }
            if (!found)
                say('ok', '🏆 所有副本已通关！');
            break;
        }
        // ── UPGRADE ───────────────────────────────────────────────────────────
        case 'upgrade':
        case 'up':
        case 'u': {
            const MAP = {
                str: 'strength', s: 'strength', 武力: 'strength',
                agi: 'agility', a: 'agility', 身法: 'agility',
                int: 'intelligence', i: 'intelligence', 智谋: 'intelligence',
                con: 'constitution', c: 'constitution', 体质: 'constitution',
                lck: 'luck', l: 'luck', 福缘: 'luck',
            };
            const attr = MAP[arg];
            if (!attr) {
                say('err', '用法: up str/agi/int/con/lck');
                break;
            }
            const cur = s.attributes[attr];
            const cost = MathCore.getUpgradeCost(cur);
            if (s.resources.copper < cost) {
                say('err', `铜钱不足 (需要${cost}🪙，当前${s.resources.copper})`);
                break;
            }
            s = { ...s, attributes: { ...s.attributes, [attr]: cur + 1 }, resources: { ...s.resources, copper: s.resources.copper - cost } };
            const NAMES = { strength: '武力', agility: '身法', intelligence: '智谋', constitution: '体质', luck: '福缘' };
            say('ok', `⬆️ ${NAMES[attr]} ${cur} → ${cur + 1}  (-${cost}🪙)`);
            break;
        }
        // ── RATIONS ───────────────────────────────────────────────────────────
        case 'rations':
        case 'r': {
            if (s.resources.tokens < 1) {
                say('err', '通宝不足 (需要1💎)');
                break;
            }
            const add = Math.min(50, 100 - s.resources.rations);
            if (add <= 0) {
                say('info', '干粮已满');
                break;
            }
            s = { ...s, resources: { ...s.resources, tokens: s.resources.tokens - 1, rations: s.resources.rations + add } };
            say('ok', `🍚 干粮补充 +${add} (消耗1💎)`);
            break;
        }
        // ── CHEAT (DEV ONLY) ──────────────────────────────────────────────────────
        case 'cheat': {
            s = applyXP({ ...s,
                resources: {
                    ...s.resources,
                    copper: s.resources.copper + 100000,
                    prestige: s.resources.prestige + 5000,
                    rations: 100,
                    tokens: s.resources.tokens + 1000,
                }
            }, 50000); // Also gives 50,000 XP
            say('reward', '✨ [作弊] 天降横财！获得大量资源与经验');
            break;
        }
        // ── RESET (DEV ONLY) ──────────────────────────────────────────────────────
        case 'reset': {
            if (arg !== 'confirm') {
                say('err', '⚠️ 警告：此操作将清空所有进度和存档！');
                say('err', '确认重置请输入命令: reset confirm');
                break;
            }
            s = getInitialGameState();
            say('ok', '🔄 存档已重置，一切从头开始！');
            break;
        }
        // ── UNKNOWN ───────────────────────────────────────────────────────────
        case '':
            break;
        default:
            say('err', `未知命令: "${cmd}" — 输入 help 查看所有命令`);
    }
    return { state: s, logs };
}
