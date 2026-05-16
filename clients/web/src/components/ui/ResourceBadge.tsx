export function ResourceBadge({
  label,
  type,
  value,
  width,
}: {
  label: string;
  type?: 'copper' | 'token' | 'sandglass' | 'reputation';
  value: number;
  width?: number;
}) {
  const typeClass = type ? ` resource-chip--${type}` : '';

  return (
    <div className={`resource-chip${typeClass}`} style={width ? { width: `${width}px` } : undefined}>
      <div className="resource-chip__icon" />
      <div className="resource-chip__text">
        <div className="resource-chip__label">{label}</div>
        <div className="resource-chip__value">{value}</div>
      </div>
    </div>
  );
}
