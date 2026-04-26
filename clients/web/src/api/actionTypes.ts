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
