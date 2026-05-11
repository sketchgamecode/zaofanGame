import React from 'react';
import { useCharacter } from '../hooks/useCharacter';
import { CharacterPanel } from '../components/character/CharacterPanel';
import { InventoryPanel } from '../components/character/InventoryPanel';
import { ErrorToast } from '../components/common/ErrorToast';

export function CharacterPage() {
  const { character, apiError, loadCharacter } = useCharacter();

  if (apiError) {
    return (
      <div className="flex-1 bg-[#050406] flex items-center justify-center flex-col gap-4 text-stone-100 p-4">
         <ErrorToast title="加载失败" message={apiError.userMessage} hint={apiError.debugMessage} />
         <button onClick={() => loadCharacter()} className="mt-4 rounded-full border border-stone-800/80 bg-black/20 px-4 py-2 text-sm">重试</button>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex-1 bg-[#050406] flex items-center justify-center flex-col gap-4 text-stone-100 h-full">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-900/40 border-t-indigo-400 animate-spin" />
        <p className="text-sm tracking-[0.35em] text-stone-500 uppercase">加载角色数据</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-[#0b0c10] overflow-hidden">
      {/* Left Area: Character Panel (Fixed Width) */}
      <div className="w-[360px] shrink-0 border-r border-stone-800/60 bg-stone-950/80 backdrop-blur-sm p-3 h-full overflow-hidden">
        <CharacterPanel character={character} activeDragType={null} />
      </div>

      {/* Right Area: Nothing on top, Backpack on bottom */}
      <div className="flex-1 p-4 flex flex-col justify-end items-center h-full overflow-hidden relative">
        {/* Placeholder for future features (like mounts/pets) could go here */}
        <div className="flex-1 w-full flex items-center justify-center opacity-10 pointer-events-none">
          <img src="/assets/ui/logo.png" alt="logo" className="w-64 h-64 grayscale" onError={e=>e.currentTarget.style.display='none'}/>
        </div>

        {/* The Backpack (Bottom) */}
        <div className="w-full max-w-[420px] shrink-0">
          <InventoryPanel character={character} />
        </div>
      </div>
    </div>
  );
}
