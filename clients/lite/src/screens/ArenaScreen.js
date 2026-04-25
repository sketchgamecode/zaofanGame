import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { getTotalAttributes, getTotalArmor } from '@core/gameState';
import { MathCore, checkLevelUp } from '@core/mathCore';
import { simulateBattle } from '@core/battleCore';
import { XP_TABLE } from '@data/xpTable';
function genNPC(playerLevel, prestige) {
    const classIds = ['CLASS_A', 'CLASS_B', 'CLASS_C', 'CLASS_D'];
    const classId = classIds[Math.floor(Math.random() * 4)];
    const lv = Math.max(1, playerLevel + Math.floor((Math.random() - 0.5) * 4));
    const b = lv * 8;
    const rnd = () => Math.floor(b * (0.8 + Math.random() * 0.4));
    const names = ['落魄游侠', '失意剑客', '草莽英雄', '野路子', '独行大盗', '行走的刀'];
    return {
        name: names[Math.floor(Math.random() * names.length)],
        level: lv, classId,
        attributes: { strength: rnd(), intelligence: rnd(), agility: rnd(), constitution: rnd(), luck: rnd() },
        armor: Math.floor(b * 0.5),
        weaponDamage: { min: Math.floor(b * 0.6), max: Math.floor(b * 1.2) },
        hasShield: classId === 'CLASS_A',
        prestige: Math.max(0, prestige + Math.floor((Math.random() - 0.5) * 600)),
        avatar: ['🥷', '👺', '👹', '💀', '🧔', '👳'][Math.floor(Math.random() * 6)],
    };
}
function getToday() { return new Date().toISOString().slice(0, 10); }
export function ArenaScreen({ gameState, setGameState }) {
    const [opponents, setOpponents] = useState(() => Array.from({ length: 3 }, () => genNPC(gameState.playerLevel, gameState.resources.prestige)));
    const [lastResult, setLastResult] = useState(null);
    const today = getToday();
    const dailyXP = gameState.arenaDailyXP || { date: '', wins: 0 };
    const winsToday = dailyXP.date === today ? dailyXP.wins : 0;
    const xpLeft = Math.max(0, 10 - winsToday);
    const cdEnd = gameState.arenaCooldownEndTime ?? 0;
    const inCD = cdEnd > Date.now();
    const cdSecs = Math.max(0, Math.ceil((cdEnd - Date.now()) / 1000));
    const pAttrs = getTotalAttributes(gameState).total;
    const pArmor = getTotalArmor(gameState);
    const pC = {
        name: '无名好汉', level: gameState.playerLevel, classId: gameState.classId,
        attributes: pAttrs, armor: pArmor,
        weaponDamage: gameState.equipped?.mainHand?.weaponDamage ?? { min: gameState.playerLevel * 2, max: gameState.playerLevel * 4 },
        hasShield: gameState.equipped?.offHand?.subType === 'shield',
    };
    const fight = (opp) => {
        if (inCD)
            return;
        const result = simulateBattle(pC, opp);
        const newCD = Date.now() + 10 * 60 * 1000;
        let xpGain = 0, coinGain = 0, prestigeDiff = 0;
        if (result.pWin) {
            if (xpLeft > 0)
                xpGain = Math.floor((XP_TABLE[gameState.playerLevel] ?? 400) * 0.05);
            prestigeDiff = Math.max(0, Math.floor(10 + (opp.prestige - gameState.resources.prestige) * 0.1));
            coinGain = Math.floor(opp.level * 20 * (1 + Math.random() * 0.2));
        }
        else {
            prestigeDiff = -Math.max(5, Math.floor(gameState.resources.prestige * 0.02));
        }
        setLastResult({ win: result.pWin, xp: xpGain, coin: coinGain, prestige: prestigeDiff });
        setGameState(prev => {
            const newWins = (prev.arenaDailyXP?.date === today ? (prev.arenaDailyXP?.wins ?? 0) : 0) + (result.pWin ? 1 : 0);
            const rawExp = (prev.exp ?? 0) + xpGain;
            const { newLevel, newExp } = checkLevelUp(prev.playerLevel, rawExp);
            return {
                ...prev, playerLevel: newLevel, exp: newExp,
                arenaWins: (prev.arenaWins ?? 0) + (result.pWin ? 1 : 0),
                arenaCooldownEndTime: newCD,
                arenaDailyXP: { date: today, wins: newWins },
                resources: { ...prev.resources, copper: prev.resources.copper + coinGain, prestige: Math.max(0, prev.resources.prestige + prestigeDiff) },
            };
        });
        setOpponents(Array.from({ length: 3 }, () => genNPC(gameState.playerLevel, gameState.resources.prestige)));
    };
    return (_jsxs("div", { className: "screen", children: [_jsxs("div", { className: "card", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("span", { style: { fontSize: 12, color: 'var(--muted)' }, children: ["\u6BCF\u65E5XP\u6218 ", _jsxs("strong", { style: { color: 'var(--gold)' }, children: [winsToday, "/10"] })] }), inCD
                        ? _jsxs("span", { style: { fontFamily: 'var(--mono)', color: 'var(--red)', fontSize: 13 }, children: ["\u51B7\u5374 ", Math.floor(cdSecs / 60), ":", (cdSecs % 60).toString().padStart(2, '0')] })
                        : _jsx("span", { style: { color: 'var(--green)', fontSize: 12 }, children: "\u2705 \u53EF\u51FA\u6218" })] }), lastResult && (_jsxs("div", { className: `result-banner ${lastResult.win ? 'win' : 'loss'}`, children: [_jsx("div", { className: "result-title", style: { color: lastResult.win ? 'var(--green)' : 'var(--red)' }, children: lastResult.win ? '胜利' : '失败' }), _jsx("div", { className: "result-meta", children: lastResult.win ? `+${lastResult.xp} XP · +${lastResult.coin}🪙 · 声望 +${lastResult.prestige}` : `声望 ${lastResult.prestige}` })] })), opponents.map((opp, i) => {
                const oppHP = MathCore.getMaxHP(opp.attributes.constitution, opp.level, opp.classId);
                const pHP = MathCore.getMaxHP(pAttrs.constitution, gameState.playerLevel, gameState.classId);
                const pd = opp.prestige - gameState.resources.prestige;
                return (_jsxs("div", { className: "opponent-card", children: [_jsxs("div", { className: "opp-header", children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 18 }, children: opp.avatar }), _jsx("div", { className: "opp-name", children: opp.name }), _jsxs("div", { className: "opp-level", children: ["Lv.", opp.level, " \u00B7 \u58F0\u671B ", opp.prestige, " ", _jsxs("span", { className: pd >= 0 ? 'diff-pos' : 'diff-neg', children: [pd >= 0 ? '+' : '', pd] })] })] }), _jsx("button", { className: "btn btn-primary btn-sm", disabled: inCD, onClick: () => fight(opp), children: "\u6311\u6218" })] }), _jsxs("div", { className: "mini-stats", children: [_jsxs("span", { children: ["HP ", _jsx("span", { children: oppHP }), _jsxs("span", { className: oppHP >= pHP ? 'diff-neg' : 'diff-pos', style: { marginLeft: 4 }, children: [oppHP - pHP > 0 ? '+' : '', oppHP - pHP] })] }), _jsxs("span", { children: ["\u6B66\u529B ", _jsx("span", { children: opp.attributes.strength })] }), _jsxs("span", { children: ["\u8EAB\u6CD5 ", _jsx("span", { children: opp.attributes.agility })] })] })] }, i));
            }), _jsx("button", { className: "btn btn-ghost", style: { width: '100%' }, onClick: () => setOpponents(Array.from({ length: 3 }, () => genNPC(gameState.playerLevel, gameState.resources.prestige))), children: "\uD83D\uDD04 \u6362\u4E00\u6279\u5BF9\u624B" })] }));
}
