const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export type InitialPlayerState = {
  copper: number;
  tokens: number;
  startingWeapons: { itemId: string; name: string }[];
};

export type DebugConfig = {
  debugTavernXpMultiplier: number;
  debugTavernCopperMultiplier: number;
  initialPlayerState?: InitialPlayerState;
};

type DebugConfigResponse = {
  ok: boolean;
  config?: DebugConfig;
  error?: string;
  detail?: string;
};

export class DebugConfigApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'DebugConfigApiError';
    this.status = status;
  }
}

async function parseDebugConfigResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as DebugConfigResponse | null;

  if (!payload) {
    throw new DebugConfigApiError('服务器返回了无法识别的数据。', response.status);
  }

  if (!response.ok || !payload.ok || !payload.config) {
    throw new DebugConfigApiError(payload.detail || payload.error || 'Debug 配置请求失败。', response.status);
  }

  return payload.config;
}

export async function fetchDebugConfig() {
  const response = await fetch(`${SERVER_URL}/api/debug/config`, {
    method: 'GET',
  });

  return parseDebugConfigResponse(response);
}

export async function updateDebugConfig(config: Partial<DebugConfig>) {
  const response = await fetch(`${SERVER_URL}/api/debug/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  return parseDebugConfigResponse(response);
}
