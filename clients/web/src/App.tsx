import { useEffect, useState } from 'react';
import { type Session } from '@supabase/supabase-js';
import { Navbar } from './components/Navbar';
import { CharacterPanel } from './components/CharacterPanel';
import { Tavern } from './components/Tavern';
import { Arena } from './components/Arena';
import { Dungeon } from './components/Dungeon';
import { Guild } from './components/Guild';
import { BlackMarket } from './components/BlackMarket';
import { AuthPage } from './components/AuthPage';
import { type GameState, getInitialGameState, saveGameState } from './core/gameState';
import { supabase, getAuthToken, SERVER_URL } from './lib/supabase';
import { useSaveSync } from './hooks/useSaveSync';

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = still checking
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState('character');
  const [loadingMessage, setLoadingMessage] = useState('验证身份中...');

  // ── 监听 Supabase Auth 状态 ─────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── 登录后加载云存档 ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;

    const loadCloudSave = async () => {
      setLoadingMessage('加载存档中...');
      try {
        const token = await getAuthToken();
        if (!token) return;

        const res = await fetch(`${SERVER_URL}/api/save`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Server error');
        const { save, isNewPlayer } = await res.json();

        if (isNewPlayer || !save) {
          // 新玩家：初始化存档并立即同步到云端
          const initial = getInitialGameState();
          setGameState(initial);
          // 立即触发一次云端存档（useSaveSync 会处理）
          saveGameState(initial); // 同时保留 localStorage 作缓存
        } else {
          setGameState(save as GameState);
          saveGameState(save as GameState);
        }
      } catch (err: any) {
        // 服务端不可达时，显示错误（不降级到本地存档，符合设计决策）
        setLoadingMessage(`⚠️ 服务器连接失败: ${err.message} (${SERVER_URL})`);
      }
    };

    loadCloudSave();
  }, [session?.user?.id]);

  // ── 干粮自动恢复（每 60s 检查） ─────────────────────────────────────────────
  useEffect(() => {
    if (!gameState) return;
    const interval = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev;
        const elapsed = Date.now() - (prev.lastRationsRefill ?? Date.now());
        const toRestore = Math.floor(elapsed / 600_000);
        if (toRestore <= 0 || prev.resources.rations >= 100) return prev;
        const restored = Math.min(toRestore, 100 - prev.resources.rations);
        return {
          ...prev,
          lastRationsRefill: prev.lastRationsRefill + toRestore * 600_000,
          resources: { ...prev.resources, rations: prev.resources.rations + restored },
        };
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [!!gameState]);

  // ── 云存档同步 ───────────────────────────────────────────────────────────────
  useSaveSync(gameState);

  const handleCheat = () => {
    if (!gameState) return;
    setGameState({
      ...gameState,
      resources: {
        ...gameState.resources,
        copper: gameState.resources.copper + 10000,
        prestige: gameState.resources.prestige + 1000,
        rations: 100,
        tokens: gameState.resources.tokens + 100,
      }
    });
  };

  const handleWipeSave = async () => {
    if (confirm('确定要彻底清空存档吗？这将同时清除云端存档！')) {
      const initial = getInitialGameState();
      setGameState(initial);
      saveGameState(initial);
    }
  };

  const handleLogout = async () => {
    if (confirm('确定要退出登录吗？')) {
      await supabase.auth.signOut();
      setGameState(null);
    }
  };

  // ── 渲染逻辑 ─────────────────────────────────────────────────────────────────

  // 1. Auth 状态检查中（undefined = 还不知道有没有登录）
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-darkBg flex items-center justify-center flex-col gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-primary text-sm font-medium tracking-widest">验证身份中...</p>
      </div>
    );
  }

  // 2. 未登录 → 显示登录页
  if (!session) {
    return <AuthPage onAuthSuccess={() => {/* session 变化会自动触发 */}} />;
  }

  // 3. 已登录，存档加载中
  if (!gameState) {
    return (
      <div className="min-h-screen bg-darkBg flex items-center justify-center flex-col gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-primary text-sm font-medium tracking-widest">{loadingMessage}</p>
      </div>
    );
  }

  // 4. 正常游戏界面
  return (
    <div className="flex h-screen bg-darkBg text-textMain overflow-hidden font-sans selection:bg-primary/30">
      <Navbar
        active={activeTab}
        setActive={setActiveTab}
        onCheat={handleCheat}
        onWipeSave={handleWipeSave}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto w-full h-full custom-scrollbar">
        {activeTab === 'character' && <CharacterPanel gameState={gameState} setGameState={setGameState} />}
        {activeTab === 'hideout' && <Tavern gameState={gameState} setGameState={setGameState} />}
        {activeTab === 'arena' && <Arena gameState={gameState} setGameState={setGameState} />}
        {activeTab === 'siege' && <Dungeon gameState={gameState} setGameState={setGameState} />}
        {activeTab === 'guild' && <Guild />}
        {activeTab === 'market' && <BlackMarket gameState={gameState} setGameState={setGameState} />}
      </main>
    </div>
  );
}

export default App;
