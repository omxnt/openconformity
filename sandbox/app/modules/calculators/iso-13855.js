/**
 * ISO 13855 — Safety distance from approach speed.
 *
 * Computes the minimum distance S between an electro-sensitive protective
 * equipment (typically a light curtain) and the hazard zone, so that the
 * machine stops before a person can reach the hazard.
 *
 *   S = K · T + C
 *
 *   K = approach speed (mm/s; commonly 1600 for body, 2000 for hand/arm)
 *   T = overall response time of the safety chain (s; total stopping time)
 *   C = intrusion distance (mm), depending on detection capability d:
 *         d ≤ 14 mm  → C = 0
 *         14 < d ≤ 40 → C = 8 · (d − 14)
 *         d > 40 mm  → C = 850 mm (whole-body/upper-body access default)
 *
 * Note: ISO 13855:2010 specifies application-dependent rules for C; the
 * three-band approximation above is a starting point for the simple
 * light-curtain case. Verify against the current standard text for your
 * actual application.
 *
 * Calculator definitions are pure: they hold no state, do no I/O, and can
 * be unit-tested independently of the rest of the app.
 */

/** @typedef {import('./index.js').Calculator} Calculator */

/** @type {Calculator} */
const iso13855 = {
  id: 'iso-13855',
  name: 'ISO 13855 — Safety distance from approach speed',
  standardVersion: 'ISO 13855:2010',
  description:
    'Minimum distance between a safeguard (e.g. light curtain) and the hazard zone, derived from approach speed and the safety chain’s overall response time.',
  disclaimer:
    'The intrusion-distance C depends on application factors (detection capability, body part, mounting). Verify against the current ISO 13855 text for your specific case.',
  fields: [
    {
      name: 'approachSpeed',
      label: 'Approach speed K',
      unit: 'mm/s',
      type: 'number',
      default: 1600,
      hint: 'ISO 13855: 1600 mm/s for body approach; 2000 mm/s for hand/arm.',
    },
    {
      name: 'overallResponseTime',
      label: 'Overall response time T',
      unit: 'ms',
      type: 'number',
      default: 100,
      hint: 'Total stopping time of the safety chain (sensor + logic + actuator + machine stop time).',
    },
    {
      name: 'detectionCapability',
      label: 'Object detection capability d',
      unit: 'mm',
      type: 'number',
      default: 30,
      hint: 'Light curtain detection capability. Drives the intrusion distance C.',
    },
  ],
  compute(inputs) {
    const K = toNumber(inputs.approachSpeed);
    const Tms = toNumber(inputs.overallResponseTime);
    const d = toNumber(inputs.detectionCapability);
    const Tsec = Tms / 1000;

    let C;
    if (d <= 14) C = 0;
    else if (d <= 40) C = 8 * (d - 14);
    else C = 850;

    const S = K * Tsec + C;

    const round = (n) => Math.round(n * 10) / 10;

    return {
      intrusionDistanceC: round(C),
      safetyDistance: round(S),
      formula: `S = K · T + C = ${round(K)} · ${round(Tsec * 1000) / 1000} + ${round(C)} = ${round(S)} mm`,
    };
  },
  summarize(inputs, result) {
    if (!result || result.safetyDistance == null) return '';
    return `Safety distance ≥ ${result.safetyDistance} mm`;
  },
};

export default iso13855;

/**
 * Coerce a possibly-stringified numeric input to a Number, defaulting to 0.
 * @param {unknown} v
 * @returns {number}
 */
function toNumber(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}
