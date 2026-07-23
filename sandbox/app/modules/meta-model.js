/**
 * Meta-model viewer.
 *
 * Renders a static, read-only view of the OpenConformity data model: the
 * artifact types and the relationships between them. Driven entirely from
 * `types.js` so it stays in sync with the live schema.
 *
 * Two sections in the modal:
 *   1. Types — every artifact type with its icon, id prefix, label field,
 *      and intrinsic fields.
 *   2. Relationships — every ref / ref-array / polymorphic-ref-array
 *      declared anywhere in the registry, listed as triples
 *      `(from-type, field, to-type)`.
 */

import { ArtifactTypes, ArtifactTypeKeys, humanizeFieldName } from './types.js';
import { openModal, modalButton } from './modals.js';
import { el } from './util.js';
import { typeIcon } from './icons.js';

export function openMetaModelModal() {
  const modal = openModal({ title: 'OpenConformity meta model', size: 'large' });

  modal.bodyEl.append(
    el('p', { class: 'modal-hint' }, [
      'The data model that the tool is built on. Driven from the type registry, so this view is always in sync with the running app.',
    ]),
    renderTypesSection(),
    renderRelationshipsSection()
  );

  modal.footerEl.append(
    el('span', { style: 'flex:1 1 auto' }),
    modalButton('Close', () => modal.close(), { primary: true })
  );
}

// --- Types section ----------------------------------------------------

function renderTypesSection() {
  const wrap = el('section', { class: 'meta-section' });
  wrap.append(el('h3', { class: 'meta-section-title' }, ['Artifact types']));

  const grid = el('div', { class: 'meta-types-grid' });
  for (const key of ArtifactTypeKeys) {
    const t = ArtifactTypes[key];
    const fields = Object.entries(t.fields);
    const intrinsic = fields
      .filter(([, f]) =>
        f.kind !== 'ref' && f.kind !== 'ref-array' && f.kind !== 'polymorphic-ref-array'
      )
      .map(([name]) => name);

    grid.append(
      el('div', { class: 'meta-type' }, [
        el('div', { class: 'meta-type-head' }, [
          el('span', { class: 'meta-type-icon' }, [typeIcon(key, { title: t.displayName })]),
          el('span', { class: 'meta-type-name' }, [t.displayName]),
        ]),
        el('dl', { class: 'meta-type-meta' }, [
          el('dt', {}, ['Plural']),  el('dd', {}, [t.displayNamePlural]),
          el('dt', {}, ['Id prefix']), el('dd', { class: 'meta-mono' }, [t.idPrefix + '-']),
          el('dt', {}, ['Label field']), el('dd', { class: 'meta-mono' }, [t.labelField]),
        ]),
        intrinsic.length > 0
          ? el('div', { class: 'meta-type-fields' }, [
              el('div', { class: 'meta-fields-title' }, ['Attributes']),
              el(
                'ul',
                { class: 'meta-fields-list' },
                intrinsic.map((n) =>
                  el('li', {}, [
                    el('span', { class: 'meta-mono' }, [n]),
                    ' — ',
                    humanizeFieldName(n).toLowerCase(),
                  ])
                )
              ),
            ])
          : '',
      ])
    );
  }
  wrap.append(grid);
  return wrap;
}

// --- Relationships section -------------------------------------------

function renderRelationshipsSection() {
  const wrap = el('section', { class: 'meta-section' });
  wrap.append(el('h3', { class: 'meta-section-title' }, ['Relationships']));

  const table = el('table', { class: 'meta-rel-table' });
  table.append(
    el('thead', {}, [
      el('tr', {}, [
        el('th', {}, ['From']),
        el('th', {}, ['Field']),
        el('th', {}, ['Cardinality']),
        el('th', {}, ['To']),
      ]),
    ])
  );
  const tbody = el('tbody', {});

  for (const fromKey of ArtifactTypeKeys) {
    const fromType = ArtifactTypes[fromKey];
    for (const [fieldName, field] of Object.entries(fromType.fields)) {
      if (field.kind === 'ref') {
        tbody.append(rel(fromType, fieldName, '0..1', [field.target]));
      } else if (field.kind === 'ref-array') {
        tbody.append(rel(fromType, fieldName, '0..*', [field.target]));
      } else if (field.kind === 'polymorphic-ref-array') {
        tbody.append(rel(fromType, fieldName, '0..*', field.targets));
      }
    }
  }
  table.append(tbody);
  wrap.append(table);
  return wrap;
}

/**
 * @param {import('./types.js').ArtifactType} fromType
 * @param {string} fieldName
 * @param {string} cardinality
 * @param {import('./types.js').ArtifactKey[]} toKeys
 */
function rel(fromType, fieldName, cardinality, toKeys) {
  const targetCells = [];
  toKeys
    .map((k) => /** @type {const} */ ([k, ArtifactTypes[k]]))
    .filter(([, t]) => t)
    .forEach(([k, t], idx) => {
      if (idx > 0) targetCells.push(el('span', { class: 'meta-rel-sep' }, [' | ']));
      targetCells.push(
        el('span', { class: 'meta-rel-target' }, [
          typeIcon(k, { title: t.displayName }),
          ' ' + t.displayName,
        ])
      );
    });

  return el('tr', {}, [
    el('td', {}, [
      el('span', { class: 'meta-rel-target' }, [
        typeIcon(fromType.key, { title: fromType.displayName }),
        ' ' + fromType.displayName,
      ]),
    ]),
    el('td', { class: 'meta-mono' }, [fieldName]),
    el('td', { class: 'meta-mono' }, [cardinality]),
    el('td', {}, targetCells),
  ]);
}
