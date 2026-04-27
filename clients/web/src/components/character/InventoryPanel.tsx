import { EquipmentItemCard } from './EquipmentItemCard';
import type { CharacterInfoView } from '../../types/character';

type InventoryPanelProps = {
  inventory: CharacterInfoView['inventory'];
  pendingItemId?: string;
  onEquip: (itemId: string) => void;
};

export function InventoryPanel({ inventory, pendingItemId, onEquip }: InventoryPanelProps) {
  return (
    <section className="rounded-[28px] border border-fuchsia-900/50 bg-[linear-gradient(180deg,rgba(27,12,28,0.95),rgba(12,6,16,0.98))] p-5 text-fuchsia-100 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-fuchsia-500">背包</p>
          <h2 className="mt-2 text-xl font-black tracking-[0.05em]">库存装备</h2>
        </div>
        <div className="rounded-2xl border border-fuchsia-800/50 bg-fuchsia-950/25 px-4 py-3 text-right text-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-fuchsia-400/70">数量</p>
          <p className="mt-1 font-semibold text-fuchsia-100">
            {inventory.count}
            {typeof inventory.capacity === 'number' ? ` / ${inventory.capacity}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {inventory.items.length > 0 ? (
          inventory.items.map((item) => (
            <EquipmentItemCard
              key={item.id}
              item={item}
              footer={
                <button
                  type="button"
                  onClick={() => onEquip(item.id)}
                  disabled={pendingItemId === item.id}
                  className="w-full rounded-2xl border border-fuchsia-700/60 bg-fuchsia-700/15 px-4 py-3 text-sm font-semibold tracking-[0.18em] text-fuchsia-100 transition hover:bg-fuchsia-700/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pendingItemId === item.id ? '穿戴中' : '穿戴装备'}
                </button>
              }
            />
          ))
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-stone-950/50 px-4 py-6 text-center text-sm text-stone-400">
            当前背包没有装备。
          </div>
        )}
      </div>
    </section>
  );
}
