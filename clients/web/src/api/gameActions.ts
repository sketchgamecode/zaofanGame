import { getAuthToken, SERVER_URL } from '../lib/supabase';
import type {
  ActionErrorResponse,
  ActionRequestMeta,
  ActionResponse,
  ActionSuccessResult,
  ApiHealthSummary,
  GameActionPayload,
} from './actionTypes';
import { GameApiError } from './actionTypes';

const ACTION_TIMEOUT_MS = 12000;
const HEALTH_TIMEOUT_MS = 5000;

const CLIENT_STATE_ERROR_CODES = new Set([
  'INVALID_TAVERN_STATE',
  'MISSION_ALREADY_IN_PROGRESS',
  'MISSION_NOT_FOUND',
  'OFFER_SET_MISMATCH',
  'MISSION_NOT_FINISHED',
  'NO_ACTIVE_MISSION',
]);

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

function buildRequestMeta(response: Response): ActionRequestMeta {
  return {
    status: response.status,
    requestId: response.headers.get('x-request-id'),
    apiBaseUrl: SERVER_URL,
    receivedAt: Date.now(),
  };
}

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timerId = window.setTimeout(() => controller.abort('timeout'), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timerId),
  };
}

function isLikelyPublicPage() {
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1';
}

function isLocalApiBaseUrl(apiBaseUrl: string) {
  try {
    const parsed = new URL(apiBaseUrl, window.location.origin);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1';
  } catch {
    return false;
  }
}

function isCrossOriginApi(apiBaseUrl: string) {
  try {
    const parsed = new URL(apiBaseUrl, window.location.origin);
    return parsed.origin !== window.location.origin;
  } catch {
    return false;
  }
}

function mapBusinessMessage(errorCode: string, fallbackMessage: string) {
  switch (errorCode) {
    case 'NOT_ENOUGH_TOKENS':
      return '通宝不足，暂时无法执行这次操作。';
    case 'NOT_ENOUGH_COPPER':
      return '铜钱不足。';
    case 'TAVERN_DRINK_LIMIT_REACHED':
      return '今日饮酒次数已达上限。';
    case 'NOT_ENOUGH_THIRST':
      return '干粮不足，先补给后再出发。';
    case 'NOT_ENOUGH_SKIP_RESOURCE':
      return '沙漏或通宝不足，暂时无法跳过任务。';
    case 'ITEM_NOT_FOUND':
      return '装备不存在或已不在背包中。';
    case 'INVALID_EQUIPMENT_SLOT':
      return '装备槽位无效。';
    case 'EQUIP_SLOT_MISMATCH':
      return '装备槽位不匹配。';
    case 'EMPTY_EQUIPMENT_SLOT':
      return '该槽位没有装备。';
    case 'INVALID_ATTRIBUTE_KEY':
      return '属性类型无效。';
    default:
      return fallbackMessage || '服务器拒绝了这次操作。';
  }
}

function readPlainErrorMessage(payload: unknown) {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const candidate = payload as Record<string, unknown>;

  if (typeof candidate.error === 'string') {
    return candidate.error;
  }

  if (typeof candidate.message === 'string') {
    return candidate.message;
  }

  return null;
}

