import type { CSSProperties } from 'react';

type CharacterPortraitCardProps = {
  avatarUrl: string;
  name: string;
  title?: string;
  level?: number;
  rankText?: string;
  xpProgress?: number;
  className?: string;
  showInfoButton?: boolean;
};

export function CharacterPortraitCard({
  avatarUrl,
  name,
  title,
  level,
  rankText,
  xpProgress = 0,
  className,
  showInfoButton = false,
}: CharacterPortraitCardProps) {
  const safeProgress = Math.min(1, Math.max(0, xpProgress));
  const progressStyle = { width: `${safeProgress * 100}%` } satisfies CSSProperties;
  const rootClassName = ['character-portrait-card', className].filter(Boolean).join(' ');
  const bottomText = [
    typeof level === 'number' ? `${level}级好汉` : null,
    rankText,
  ].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
      <img alt={name} className="character-portrait-card__avatar" src={avatarUrl} />

      {title ? <div className="character-portrait-card__title">{title}</div> : null}
      <div className="character-portrait-card__name">{name}</div>

      <div className="character-portrait-card__xp-bar">
        <div className="character-portrait-card__xp-fill" style={progressStyle} />
        <span>{bottomText}</span>
      </div>

      {showInfoButton ? (
        <button className="character-portrait-card__info-button" type="button">
          i
        </button>
      ) : null}
    </div>
  );
}
