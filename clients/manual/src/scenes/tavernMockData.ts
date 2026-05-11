export function resolveTaskBackgroundPath(locationName?: string) {
  if (!locationName) {
    return '/assets/backgrounds/bg_system_tavern_task_bg_placeholder.png';
  }

  const normalized = Array.from(locationName).reduce((total, character) => total + character.charCodeAt(0), 0);
  const backgroundIndex = normalized % 6;
  return `/assets/backgrounds/bg_system_tavern_task_bg_0${backgroundIndex}.png`;
}
