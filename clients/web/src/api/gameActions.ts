import { getAuthToken, SERVER_URL } from '../lib/supabase';
import type { ActionResponse, GameActionPayload } from './actionTypes';

function isActionResponse<TData>(value: unknown): value is ActionResponse<TData> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.ok === 'boolean' &&
    typeof candidate.action === 'string' &&
    typeof candidate.serverTime === 'number'
  );
}

export async function postGameAction<TData>(
  action: string,
  payload: GameActionPayload = {},
): Promise<ActionResponse<TData>> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Missing auth session');
  }

  const response = await fetch(`${SERVER_URL}/api/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, payload }),
  });

  const parsed = (await response.json().catch(() => null)) as unknown;

  if (!isActionResponse<TData>(parsed)) {
    throw new Error(`Invalid action response for ${action}`);
  }

  if (!response.ok && parsed.ok) {
    throw new Error(`Unexpected HTTP ${response.status} for ${action}`);
  }

  return parsed;
}
