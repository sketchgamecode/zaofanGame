import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTotalAttributes, getTotalArmor } from '@core/gameState';
import { MathCore, CLASS_CONFIG } from '@core/mathCore';
import { XP_TABLE } from '@data/xpTable';
const ATTR_LABELS = [
    ['strength', '武力', '⚔️'],
    ['agility', '身法', '💨'],
    ['intelligence', '智谋', '📖'],
    ['constitution', '体质', '🛡️'],
    ['luck', '福缘', '🍀'],
];
export function CharacterScreen({ gameState, setGameState }) {
    const total = getTotalAttributes(gameState);
    const baseAttrs = gameState.attributes;
    const totalAttrs = total.total;
    const armor = getTotalArmor(gameState);
    const cls = CLASS_CONFIG[gameState.classId];
    const maxHP = MathCore.getMaxHP(totalAttrs.constitution, gameState.playerLevel, gameState.classId);
    const xpNeeded = XP_TABLE[gameState.playerLevel] ?? 9999;
    const xpPct = Math.min(100, (gameState.exp / xpNeeded) * 100);
    const res = gameState.resources;
    const upgrade = (attr) => {
        const cost = MathCore.getUpgradeCost(baseAttrs[attr]);
        if (res.copper < cost)
            return;
        setGameState(prev => ({
            ...prev,
            attributes: { ...prev.attributes, [attr]: prev.attributes[attr] + 1 },
            resources: { ...prev.resources, copper: prev.resources.copper - cost },
        }));
    };
    return (_jsxs("div", { className: "screen", children: [_jsxs("div", { className: "card", children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700, fontSize: 16 }, children: "\u65E0\u540D\u597D\u6C49" }), _jsxs("div", { style: { fontSize: 12, color: 'var(--muted)', marginTop: 2 }, children: ["Lv.", gameState.playerLevel, " \u00A0", _jsx("span", { className: `tag tag-${gameState.classId.slice(-1).toLowerCase()}`, children: cls.name })] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsxs("div", { style: { fontFamily: 'var(--mono)', color: 'var(--green)', fontSize: 13 }, children: ["HP ", maxHP] }), _jsxs("div", { style: { fontFamily: 'var(--mono)', color: 'var(--muted)', fontSize: 11 }, children: ["\u62A4\u7532 ", armor] })] })] }), _jsxs("div", { style: { marginTop: 10 }, children: [_jsxs("div", { className: "xp-text", children: [gameState.exp, " / ", xpNeeded, " XP"] }), _jsx("div", { className: "xp-bar-wrap", children: _jsx("div", { className: "xp-bar-fill", style: { width: `${xpPct}%` } }) })] })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-title", children: "\u8D44\u6E90" }), _jsxs("div", { className: "res-grid", children: [_jsxs("div", { className: "res-item", children: [_jsx("div", { className: "res-item-label", children: "\uD83E\uDE99 \u94DC\u94B1" }), _jsx("div", { className: "res-item-value", children: res.copper.toLocaleString() })] }), _jsxs("div", { className: "res-item", children: [_jsx("div", { className: "res-item-label", children: "\u2B50 \u58F0\u671B" }), _jsx("div", { className: "res-item-value", children: res.prestige.toLocaleString() })] }), _jsxs("div", { className: "res-item", children: [_jsx("div", { className: "res-item-label", children: "\uD83C\uDF5A \u5E72\u7CAE" }), _jsxs("div", { className: "res-item-value", children: [res.rations, "/100"] })] }), _jsxs("div", { className: "res-item", children: [_jsx("div", { className: "res-item-label", children: "\uD83D\uDC8E \u901A\u5B9D" }), _jsx("div", { className: "res-item-value", children: res.tokens })] })] })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-title", children: "\u5C5E\u6027\u5347\u7EA7" }), ATTR_LABELS.map(([key, label, icon]) => {
                        const base = baseAttrs[key];
                        const bonus = totalAttrs[key] - base;
                        const cost = MathCore.getUpgradeCost(base);
                        const canAfford = res.copper >= cost;
                        return (_jsxs("div", { className: "upgrade-row", children: [_jsxs("span", { children: [icon, " ", label] }), _jsxs("span", { className: "upgrade-val", children: [totalAttrs[key], bonus > 0 && _jsxs("span", { className: "stat-bonus", children: ["+", bonus] })] }), _jsxs("span", { className: "upgrade-cost", style: { color: canAfford ? 'var(--gold)' : 'var(--muted)' }, children: [cost, "\uD83E\uDE99"] }), _jsx("button", { className: "upgrade-btn", disabled: !canAfford, onClick: () => upgrade(key), children: "\uFF0B" })] }, key));
                    })] })] }));
}
