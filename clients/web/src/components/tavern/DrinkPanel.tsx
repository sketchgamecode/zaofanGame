type DrinkPanelProps = {
  thirstSecRemaining: number;
  drinksUsedToday: number;
  firstMissionBonusAvailable: boolean;
  onDrink: () => void;
  isSubmitting: boolean;
};

function formatThirst(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes === 0) {
    return `${remainder}s`;
  }

  if (remainder === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainder}s`;
}

export function DrinkPanel({
  thirstSecRemaining,
  drinksUsedToday,
  firstMissionBonusAvailable,
  onDrink,
  isSubmitting,
}: DrinkPanelProps) {
  return (
    <section className="rounded-[28px] border border-amber-800/40 bg-[linear-gradient(140deg,rgba(54,24,12,0.94),rgba(22,10,6,0.98))] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-amber-600">Tavern Stock</p>
          <h2 className="mt-2 text-xl font-black tracking-[0.06em] text-amber-100">Thirst Ledger</h2>
        </div>
        <div className="rounded-full border border-amber-700/40 bg-black/20 px-3 py-1.5 text-xs text-amber-300">
          Drinks {drinksUsedToday}/10
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">Thirst Remaining</p>
          <p className="mt-2 text-2xl font-bold text-amber-100">{formatThirst(thirstSecRemaining)}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">First Mission Bonus</p>
          <p className="mt-2 text-sm font-semibold text-amber-100">
            {firstMissionBonusAvailable ? 'Available today' : 'Already consumed'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDrink}
        disabled={isSubmitting}
        className="mt-5 w-full rounded-2xl border border-amber-700/60 bg-amber-700/15 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-amber-200 transition hover:bg-amber-700/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'POURING' : 'DRINK'}
      </button>
    </section>
  );
}
