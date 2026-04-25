import { useEffect, useRef, useCallback } from 'react';
import type { GameState } from '../core/gameState';
import { getAuthToken, SERVER_URL } from '../lib/supabase';

const SYNC_INTERVAL_MS = 30_000; // 每 30 秒自动同步一次

/**
 * 云存档同步 Hook
 * - 每 30 秒自动同步 GameState 到服务端
 * - 页面关闭/隐藏时立即同步
 * - 提供手动触发 syncNow() 函数供关键操作后调用
 */
export function useSaveSync(gameState: GameState | null) {
  const gameStateRef = useRef<GameState | null>(gameState);

  // 保持 ref 最新，避免闭包问题
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const syncToServer = useCallback(async () => {
    const state = gameStateRef.current;
    if (!state) return;

    const token = await getAuthToken();
    if (!token) return; // 未登录，跳过

    try {
      await fetch(`${SERVER_URL}/api/save/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ gameState: state, saveVersion: 1 }),
      });
    } catch {
      // 网络断开时静默失败，下次心跳会重试
    }
  }, []);

  // 定时同步
  useEffect(() => {
    if (!gameState) return;
    const interval = setInterval(syncToServer, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [!!gameState, syncToServer]);

  // 页面关闭/切到后台时立即同步
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncToServer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', syncToServer);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', syncToServer);
    };
  }, [syncToServer]);

  return { syncNow: syncToServer };
}
