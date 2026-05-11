import { getAuthToken, SERVER_URL } from '../lib/supabase';
import type { ActionResponse, SaveResponse } from '../types/game';

export class ManualApiError extends Error {
  readonly code?: string;
  readonly status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = 'ManualApiError';
    this.code = options?.code;
    this.status = options?.status;
  }
}

async function buildAuthHeaders() {
  const token = await getAuthToken();
  if (!token) {
    throw new ManualApiError('登录状态已失效，请重新登录。', { code: 'MISSING_AUTH_SESSION' });
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function parseJson<TData>(response: Response): Promise<TData> {
  const payload = (await response.json().catch(() => null)) as TData | null;
  if (payload === null) {
    throw new ManualApiError('服务器返回了无法识别的数据。', { status: response.status });
  }
  return payload;
}

export async function fetchSave() {
  const response = await fetch(`${SERVER_URL}/api/save/`, {
    method: 'GET',
    headers: await buildAuthHeaders(),
  });

  if (!response.ok) {
    const payload = await parseJson<{ error?: string; detail?: string }>(response);
    throw new ManualApiError(payload.detail || payload.error || '读取存档失败。', { status: response.status });
  }

  return parseJson<SaveResponse>(response);
}

export async function postGameAction<TData>(action: string, payload: Record<string, unknown> = {}) {
  const response = await fetch(`${SERVER_URL}/api/action`, {
    method: 'POST',
    headers: await buildAuthHeaders(),
    body: JSON.stringify({ action, payload }),
  });

  const parsed = await parseJson<ActionResponse<TData>>(response);

  if (!response.ok) {
    if ('message' in parsed) {
      throw new ManualApiError(parsed.message, {
        code: 'errorCode' in parsed ? parsed.errorCode : undefined,
        status: response.status,
      });
    }

    throw new ManualApiError('动作请求失败。', { status: response.status });
  }

  if (!parsed.ok) {
    throw new ManualApiError(parsed.message, { code: parsed.errorCode, status: response.status });
  }

  return parsed.data;
}
