/**
 * Static Build Fingerprint for HMK HRM Mobile App
 * Must NOT be generated dynamically or at runtime.
 */
export const APP_BUILD_ID = "HMK-MOBILE-CR-CANCEL-WD-R3-20261009";
export const APP_BUILD_NOTE = "Cancel+Withdraw QA Remediation R3";

if (typeof window !== "undefined") {
  console.info("[HMK BUILD]", APP_BUILD_ID, APP_BUILD_NOTE);
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.dataset.buildId = APP_BUILD_ID;
  }
}
