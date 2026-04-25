import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { checkLevelUp } from '@core/mathCore';
import { XP_TABLE } from '@data/xpTable';
const MISSION_TEMPLATES = [
    { type: 'A', name: '刺探情报', durationMin: 30, foodCost: 5, expMult: 0.10, coinMult: 0.20 },
    { type: 'B', name: '劫持粮道', durationMin: 90, foodCost: 15, expMult: 0.28, coinMult: 0.55 },
    { type: 'C', name: '攻打官兵', durationMin: 180, foodCost: 30, expMult: 0.50, coinMult: 1.0 },
];
function fmt(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}
export function MissionScreen({ gameState, setGameState }) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);
    const active = gameState.activeMission;
    const remaining = active ? active.endTime - now : 0;
    const isDone = active && remaining <= 0;
    const xpNeeded = XP_TABLE[gameState.playerLevel] ?? 400;
    const startMission = (tpl) => {
        if (gameState.resources.rations < tpl.foodCost)
            return;
        const endTime = Date.now() + tpl.durationMin * 60 * 1000;
        const expReward = Math.floor(xpNeeded * tpl.expMult * (0.9 + Math.random() * 0.2));
        const coinReward = Math.floor(gameState.playerLevel * 50 * tpl.coinMult * (0.9 + Math.random() * 0.2));
        setGameState(prev => ({
            ...prev,
            resources: { ...prev.resources, rations: prev.resources.rations - tpl.foodCost },
            activeMission: { id: `m_${Date.now()}`, type: tpl.type, name: tpl.name, durationSec: tpl.durationMin * 60, foodCost: tpl.foodCost, expReward, coinReward, dropRate: 0.1, endTime },
        }));
    };
    const collectReward = () => {
        if (!active)
            return;
        setGameState(prev => {
            const rawExp = (prev.exp ?? 0) + active.expReward;
            const { newLevel, newExp } = checkLevelUp(prev.playerLevel, rawExp);
            return {
                ...prev,
                playerLevel: newLevel,
                exp: newExp,
                resources: { ...prev.resources, copper: prev.resources.copper + active.coinReward },
                activeMission: null,
            };
        });
    };
    return (_jsxs("div", { className: "screen", children: [active && (_jsxs("div", { className: "mission-card active-mission", children: [_jsx("div", { className: "mission-type", children: "\u8FDB\u884C\u4E2D" }), _jsx("div", { className: "mission-name", children: active.name }), _jsxs("div", { className: "mission-meta", children: [_jsxs("span", { children: ["\u5956\u52B1\u7EA6 ", active.expReward, " XP"] }), _jsxs("span", { children: [active.coinReward, " \u94DC\u94B1"] })] }), isDone ? (_jsx("button", { className: "btn btn-gold", style: { width: '100%' }, onClick: collectReward, children: "\u2705 \u9886\u53D6\u5956\u52B1" })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "progress-bar-wrap", children: _jsx("div", { className: "progress-bar-fill", style: { width: `${Math.max(0, 100 - (remaining / (active.durationSec * 1000)) * 100)}%` } }) }), _jsx("div", { style: { textAlign: 'center', fontFamily: 'var(--mono)', color: 'var(--gold)', fontSize: 20, marginBottom: 8 }, children: fmt(remaining) })] }))] })), !active && (_jsx(_Fragment, { children: _jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-title", children: ["\u5E72\u7CAE ", gameState.resources.rations, "/100 \u00B7 \u9009\u62E9\u4EFB\u52A1"] }), MISSION_TEMPLATES.map(tpl => {
                            const canStart = gameState.resources.rations >= tpl.foodCost;
                            const xpEst = Math.floor(xpNeeded * tpl.expMult);
                            const coinEst = Math.floor(gameState.playerLevel * 50 * tpl.coinMult);
                            return (_jsxs("div", { className: "mission-card", style: { marginBottom: 8 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }, children: [_jsxs("div", { children: [_jsxs("span", { className: "mission-type", children: ["\u7C7B\u578B ", tpl.type] }), _jsx("div", { className: "mission-name", children: tpl.name })] }), _jsx("button", { className: "btn btn-primary btn-sm", disabled: !canStart, onClick: () => startMission(tpl), style: { width: 64 }, children: "\u51FA\u53D1" })] }), _jsxs("div", { className: "mission-meta", children: [_jsxs("span", { children: ["\u23F1 ", tpl.durationMin, "\u5206\u949F"] }), _jsxs("span", { children: ["\uD83C\uDF5A -", tpl.foodCost] }), _jsxs("span", { children: ["\u2248", xpEst, "XP"] }), _jsxs("span", { children: ["\u2248", coinEst, "\uD83E\uDE99"] })] })] }, tpl.type));
                        })] }) }))] }));
}
