/**
 * ISO 13857 — Safety distance to prevent reaching through regular openings.
 *
 * Looks up the minimum distance "sr" between the danger zone and a
 * protective structure with regular openings (slot / square / round),
 * given the maximum opening dimension "e".
 *
 * Bands are paraphrased from ISO 13857:2019 Table 4 (adults). Numerical
 * values are illustrative and must be verified against the current
 * standard text — the exact thresholds and special cases (children,
 * ergonomic factors, irregular openings) are not modelled here.
 *
 * Other reach scenarios in ISO 13857 (upward, over protective structures,
 * around structures) are out of scope for v1; they can be added as
 * additional calculators later.
 */

/** @typedef {import('./index.js').Calculator} Calculator */

/**
 * Each row covers e values up to (and including) `eMax`. The first row whose
 * eMax matches is selected. e > 120 is considered "full body access" and the
 * calculator surfaces a warning rather than a numeric distance.
 */
const TABLE = {
  slot: [
    { eMax: 4,   sr: 2 },
    { eMax: 6,   sr: 10 },
    { eMax: 8,   sr: 20 },
    { eMax: 10,  sr: 80 },
    { eMax: 12,  sr: 100 },
    { eMax: 20,  sr: 120 },
    { eMax: 30,  sr: 850 },
    { eMax: 40,  sr: 850 },
    { eMax: 120, sr: 850 },
  ],
  square: [
    { eMax: 4,   sr: 2 },
    { eMax: 6,   sr: 5 },
    { eMax: 8,   sr: 15 },
    { eMax: 10,  sr: 25 },
    { eMax: 12,  sr: 80 },
    { eMax: 20,  sr: 120 },
    { eMax: 30,  sr: 120 },
    { eMax: 40,  sr: 200 },
    { eMax: 120, sr: 850 },
  ],
  round: [
    { eMax: 4,   sr: 2 },
    { eMax: 6,   sr: 5 },
    { eMax: 8,   sr: 5 },
    { eMax: 10,  sr: 15 },
    { eMax: 12,  sr: 25 },
    { eMax: 20,  sr: 120 },
    { eMax: 30,  sr: 120 },
    { eMax: 40,  sr: 120 },
    { eMax: 120, sr: 850 },
  ],
};

/** @type {Calculator} */
const iso13857 = {
  id: 'iso-13857',
  name: 'ISO 13857 — Safety distance through regular openings',
  standardVersion: 'ISO 13857:2019 (Table 4 — adults)',
  description:
    'Minimum distance between a danger zone and a protective structure with regular slot / square / round openings.',
  disclaimer:
    'Values are paraphrased from ISO 13857:2019 Table 4 for adults. The standard contains additional rules for children, irregular openings, and other reach scenarios — verify against the current text for your application.',
  fields: [
    {
      name: 'openingType',
      label: 'Opening shape',
      type: 'enum',
      options: [
        { value: 'slot',   label: 'Slot' },
        { value: 'square', label: 'Square' },
        { value: 'round',  label: 'Round' },
      ],
      default: 'slot',
    },
    {
      name: 'openingDimension',
      label: 'Maximum opening dimension e',
      unit: 'mm',
      type: 'number',
      default: 10,
      hint: 'Width for a slot; side length for a square; diameter for a round opening.',
    },
  ],
  compute(inputs) {
    const shape = (inputs.openingType ?? 'slot') in TABLE ? inputs.openingType : 'slot';
    const e = toNumber(inputs.openingDimension);

    if (e <= 0) {
      return {
        safetyDistance: null,
        note: 'Enter a positive opening dimension.',
      };
    }
    if (e > 120) {
      return {
        safetyDistance: null,
        note: 'Opening exceeds 120 mm — full body access. A regular-openings approach is not appropriate; consider physical guarding or a different safeguard.',
      };
    }

    const rows = TABLE[/** @type {keyof typeof TABLE} */ (shape)];
    const row = rows.find((r) => e <= r.eMax);
    if (!row) {
      return { safetyDistance: null, note: 'No matching band; verify against the standard.' };
    }

    return {
      safetyDistance: row.sr,
      note: `For e ≤ ${row.eMax} mm (${shape}): minimum distance ${row.sr} mm.`,
    };
  },
  summarize(inputs, result) {
    if (!result || result.safetyDistance == null) {
      return result?.note ? String(result.note) : '';
    }
    return `Safety distance ≥ ${result.safetyDistance} mm`;
  },
};

export default iso13857;

function toNumber(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}
