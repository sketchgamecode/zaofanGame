/**
 * Modular UI component.
 * Resource chip sizing and internals must be expressed as ResourceBadge props
 * and `.resource-chip*` CSS variants, not scene-specific descendant overrides.
 */
export function ResourceBadge({
  label,
  size = 'default',
  type,
  value,
  width,
}: {
  label: string;
  size?: 'default' | 'compact';
  type?: 'copper' | 'token' | 'sandglass' | 'reputation';
  value: number;
  width?: number;
}) {
  const typeClass = type ? ` resource-chip--${type}` : '';
  const sizeClass = size === 'compact' ? ' resource-chip--compact' : '';

  return (
    <div className={`resource-chip${typeClass}${sizeClass}`} style={width ? { width: `${width}px` } : undefined}>
      <div className="resource-chip__icon" />
      <div className="resource-chip__text">
        <div className="resource-chip__label">{label}</div>
        <div className="resource-chip__value">{value}</div>
      </div>
    </div>
  );
}
