import { useState, useEffect, useRef, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { useGameState } from './hooks/useGameState';
import { AuthScreen } from './screens/AuthScreen';
import { executeCommand, type LogLine } from './engine/commands';
import { getTotalAttributes } from '@core/gameState';
import { MathCore } from '@core/mathCore';
import { XP_TABLE } from '@data/xpTable';
import './styles.css';

// ── Context-aware quick buttons ───────────────────────────────────────────────
function getQuickButtons(gs: Parameters<typeof getTotalAttributes>[0] | null): { label: string; cmd: string; color?: string }[][] {
  if (!gs) return [];
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
        { label: '3h任务',  cmd: 'mission c' },
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
function LogItem({ line }: { line: LogLine }) {
  const colors: Record<string, string> = {
    cmd: '#666',
    ok: '#27a869',
    err: '#e74c3c',
    info: '#8899aa',
    reward: '#c9a227',
    battle: '#3498db',
  };
  return (
    <div style={{ fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.7, color: colors[line.type] ?? '#ccc', paddingLeft: line.type === 'cmd' ? 0 : 12 }}>
      {line.type === 'cmd' ? <span style={{ color: '#555' }}>{'> '}</span> : null}{line.text}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const { gameState, setGameState, loading, error } = useGameState();
  const [logs, setLogs] = useState<LogLine[]>([{ id: 'welcome', type: 'info', text: '大宋造反模拟器 · 极简终端 | 输入 help 查看命令' }]);
  const [input, setInput] = useState('');
  const [now, setNow] = useState(Date.now());
  const logEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const runCommand = useCallback((cmd: string) => {
    if (!gameState || !cmd.trim()) return;
    const cmdLog: LogLine = { id: Math.random().toString(36).slice(2), type: 'cmd', text: cmd };
    const result = executeCommand(cmd, gameState);
    setGameState(result.state);
    setLogs(prev => [...prev.slice(-200), cmdLog, ...result.logs]); // 最多保留200条
    setInput('');
  }, [gameState, setGameState]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); runCommand(input); };

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (session === undefined || loading) return (
    <div className="loading-wrap"><div className="spinner" /><span style={{ color: 'var(--muted)', fontSize: 13 }}>加载中…</span></div>
  );
  if (!session) return <AuthScreen onSuccess={() => {}} />;
  if (error) return <div className="loading-wrap"><span style={{ color: 'var(--red)' }}>{error}</span></div>;
  if (!gameState) return <div className="loading-wrap"><div className="spinner" /></div>;

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

  return (
    <div className="app">
      {/* ── Status Bar ─────────────────────────────────────────────────────── */}
      <header className="header" style={{ flexDirection: 'column', alignItems: 'stretch', height: 'auto', padding: '8px 12px 4px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>Lv.{gameState.playerLevel}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>HP<span style={{ color: 'var(--green)' }}>{hp}</span></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>🪙<span style={{ color: 'var(--gold)' }}>{r.copper.toLocaleString()}</span></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>⭐<span style={{ color: 'var(--gold)' }}>{r.prestige}</span></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>🍚<span style={{ color: r.rations < 20 ? 'var(--red)' : 'var(--text)' }}>{r.rations}</span></span>
          {r.tokens > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>💎<span style={{ color: '#9b59b6' }}>{r.tokens}</span></span>}
          <span style={{ flex: 1 }} />
          <button style={{ fontSize: 11, color: 'var(--muted)' }} onClick={() => supabase.auth.signOut()}>退出</button>
        </div>
        {/* XP bar */}
        <div style={{ marginTop: 4 }}>
          <div style={{ background: '#1a1a20', borderRadius: 3, height: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg,var(--primary),var(--gold))', borderRadius: 3 }} />
          </div>
        </div>
        {/* Mission status if active */}
        {m && (
          <div style={{ marginTop: 4, fontFamily: 'var(--mono)', fontSize: 11, color: mDone ? 'var(--green)' : 'var(--gold)' }}>
            {mDone ? `✅ ${m.name} 已完成！输入 c 领取` : `📜 ${m.name} — ${Math.ceil(mRemain / 60000)}分钟后完成`}
          </div>
        )}
      </header>

      {/* ── Log Area ───────────────────────────────────────────────────────── */}
      <div className="screen" style={{ background: '#080810', padding: '12px 14px' }}>
        {logs.map(line => <LogItem key={line.id} line={line} />)}
        <div ref={logEndRef} />
      </div>

      {/* ── Quick Buttons ──────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '6px 8px', flexShrink: 0 }}>
        {quickRows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 6, marginBottom: ri < quickRows.length - 1 ? 6 : 0, flexWrap: 'wrap' }}>
            {row.map(btn => (
              <button key={btn.cmd} onClick={() => runCommand(btn.cmd)}
                style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, background: btn.color ? btn.color + '22' : 'var(--border)', color: btn.color ?? 'var(--text)', border: `1px solid ${btn.color ?? 'var(--border)'}`, minHeight: 32, fontFamily: 'var(--font)', cursor: 'pointer' }}>
                {btn.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* ── Command Input ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, padding: '8px 10px', background: '#0d0d12', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ color: 'var(--primary)', fontFamily: 'var(--mono)', fontSize: 14, lineHeight: '36px' }}>{'>'}</span>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          placeholder="输入命令 (help 查看全部)"
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, outline: 'none', minHeight: 36 }}
          autoCapitalize="none" autoCorrect="off" spellCheck={false}
        />
        <button type="submit" style={{ fontSize: 12, padding: '0 12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, minHeight: 36, cursor: 'pointer' }}>执行</button>
      </form>
    </div>
  );
}
