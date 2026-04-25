import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { getTotalAttributes, getTotalArmor } from '@core/gameState';
import { checkLevelUp } from '@core/mathCore';
import { simulateBattle } from '@core/battleCore';
import { DUNGEON_CHAPTERS } from '@data/dungeonTable';
function getToday() { return new Date().toISOString().slice(0, 10); }
export function DungeonScreen({ gameState, setGameState }) {
    const [lastResult, setLastResult] = useState(null);
    const today = getToday();
    const dailyAttempt = gameState.dungeonDailyAttempt ?? { date: '', used: 0 };
    const usedToday = dailyAttempt.date === today ? dailyAttempt.used : 0;
    const canChallenge = usedToday < 1;
    // Figure out which chapter/boss is current
    const chapterKey = (id) => id;
    const progress = gameState.dungeonProgress ?? {};
    // Find first incomplete chapter
    let currentChapter = DUNGEON_CHAPTERS[0];
    let currentBossIdx = 0;
    let allDone = false;
    for (const ch of DUNGEON_CHAPTERS) {
        const beaten = progress[ch.id] ?? 0;
        if (beaten < ch.bosses.length) {
            currentChapter = ch;
            currentBossIdx = beaten;
            break;
        }
        if (ch === DUNGEON_CHAPTERS[DUNGEON_CHAPTERS.length - 1])
            allDone = true;
    }
    const currentBoss = currentChapter.bosses[currentBossIdx];
    const challenge = () => {
        if (!canChallenge || !currentBoss)
            return;
        const pAttrs = getTotalAttributes(gameState).total;
        const pArmor = getTotalArmor(gameState);
        const pC = {
            name: '无名好汉', level: gameState.playerLevel, classId: gameState.classId,
            attributes: pAttrs, armor: pArmor,
            weaponDamage: gameState.equipped?.mainHand?.weaponDamage ?? { min: gameState.playerLevel * 2, max: gameState.playerLevel * 4 },
            hasShield: gameState.equipped?.offHand?.subType === 'shield',
        };
        const bossC = {
            name: currentBoss.name, level: currentBoss.level, classId: currentBoss.class,
            attributes: {
                strength: currentBoss.attributes.strength,
                agility: currentBoss.attributes.dexterity,
                intelligence: currentBoss.attributes.intelligence,
                constitution: currentBoss.attributes.constitution,
                luck: currentBoss.attributes.luck,
            },
            armor: currentBoss.armor,
            weaponDamage: { min: Math.floor(currentBoss.weaponDamage * 0.8), max: Math.floor(currentBoss.weaponDamage * 1.2) },
            hasShield: false,
        };
        const result = simulateBattle(pC, bossC);
        const newProgress = { ...progress };
        if (result.pWin) {
            newProgress[currentChapter.id] = (newProgress[currentChapter.id] ?? 0) + 1;
        }
        setLastResult({ win: result.pWin, bossName: currentBoss.name, xp: result.pWin ? currentBoss.rewardXp : 0, coin: result.pWin ? currentBoss.rewardCoins : 0 });
        setGameState(prev => {
            const rawExp = (prev.exp ?? 0) + (result.pWin ? currentBoss.rewardXp : 0);
            const { newLevel, newExp } = checkLevelUp(prev.playerLevel, rawExp);
            return {
                ...prev,
                playerLevel: newLevel, exp: newExp,
                dungeonProgress: newProgress,
                dungeonDailyAttempt: { date: today, used: usedToday + 1 },
                resources: { ...prev.resources, copper: prev.resources.copper + (result.pWin ? currentBoss.rewardCoins : 0) },
            };
        });
    };
    return (_jsxs("div", { className: "screen", children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "card-title", children: currentChapter.name }), _jsxs("div", { style: { fontSize: 12, color: 'var(--muted)', marginBottom: 10 }, children: ["\u89E3\u9501\u7B49\u7EA7 Lv.", currentChapter.unlockLevel, " \u00B7 \u4ECA\u65E5\u6B21\u6570 ", usedToday, "/1"] }), currentChapter.bosses.map((boss, idx) => {
                        const beaten = (progress[currentChapter.id] ?? 0) > idx;
                        const isCurrent = idx === currentBossIdx;
                        return (_jsxs("div", { className: "boss-row", children: [_jsx("div", { className: "boss-status", children: beaten ? '✅' : isCurrent ? '▶' : '🔒' }), _jsxs("div", { className: "boss-info", children: [_jsx("div", { className: "boss-name", style: { color: isCurrent ? 'var(--gold)' : beaten ? 'var(--muted)' : 'var(--text)' }, children: boss.name }), _jsxs("div", { className: "boss-attr", children: ["Lv.", boss.level, " \u00B7 HP\u2248", boss.attributes.constitution * boss.level * 5, " \u00B7 \u6B66\u529B", boss.attributes.strength, " \u8EAB\u6CD5", boss.attributes.dexterity] })] })] }, boss.id));
                    })] }), lastResult && (_jsxs("div", { className: `result-banner ${lastResult.win ? 'win' : 'loss'}`, children: [_jsx("div", { className: "result-title", style: { color: lastResult.win ? 'var(--green)' : 'var(--red)' }, children: lastResult.win ? '讨伐成功' : '落败而逃' }), _jsx("div", { className: "result-meta", children: lastResult.win ? `击败 ${lastResult.bossName} · +${lastResult.xp}XP · +${lastResult.coin}🪙` : `败于 ${lastResult.bossName}` })] })), !allDone && currentBoss && (_jsx("button", { className: "btn btn-primary", disabled: !canChallenge, onClick: challenge, children: canChallenge ? `⚔️ 挑战 ${currentBoss.name}` : '今日次数已用（明日再战）' })), allDone && _jsx("div", { className: "empty", children: "\uD83C\uDFC6 \u6240\u6709\u526F\u672C\u5DF2\u901A\u5173\uFF01" })] }));
}
