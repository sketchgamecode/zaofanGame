import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { useGameState } from './hooks/useGameState';
import { AuthScreen } from './screens/AuthScreen';
import { executeCommand } from './engine/commands';
import { getTotalAttributes } from '@core/gameState';
import { MathCore } from '@core/mathCore';
import { XP_TABLE } from '@data/xpTable';
import './styles.css';
// ── Context-aware quick buttons ───────────────────────────────────────────────
function getQuickButtons(gs) {
    if (!gs)
        return [];
    const m = gs.activeMission;
    const mDone = m && m.endTime <= Date.now();
    const mActive = m && !mDone;
    const row1 = m
        ? (mDone
            ? [{ label: '✅ 领取奖励', cmd: 'collect', color: '#27a869' }]
            : [{ label: `⏭ 跳过💎`, cmd: 'skip', color: '#c9a227' }, { label: `🔄 任务中...`, cmd: 'status', color: '#444' }])
        : [
            { label: '30m任务', cmd: 'mission a' },
            { label: '90m任务', cmd: 'mission b' },
            { label: '3h任务', cmd: 'mission c' },
        ];
    const da = gs.dungeonDailyAttempt ?? { date: '', used: 0 };
    const bossUsed = da.date === new Date().toISOString().slice(0, 10) ? da.used : 0;
    const row2 = [
        { label: '⚔️ 出战', cmd: 'fight', color: '#c0392b' },
        { label: bossUsed >= 1 ? '🗺 副本💎' : '🗺 副本', cmd: 'boss' },
        { label: '🍚+50💎', cmd: 'rations' },
        { label: '✨ 作弊', cmd: 'cheat', color: '#9b59b6' },
    ];
    const row3 = [
        { label: '武力+', cmd: 'up str' },
        { label: '身法+', cmd: 'up agi' },
        { label: '体质+', cmd: 'up con' },
        { label: '智谋+', cmd: 'up int' },
    ];
    return [row1, row2, row3];
}
// ── Log Line Component ────────────────────────────────────────────────────────
function LogItem({ line }) {
    const colors = {
        cmd: '#666',
        ok: '#27a869',
        err: '#e74c3c',
        info: '#8899aa',
        reward: '#c9a227',
        battle: '#3498db',
    };
    return (_jsxs("div", { style: { fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.7, color: colors[line.type] ?? '#ccc', paddingLeft: line.type === 'cmd' ? 0 : 12 }, children: [line.type === 'cmd' ? _jsx("span", { style: { color: '#555' }, children: '> ' }) : null, line.text] }));
}
// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
    const [session, setSession] = useState(undefined);
    const { gameState, setGameState, loading, error } = useGameState();
    const [logs, setLogs] = useState([{ id: 'welcome', type: 'info', text: '大宋造反模拟器 · 极简终端 | 输入 help 查看命令' }]);
    const [input, setInput] = useState('');
    const [now, setNow] = useState(Date.now());
    const logEndRef = useRef(null);
    const inputRef = useRef(null);
    // Tick for mission countdown
    useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(iv); }, []);
    // Auth
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
        return () => subscription.unsubscribe();
    }, []);
    // Auto-scroll log
    useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);
    // Auto-print status on first load
    useEffect(() => {
        if (gameState) {
            const r = executeCommand('status', gameState);
            setLogs(prev => [...prev, ...r.logs]);
        }
    }, [!!gameState]);
    const runCommand = useCallback((cmd) => {
        if (!gameState || !cmd.trim())
            return;
        const cmdLog = { id: Math.random().toString(36).slice(2), type: 'cmd', text: cmd };
        const result = executeCommand(cmd, gameState);
        setGameState(result.state);
        setLogs(prev => [...prev.slice(-200), cmdLog, ...result.logs]); // 最多保留200条
        setInput('');
    }, [gameState, setGameState]);
    const handleSubmit = (e) => { e.preventDefault(); runCommand(input); };
    // ── Guards ──────────────────────────────────────────────────────────────────
    if (session === undefined || loading)
        return (_jsxs("div", { className: "loading-wrap", children: [_jsx("div", { className: "spinner" }), _jsx("span", { style: { color: 'var(--muted)', fontSize: 13 }, children: "\u52A0\u8F7D\u4E2D\u2026" })] }));
    if (!session)
        return _jsx(AuthScreen, { onSuccess: () => { } });
    if (error)
        return _jsx("div", { className: "loading-wrap", children: _jsx("span", { style: { color: 'var(--red)' }, children: error }) });
    if (!gameState)
        return _jsx("div", { className: "loading-wrap", children: _jsx("div", { className: "spinner" }) });
    // ── Status bar data ─────────────────────────────────────────────────────────
    const attrs = getTotalAttributes(gameState).total;
    const hp = MathCore.getMaxHP(attrs.constitution, gameState.playerLevel, gameState.classId);
    const xpNeed = XP_TABLE[gameState.playerLevel] ?? 9999;
    const xpPct = Math.min(100, ((gameState.exp ?? 0) / xpNeed) * 100);
    const r = gameState.resources;
    const m = gameState.activeMission;
    const mRemain = m ? Math.max(0, m.endTime - now) : 0;
    const mDone = m && mRemain <= 0;
    const quickRows = getQuickButtons(gameState);
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "header", style: { flexDirection: 'column', alignItems: 'stretch', height: 'auto', padding: '8px 12px 4px' }, children: [_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsxs("span", { style: { color: 'var(--primary)', fontWeight: 700, fontSize: 13 }, children: ["Lv.", gameState.playerLevel] }), _jsxs("span", { style: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }, children: ["HP", _jsx("span", { style: { color: 'var(--green)' }, children: hp })] }), _jsxs("span", { style: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }, children: ["\uD83E\uDE99", _jsx("span", { style: { color: 'var(--gold)' }, children: r.copper.toLocaleString() })] }), _jsxs("span", { style: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }, children: ["\u2B50", _jsx("span", { style: { color: 'var(--gold)' }, children: r.prestige })] }), _jsxs("span", { style: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }, children: ["\uD83C\uDF5A", _jsx("span", { style: { color: r.rations < 20 ? 'var(--red)' : 'var(--text)' }, children: r.rations })] }), r.tokens > 0 && _jsxs("span", { style: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }, children: ["\uD83D\uDC8E", _jsx("span", { style: { color: '#9b59b6' }, children: r.tokens })] }), _jsx("span", { style: { flex: 1 } }), _jsx("button", { style: { fontSize: 11, color: 'var(--muted)' }, onClick: () => supabase.auth.signOut(), children: "\u9000\u51FA" })] }), _jsx("div", { style: { marginTop: 4 }, children: _jsx("div", { style: { background: '#1a1a20', borderRadius: 3, height: 4, overflow: 'hidden' }, children: _jsx("div", { style: { height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg,var(--primary),var(--gold))', borderRadius: 3 } }) }) }), m && (_jsx("div", { style: { marginTop: 4, fontFamily: 'var(--mono)', fontSize: 11, color: mDone ? 'var(--green)' : 'var(--gold)' }, children: mDone ? `✅ ${m.name} 已完成！输入 c 领取` : `📜 ${m.name} — ${Math.ceil(mRemain / 60000)}分钟后完成` }))] }), _jsxs("div", { className: "screen", style: { background: '#080810', padding: '12px 14px' }, children: [logs.map(line => _jsx(LogItem, { line: line }, line.id)), _jsx("div", { ref: logEndRef })] }), _jsx("div", { style: { background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '6px 8px', flexShrink: 0 }, children: quickRows.map((row, ri) => (_jsx("div", { style: { display: 'flex', gap: 6, marginBottom: ri < quickRows.length - 1 ? 6 : 0, flexWrap: 'wrap' }, children: row.map(btn => (_jsx("button", { onClick: () => runCommand(btn.cmd), style: { fontSize: 12, padding: '6px 10px', borderRadius: 6, background: btn.color ? btn.color + '22' : 'var(--border)', color: btn.color ?? 'var(--text)', border: `1px solid ${btn.color ?? 'var(--border)'}`, minHeight: 32, fontFamily: 'var(--font)', cursor: 'pointer' }, children: btn.label }, btn.cmd))) }, ri))) }), _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', gap: 8, padding: '8px 10px', background: '#0d0d12', borderTop: '1px solid var(--border)', flexShrink: 0 }, children: [_jsx("span", { style: { color: 'var(--primary)', fontFamily: 'var(--mono)', fontSize: 14, lineHeight: '36px' }, children: '>' }), _jsx("input", { ref: inputRef, value: input, onChange: e => setInput(e.target.value), placeholder: "\u8F93\u5165\u547D\u4EE4 (help \u67E5\u770B\u5168\u90E8)", style: { flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, outline: 'none', minHeight: 36 }, autoCapitalize: "none", autoCorrect: "off", spellCheck: false }), _jsx("button", { type: "submit", style: { fontSize: 12, padding: '0 12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, minHeight: 36, cursor: 'pointer' }, children: "\u6267\u884C" })] })] }));
}
