type DrinkPanelProps = {
  thirstSecRemaining: number;
  drinksUsedToday: number;
  firstMissionBonusAvailable: boolean;
  onDrink: () => void;
  isSubmitting: boolean;
};

export function DrinkPanel({
  thirstSecRemaining,
  drinksUsedToday,
  firstMissionBonusAvailable,
  onDrink,
  isSubmitting,
}: DrinkPanelProps) {
  const mm = Math.floor(thirstSecRemaining / 60).toString().padStart(2, '0');
  const ss = (thirstSecRemaining % 60).toString().padStart(2, '0');
  
  // MAX thirst is maybe 120 mins = 7200 sec? (Placeholder for progress)
  const maxThirst = 100 * 60; // 100 minutes
  const progressPercent = Math.min(100, Math.max(0, (thirstSecRemaining / maxThirst) * 100));

  return (
    <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 w-[800px] h-[48px] z-20 flex shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
      
      {/* Drink Button (Left) */}
      <button
        type="button"
        onClick={onDrink}
        disabled={isSubmitting || drinksUsedToday >= 10}
        className="w-[80px] h-full bg-gradient-to-b from-amber-700 to-amber-900 border-2 border-stone-900 rounded-l-lg flex flex-col items-center justify-center hover:from-amber-600 hover:to-amber-800 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group relative"
      >
        <span className="text-xl font-black text-amber-200 drop-shadow-md">🍺</span>
        <span className="text-[10px] font-bold text-amber-100">{drinksUsedToday}/10</span>
        
        {/* Hover Hint */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-black/90 border border-stone-700 rounded text-xs text-stone-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl">
          {firstMissionBonusAvailable ? '首任务加成：今日可用' : '点击消耗 1 沙漏恢复 20 分钟探险时间'}
        </div>
      </button>

      {/* Thirst Bar (Right) */}
      <div className="flex-1 h-full bg-stone-900 border-y-2 border-r-2 border-stone-900 rounded-r-lg relative overflow-hidden">
        {/* Fake Wood Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 pointer-events-none" />
        
        {/* Fill */}
        <div 
          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[inset_0_2px_10px_rgba(255,255,255,0.2)] transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
        
        {/* Text */}
        <div className="absolute inset-0 flex items-center justify-center text-white font-black tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          Thirst for adventure: {mm}:{ss}
        </div>
      </div>

    </div>
  );
}
