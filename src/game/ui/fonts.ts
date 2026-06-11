/**
 * Pixel typography. "Press Start 2P" for headings and numbers (chunky,
 * authentic 8-bit), "VT323" for body text (terminal-style, highly legible
 * at small sizes). Both fall back to monospace if the webfont fails.
 */
export const FONT_HEADING = '"Press Start 2P", "Courier New", monospace';
export const FONT_BODY = 'VT323, "Courier New", monospace';

/**
 * Resolve once the pixel fonts are usable (or after a short timeout so the
 * game never hangs when offline — fallback fonts kick in instead).
 */
export function waitForFonts(timeoutMs = 2500): Promise<void> {
  if (!('fonts' in document)) return Promise.resolve();
  const load = Promise.all([
    document.fonts.load('12px "Press Start 2P"'),
    document.fonts.load('16px VT323'),
  ]).then(() => undefined);
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  return Promise.race([load, timeout]);
}
