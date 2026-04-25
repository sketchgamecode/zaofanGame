import { Lock } from 'lucide-react';

export function Guild() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-darkBg to-black/80 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-darkBg/10 to-transparent opacity-60"></div>
      
      <div className="relative z-10 flex flex-col items-center p-12 border border-darkBorder/30 rounded-2xl bg-darkSurface/30 backdrop-blur-md shadow-2xl">
        <div className="bg-darkBg/60 p-5 rounded-full inline-flex items-center justify-center mb-6 shadow-inner border border-white/5 relative">
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse"></div>
          <Lock className="w-16 h-16 text-textMuted/50" />
        </div>
        <h2 className="text-4xl font-bold tracking-[0.2em] text-textMain/70 mb-6">聚义厅</h2>
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-6"></div>
        <p className="text-xl max-w-xl text-center leading-loose text-textMuted/80 font-light selection:bg-primary/30">
          “招兵买马系统筹备中，未来可与兄弟共建 <span className="text-primary/60 font-normal">山寨</span>。”
        </p>
      </div>
    </div>
  );
}
