import { ManualApiError } from '../api/gameApi';

const ERROR_MESSAGES: Record<string, string> = {
  ARENA_COOLDOWN_ACTIVE: '校场冷却尚未结束，请稍后再战或消耗资源跳过。',
  ARENA_TARGET_NOT_FOUND: '对手名册已刷新，请重新选择挑战目标。',
  ARENA_SELF_TARGET: '不能挑战自己。',
  ARENA_DISABLED: '校场当前未开放。',
  INSUFFICIENT_PREMIUM_RESOURCE: '沙漏与令牌均不足，无法立即跳过。',
  BATTLE_REPLAY_NOT_FOUND: '该战报已不存在或已过期。',
  BATTLE_REPLAY_READ_FAILED: '战报读取失败，请稍后重试。',
  BATTLE_REPLAY_WRITE_FAILED: '战报保存失败，请稍后重试。',
  MISSION_REPLAY_NOT_AVAILABLE: '当前没有可保存的客栈回放。',
  ACTION_DISABLED: '当前目标尚未开放。',
};

export function toActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ManualApiError) {
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
