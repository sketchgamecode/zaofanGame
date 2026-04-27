type ErrorToastProps = {
  title: string;
  message: string;
  requestId?: string | null;
  hint?: string | null;
};

export function ErrorToast({ title, message, requestId, hint }: ErrorToastProps) {
  return (
    <div className="rounded-2xl border border-red-900/60 bg-red-950/70 px-4 py-3 text-sm text-red-200 shadow-[0_10px_30px_rgba(50,0,0,0.35)]">
      <p className="font-semibold tracking-[0.12em] text-red-100">{title}</p>
      <p className="mt-1 leading-6">{message}</p>
      {hint ? <p className="mt-2 text-xs text-red-200/80">{hint}</p> : null}
      {requestId ? <p className="mt-2 font-mono text-[11px] text-red-200/70">requestId: {requestId}</p> : null}
    </div>
  );
}
