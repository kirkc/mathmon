/**
 * Keyboard controls. Kept in one place so they can be remapped
 * (and eventually exposed in a settings screen).
 */
export const controlsConfig = {
  moveUp: ['ArrowUp', 'KeyW'],
  moveDown: ['ArrowDown', 'KeyS'],
  moveLeft: ['ArrowLeft', 'KeyA'],
  moveRight: ['ArrowRight', 'KeyD'],
  interact: ['Enter', 'Space'],
  cancel: ['Escape'],
  dashboard: ['KeyP'],
  glossary: ['KeyG'],
} as const;

export function matchesControl(
  code: string,
  control: readonly string[],
): boolean {
  return control.includes(code);
}
