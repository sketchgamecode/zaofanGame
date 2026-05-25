import type { ResourceState } from '../../types/game';
import { ResourceBadge } from './ResourceBadge';

type PlayerResourcePanelProps = {
  resources: ResourceState;
  className?: string;
};

const resourceItems = [
  { key: 'copper', label: '铜钱', type: 'copper' },
  { key: 'tokens', label: '令牌', type: 'token' },
  { key: 'hourglasses', label: '沙漏', type: 'sandglass' },
  { key: 'prestige', label: '声望', type: 'reputation' },
] as const;

export function PlayerResourcePanel({ resources, className }: PlayerResourcePanelProps) {
  return (
    <section className={`player-resource-panel${className ? ` ${className}` : ''}`}>
      {resourceItems.map((item) => (
        <ResourceBadge
          key={item.key}
          label={item.label}
          size="compact"
          type={item.type}
          value={resources[item.key]}
        />
      ))}
    </section>
  );
}
