type ErrorToastProps = {
  message: string;
};

export function ErrorToast({ message }: ErrorToastProps) {
  return (
    <div className="rounded-2xl border border-red-900/60 bg-red-950/70 px-4 py-3 text-sm text-red-200 shadow-[0_10px_30px_rgba(50,0,0,0.35)]">
      {message}
    </div>
  );
}
