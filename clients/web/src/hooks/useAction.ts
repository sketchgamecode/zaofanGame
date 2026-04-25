import { useCallback } from 'react';
import type { GameState } from '../core/gameState';
import { getAuthToken, SERVER_URL } from '../lib/supabase';

export function useAction(setGameState: React.Dispatch<React.SetStateAction<GameState | null>>) {
  const dispatchAction = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        alert('未登录或登录已过期');
        return false;
      }

      const res = await fetch(`${SERVER_URL}/api/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action, payload }),
      });

      if (!res.ok) {
        throw new Error('网络请求失败');
      }

      const result = await res.json();
      if (result.success && result.gameState) {
        setGameState(result.gameState);
        return result;
      } else {
        alert(result.error || '动作执行失败');
        return null;
      }
    } catch (err: any) {
      console.error('Action Error:', err);
      alert('动作执行异常：' + err.message);
      return null;
    }
  }, [setGameState]);

  return { dispatchAction };
}