function classifyActionError(
  action: string,
  meta: ActionRequestMeta,
  parsed: ActionErrorResponse,
) {
  const status = meta.status;

  if (status === 401 || parsed.errorCode === 'UNAUTHORIZED') {
    return new GameApiError({
      action,
      kind: 'auth',
      reason: 'UNAUTHORIZED',
      userMessage: '登录状态已失效，请重新登录后再试。',
      debugMessage: `HTTP ${status ?? 401} unauthorized for ${action}`,
      status,
      errorCode: parsed.errorCode,
      requestId: meta.requestId,
      apiBaseUrl: meta.apiBaseUrl,
      serverTime: parsed.serverTime,
      stateRevision: parsed.stateRevision ?? null,
    });
  }

  if (status === 403 || parsed.errorCode === 'FORBIDDEN') {
    return new GameApiError({
      action,
      kind: 'auth',
      reason: 'FORBIDDEN',
      userMessage: '当前账号没有权限执行这次操作。',
      debugMessage: `HTTP ${status ?? 403} forbidden for ${action}`,
      status,
      errorCode: parsed.errorCode,
      requestId: meta.requestId,
      apiBaseUrl: meta.apiBaseUrl,
      serverTime: parsed.serverTime,
      stateRevision: parsed.stateRevision ?? null,
    });
  }

  if (CLIENT_STATE_ERROR_CODES.has(parsed.errorCode)) {
    return new GameApiError({
      action,
      kind: 'client_state',
      reason: 'STALE_UI_STATE',
      userMessage: '当前页面状态已过期，正在尝试与服务器重新同步。',
      debugMessage: `${parsed.errorCode} returned for ${action}: ${parsed.message}`,
      status,
      errorCode: parsed.errorCode,
      requestId: meta.requestId,
      apiBaseUrl: meta.apiBaseUrl,
      serverTime: parsed.serverTime,
      stateRevision: parsed.stateRevision ?? null,
    });
  }

  return new GameApiError({
    action,
    kind: 'business',
    reason: 'BUSINESS_RULE',
    userMessage: mapBusinessMessage(parsed.errorCode, parsed.message),
    debugMessage: `${parsed.errorCode} returned for ${action}: ${parsed.message}`,
    status,
    errorCode: parsed.errorCode,
    requestId: meta.requestId,
    apiBaseUrl: meta.apiBaseUrl,
    serverTime: parsed.serverTime,
    stateRevision: parsed.stateRevision ?? null,
  });
}

function classifyFetchFailure(action: string, error: unknown) {
  if (!navigator.onLine) {
    return new GameApiError({
      action,
      kind: 'network',
      reason: 'OFFLINE',
      userMessage: '当前网络已断开，请检查网络后重试。',
      debugMessage: `Browser is offline while requesting ${action}`,
      apiBaseUrl: SERVER_URL,
    });
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new GameApiError({
      action,
      kind: 'network',
      reason: 'TIMEOUT',
      userMessage: '请求超时，服务器暂时没有响应。',
      debugMessage: `Request timeout after ${ACTION_TIMEOUT_MS}ms for ${action}`,
      apiBaseUrl: SERVER_URL,
    });
  }

  if (isLikelyPublicPage() && isLocalApiBaseUrl(SERVER_URL)) {
    return new GameApiError({
      action,
      kind: 'config',
      reason: 'API_BASE_URL_INVALID',
      userMessage: '当前页面连接到了错误的 API 地址，请联系管理员检查部署配置。',
      debugMessage: `SERVER_URL points to local address on public page: ${SERVER_URL}`,
      apiBaseUrl: SERVER_URL,
    });
  }

  if (isCrossOriginApi(SERVER_URL)) {
    return new GameApiError({
      action,
      kind: 'config',
      reason: 'CORS_OR_API_UNREACHABLE',
      userMessage: '无法连接游戏服务器，请检查 API 地址或跨域配置。',
      debugMessage: `Cross-origin fetch failed for ${action} via ${SERVER_URL}`,
      apiBaseUrl: SERVER_URL,
    });
  }

  return new GameApiError({
    action,
    kind: 'network',
    reason: 'FETCH_FAILED',
    userMessage: '请求未能发送成功，请稍后重试。',
    debugMessage: error instanceof Error ? error.message : `Unknown fetch failure for ${action}`,
    apiBaseUrl: SERVER_URL,
  });
}

export function createClientStateError(
  action: string,
  reason: 'DUPLICATE_ACTION' | 'STALE_UI_STATE',
  userMessage: string,
  debugMessage: string,
) {
  return new GameApiError({
    action,
    kind: 'client_state',
    reason,
    userMessage,
    debugMessage,
    apiBaseUrl: SERVER_URL,
  });
}

export function shouldResyncForError(error: GameApiError) {
  return error.kind === 'client_state' && error.reason === 'STALE_UI_STATE';
}

