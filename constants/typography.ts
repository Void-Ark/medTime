/**
 * Senior-friendly typography and sizing constants.
 * Centralised here so all screens stay in sync.
 */

export const FontSize = {
  /** Tiny captions / threshold labels */
  xs: 13,
  /** Supporting details (dosage, timestamps) */
  sm: 16,
  /** Default body text */
  md: 18,
  /** Medicine / section names */
  lg: 20,
  /** Screen section headings */
  xl: 22,
  /** Header bar titles */
  xxl: 26,
  /** Large modal / card headings */
  hero: 28,
};

export const TouchTarget = {
  /** Minimum height for any pressable element */
  minHeight: 54,
  /** Standard action button padding */
  paddingV: 15,
  paddingH: 20,
  /** Icon button safe-tap area */
  hitSlop: { top: 16, bottom: 16, left: 16, right: 16 },
};

export const IconSize = {
  sm: 22,
  md: 28,
  lg: 36,
  hero: 90,
};
