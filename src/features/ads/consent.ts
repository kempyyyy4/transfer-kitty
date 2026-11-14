/**
 * Whether the player has agreed to ads. The cookie banner that asks arrives in stage 13
 * and stores the answer under this key; until then nobody has agreed, so no ads load.
 */
export const AD_CONSENT_KEY = "tk_ads_consent";

export function hasAdConsent(): boolean {
  try {
    return window.localStorage.getItem(AD_CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}