export async function postGameAction<TData>(
  action: string,
  payload: GameActionPayload = {},
): Promise<ActionSuccessResult<TData>> {
  const token = await getAuthToken();

  if (!token) {
    throw new GameApiError({
      action,
      kind: 'auth',
      reason: 'MISSING_AUTH_SESSION',
      userMessage: '登录状态已失效，请重新登录后再试。',
      debugMessage: `Missing auth session before ${action}`,
      apiBaseUrl: SERVER_URL,
    });
  }

  const timeout = createTimeoutSignal(ACTION_TIMEOUT_MS);

  try {
    const response = await fetch(`${SERVER_URL}/api/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, payload }),
      signal: timeout.signal,
    });

    const meta = buildRequestMeta(response);
    const parsed = (await response.json().catch(() => null)) as unknown;

    if (!isActionResponse<TData>(parsed)) {
      const plainErrorMessage = readPlainErrorMessage(parsed);

      if (response.status === 401) {
        throw new GameApiError({
          action,
          kind: 'auth',
          reason: 'UNAUTHORIZED',
          userMessage: '登录状态已失效，请重新登录后再试。',
          debugMessage: plainErrorMessage
            ? `HTTP 401 unauthorized for ${action}: ${plainErrorMessage}`
            : `HTTP 401 unauthorized for ${action} with non-envelope payload`,
          status: response.status,
          errorCode: 'UNAUTHORIZED',
          requestId: meta.requestId,
          apiBaseUrl: meta.apiBaseUrl,
        });
      }

      if (response.status === 403) {
        throw new GameApiError({
          action,
          kind: 'auth',
          reason: 'FORBIDDEN',
          userMessage: '当前账号没有权限执行这次操作。',
          debugMessage: plainErrorMessage
            ? `HTTP 403 forbidden for ${action}: ${plainErrorMessage}`
            : `HTTP 403 forbidden for ${action} with non-envelope payload`,
          status: response.status,
          errorCode: 'FORBIDDEN',
          requestId: meta.requestId,
          apiBaseUrl: meta.apiBaseUrl,
        });
      }

      throw new GameApiError({
        action,
        kind: 'config',
        reason: 'INVALID_API_RESPONSE',
        userMessage: '服务器返回了无法识别的数据，请确认 API 地址和部署环境。',
        debugMessage: `Invalid action response payload for ${action} with HTTP ${response.status}`,
        status: response.status,
        requestId: meta.requestId,
        apiBaseUrl: meta.apiBaseUrl,
      });
    }

    if (!response.ok && parsed.ok) {
      throw new GameApiError({
        action,
        kind: 'config',
        reason: 'INVALID_API_RESPONSE',
        userMessage: '服务器响应状态异常，请确认当前接口部署是否正确。',
        debugMessage: `Unexpected HTTP ${response.status} with ok=true envelope for ${action}`,
        status: response.status,
        requestId: meta.requestId,
        apiBaseUrl: meta.apiBaseUrl,
        serverTime: parsed.serverTime,
        stateRevision: parsed.stateRevision,
      });
    }

    if (!parsed.ok) {
      throw classifyActionError(action, meta, parsed);
    }

    return {
      ...parsed,
      meta,
    };
  } catch (error) {
    if (error instanceof GameApiError) {
      throw error;
    }

    throw classifyFetchFailure(action, error);
  } finally {
    timeout.clear();
  }
}

export async function fetchApiHealth(): Promise<ApiHealthSummary> {
  const timeout = createTimeoutSignal(HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${SERVER_URL}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: timeout.signal,
    });

    const parsed = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    const env = typeof parsed?.env === 'string' ? parsed.env : null;
    const releaseTag = typeof parsed?.releaseTag === 'string' ? parsed.releaseTag : null;
    const warning =
      isLikelyPublicPage() && typeof env === 'string' && /(dev|test|staging|local)/i.test(env)
        ? 'POSSIBLE_WRONG_ENVIRONMENT'
        : null;

    return {
      ok: response.ok,
      status: response.status,
      requestId: response.headers.get('x-request-id'),
      apiBaseUrl: SERVER_URL,
      env,
      releaseTag,
      warning,
      checkedAt: Date.now(),
    };
  } catch {
    return {
      ok: false,
      status: null,
      requestId: null,
      apiBaseUrl: SERVER_URL,
      env: null,
      releaseTag: null,
      warning: null,
      checkedAt: Date.now(),
    };
  } finally {
    timeout.clear();
  }
}
