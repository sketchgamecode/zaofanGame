import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState } from '@core/gameState';
import { getInitialGameState } from '@core/gameState';
import { supabase, SERVER_URL } from '../lib/supabase';

/**
 * 监听 Supabase Auth 确认登录后再加载存档，解决手机端 session 恢复延迟问题
 */
export function useGameState() {
  const [gameState, setGameStateRaw] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const loadedRef = useRef(false);

  const setGameState = useCallback((updater: GameState | ((prev: GameState) => GameState)) => {
    setGameStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev!) : updater;
      stateRef.current = next;
      return next;
    });
  }, []);

  const syncNow = useCallback(async () => {
    const state = stateRef.current;
    if (!state) return;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch(`${SERVER_URL}/api/save/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ gameState: state }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const loadSave = async (token: string) => {
      if (loadedRef.current) return;
      loadedRef.current = true;
      setLoading(true);
      try {
        const res = await fetch(`${SERVER_URL}/api/save`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { save, isNewPlayer } = await res.json();
        const state = isNewPlayer || !save ? getInitialGameState() : save as GameState;
        stateRef.current = state;
        setGameStateRaw(state);
        setError(null);
      } catch (err: any) {
        setError(`连接失败: ${err.message} (${SERVER_URL})`);
      }
      setLoading(false);
    };

    // 先检查当前已有 session（页面刷新场景）
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) {
        loadSave(data.session.access_token);
      } else {
        setLoading(false);
      }
    });

    // 监听 SIGNED_IN（首次登录 / 手机端 session 恢复延迟场景）
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        loadedRef.current = false; // 允许重新加载
        loadSave(session.access_token);
      }
      if (event === 'SIGNED_OUT') {
        loadedRef.current = false;
        setGameStateRaw(null);
        stateRef.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 30s 自动同步 + 页面关闭同步
  useEffect(() => {
    const iv = setInterval(syncNow, 30_000);
    const onHide = () => { if (document.visibilityState === 'hidden') syncNow(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', syncNow);
    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', syncNow);
    };
  }, [syncNow]);

  return { gameState, setGameState, syncNow, loading, error };
}
