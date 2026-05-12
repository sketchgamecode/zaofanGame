export function ResourceBadge({
  label,
  value,
  width,
}: {
  label: string;
  value: number;
  width?: number;
}) {
  return (
    <div className="resource-chip" style={width ? { width: `${width}px` } : undefined}>
      <div className="resource-chip__icon" />
      <div className="resource-chip__text">
        <div className="resource-chip__label">{label}</div>
        <div className="resource-chip__value">{value}</div>
      </div>
    </div>
  );
}
