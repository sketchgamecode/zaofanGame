export type GameActionPayload = Record<string, unknown>;

export type GameActionEnvelope = {
  action: string;
  payload?: GameActionPayload;
};

export type ActionSuccessResponse<TData> = {
  ok: true;
  action: string;
  serverTime: number;
  stateRevision: number;
  data: TData;
};

export type ActionErrorResponse = {
  ok: false;
  action: string;
  serverTime: number;
  stateRevision?: number;
  errorCode: string;
  message: string;
};

export type ActionResponse<TData> = ActionSuccessResponse<TData> | ActionErrorResponse;

export type ApiErrorKind =
  | 'network'
  | 'auth'
  | 'config'
  | 'business'
  | 'client_state'
  | 'unknown';

export type ApiErrorReason =
  | 'OFFLINE'
  | 'TIMEOUT'
  | 'FETCH_FAILED'
  | 'CORS_OR_API_UNREACHABLE'
  | 'API_BASE_URL_INVALID'
  | 'INVALID_API_RESPONSE'
  | 'MISSING_AUTH_SESSION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'DUPLICATE_ACTION'
  | 'STALE_UI_STATE'
  | 'BUSINESS_RULE'
  | 'UNKNOWN';

export type ActionRequestMeta = {
  status: number | null;
  requestId: string | null;
  apiBaseUrl: string;
  receivedAt: number;
};

export type ActionSuccessResult<TData> = ActionSuccessResponse<TData> & {
  meta: ActionRequestMeta;
};

export type ApiHealthSummary = {
  ok: boolean;
  status: number | null;
  requestId: string | null;
  apiBaseUrl: string;
  env: string | null;
  releaseTag: string | null;
  warning: 'POSSIBLE_WRONG_ENVIRONMENT' | null;
  checkedAt: number;
};

export type GameApiErrorOptions = {
  action: string;
  kind: ApiErrorKind;
  reason: ApiErrorReason;
  userMessage: string;
  debugMessage: string;
  status?: number | null;
  errorCode?: string | null;
  requestId?: string | null;
  apiBaseUrl: string;
  serverTime?: number | null;
  stateRevision?: number | null;
};

export class GameApiError extends Error {
  readonly action: string;
  readonly kind: ApiErrorKind;
  readonly reason: ApiErrorReason;
  readonly userMessage: string;
  readonly debugMessage: string;
  readonly status: number | null;
  readonly errorCode: string | null;
  readonly requestId: string | null;
  readonly apiBaseUrl: string;
  readonly serverTime: number | null;
  readonly stateRevision: number | null;

  constructor(options: GameApiErrorOptions) {
    super(options.debugMessage);
    this.name = 'GameApiError';
    this.action = options.action;
    this.kind = options.kind;
    this.reason = options.reason;
    this.userMessage = options.userMessage;
    this.debugMessage = options.debugMessage;
    this.status = options.status ?? null;
    this.errorCode = options.errorCode ?? null;
    this.requestId = options.requestId ?? null;
    this.apiBaseUrl = options.apiBaseUrl;
    this.serverTime = options.serverTime ?? null;
    this.stateRevision = options.stateRevision ?? null;
  }
}
