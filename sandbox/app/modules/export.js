/**
 * CSV export, scoped to a single project.
 *
 * Two flavours of export:
 *   - One CSV per artifact type, with columns matching the field list in
 *     types.js. Array fields are joined with `|`. Object fields are
 *     JSON-stringified. Missing values appear as empty cells.
 *   - A flat relationships CSV: one row per (fromType, fromId, fieldName,
 *     toType, toId) edge, derived from the same field declarations the
 *     trace pane uses.
 *
 * The CSV writer is RFC 4180-compliant: cells containing commas, quotes,
 * or newlines are wrapped in quotes; inner quotes are doubled. Newlines
 * between rows are CRLF as the spec recommends — Excel and Numbers both
 * accept it cleanly.
 *
 * Exports are *per-project*. Callers pass a projectId; menu actions fall
 * back to the active project.
 */

import * as state from './state.js';
import { ArtifactTypes, ArtifactTypeKeys } from './types.js';
import { triggerDownload } from './persistence.js';

const ROW_SEP = '\r\n';

function resolveProjectId(projectId) {
  return projectId ?? state.getActiveProjectId();
}

function projectFilenamePrefix(projectId) {
  const project = state.getProject(projectId);
  if (!project) return '';
  return slugify(project.meta.name || 'project') + '_';
}

function slugify(s) {
  return (
    String(s)
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 64) || 'project'
  );
}

/**
 * Trigger a download of one artifact type's CSV from a project.
 * @param {string} projectId
 * @param {import('./types.js').ArtifactKey} typeKey
 */
export function downloadTypeCsv(projectId, typeKey) {
  const pid = resolveProjectId(projectId);
  if (!pid) return;
  const csv = buildTypeCsv(pid, typeKey);
  if (csv === null) return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, `${projectFilenamePrefix(pid)}${ArtifactTypes[typeKey].storageKey}.csv`);
}

/**
 * Trigger a download of the relationships CSV for a project.
 * @param {string} [projectId]
 */
export function downloadRelationshipsCsv(projectId) {
  const pid = resolveProjectId(projectId);
  if (!pid) return;
  const csv = buildRelationshipsCsv(pid);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, `${projectFilenamePrefix(pid)}relationships.csv`);
}

/**
 * Trigger downloads for every artifact type plus the relationships CSV
 * for one project.
 * @param {string} [projectId]
 */
export function downloadAllCsvs(projectId) {
  const pid = resolveProjectId(projectId);
  if (!pid) return;
  for (const key of ArtifactTypeKeys) {
    downloadTypeCsv(pid, key);
  }
  downloadRelationshipsCsv(pid);
}

/**
 * Build a CSV for one artifact type within a project.
 * @param {string} projectId
 * @param {import('./types.js').ArtifactKey} typeKey
 * @returns {string}
 */
export function buildTypeCsv(projectId, typeKey) {
  const type = ArtifactTypes[typeKey];
  const fieldNames = Object.keys(type.fields);
  const header = ['id', ...fieldNames, 'createdAt', 'updatedAt'];
  const rows = [header.map(encodeCell).join(',')];

  for (const a of state.getByType(projectId, typeKey)) {
    const cells = [
      encodeCell(a.id),
      ...fieldNames.map((name) => encodeCell(formatCell(a[name], type.fields[name]))),
      encodeCell(a.createdAt ?? ''),
      encodeCell(a.updatedAt ?? ''),
    ];
    rows.push(cells.join(','));
  }
  return rows.join(ROW_SEP) + ROW_SEP;
}

/**
 * Build the relationships CSV for one project.
 * @param {string} projectId
 * @returns {string}
 */
export function buildRelationshipsCsv(projectId) {
  const header = ['fromType', 'fromId', 'fieldName', 'toType', 'toId'];
  const rows = [header.map(encodeCell).join(',')];

  for (const fromType of ArtifactTypeKeys) {
    const def = ArtifactTypes[fromType];
    for (const a of state.getByType(projectId, fromType)) {
      for (const [name, field] of Object.entries(def.fields)) {
        const v = a[name];
        if (field.kind === 'ref' && typeof v === 'string' && v) {
          rows.push(rowFor(fromType, a.id, name, field.target, v));
        } else if (field.kind === 'ref-array' && Array.isArray(v)) {
          for (const id of v) {
            if (typeof id === 'string' && id) {
              rows.push(rowFor(fromType, a.id, name, field.target, id));
            }
          }
        } else if (field.kind === 'polymorphic-ref-array' && Array.isArray(v)) {
          for (const r of v) {
            if (r && typeof r === 'object' && typeof r.id === 'string' && typeof r.type === 'string') {
              rows.push(rowFor(fromType, a.id, name, r.type, r.id));
            }
          }
        }
      }
    }
  }
  return rows.join(ROW_SEP) + ROW_SEP;
}

function rowFor(fromType, fromId, fieldName, toType, toId) {
  return [fromType, fromId, fieldName, toType, toId].map(encodeCell).join(',');
}

function formatCell(value, field) {
  if (value == null) return '';
  if (field.kind === 'ref-array') {
    return Array.isArray(value) ? value.join('|') : '';
  }
  if (field.kind === 'polymorphic-ref-array') {
    if (!Array.isArray(value)) return '';
    return value
      .filter((r) => r && typeof r === 'object' && r.id)
      .map((r) => `${r.type}:${r.id}`)
      .join('|');
  }
  if (field.kind === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value);
}

function encodeCell(cell) {
  const s = cell == null ? '' : String(cell);
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replaceAll('"', '""') + '"';
  }
  return s;
}
