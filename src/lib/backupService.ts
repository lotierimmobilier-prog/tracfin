import { supabase } from './supabase';

export const BACKUP_VERSION = '2.0';
export const BACKUP_SOURCE = 'tracfin-kyc-full';

// All tables included in a full backup, in dependency order for restore
export const BACKUP_TABLES = [
  { name: 'users',                     label: 'Utilisateurs',              restoreVia: 'edge_function' },
  { name: 'agency_settings',           label: 'Paramètres agence',         restoreVia: 'supabase' },
  { name: 'page_permissions',          label: 'Permissions pages',         restoreVia: 'supabase' },
  { name: 'clients',                   label: 'Clients KYC',               restoreVia: 'supabase' },
  { name: 'beneficial_owners',         label: 'Bénéficiaires effectifs',   restoreVia: 'supabase' },
  { name: 'transactions',              label: 'Transactions',              restoreVia: 'supabase' },
  { name: 'transaction_risk_answers',  label: 'Réponses questionnaire',    restoreVia: 'supabase' },
  { name: 'compliance_dossiers',       label: 'Dossiers conformité',       restoreVia: 'supabase' },
  { name: 'alerts',                    label: 'Alertes',                   restoreVia: 'supabase' },
  { name: 'tracfin_declarations',      label: 'Déclarations TRACFIN',      restoreVia: 'supabase' },
  { name: 'tracfin_internal_register', label: 'Registre interne TRACFIN',  restoreVia: 'supabase' },
  { name: 'suspicion_reports',         label: 'Rapports de suspicion',     restoreVia: 'supabase' },
  { name: 'risk_assessments',          label: 'Évaluations de risque',     restoreVia: 'supabase' },
  { name: 'training_attestations',     label: 'Attestations formation',    restoreVia: 'supabase' },
  { name: 'flashcards_progress',       label: 'Progression flashcards',    restoreVia: 'supabase' },
  { name: 'signatures',                label: 'Signatures',                restoreVia: 'supabase' },
  { name: 'documents',                 label: 'Documents (métadonnées)',   restoreVia: 'supabase' },
  { name: 'audit_logs',                label: 'Journaux d\'audit',         restoreVia: 'supabase' },
] as const;

export type BackupTableName = (typeof BACKUP_TABLES)[number]['name'];

export interface TableStats {
  name: BackupTableName;
  label: string;
  count: number;
  included: boolean;
}

export interface BackupPackage {
  version: typeof BACKUP_VERSION;
  source: typeof BACKUP_SOURCE;
  created_at: string;
  label: string;
  tables: Record<string, unknown[]>;
  stats: Record<string, number>;
}

export interface BackupRecord {
  id: string;
  created_at: string;
  label: string;
  stats: Record<string, number>;
  total_rows: number;
}

// ── Build ────────────────────────────────────────────────────────────────────

export async function fetchTableStats(): Promise<TableStats[]> {
  const results: TableStats[] = [];
  for (const t of BACKUP_TABLES) {
    try {
      const { count } = await supabase
        .from(t.name)
        .select('*', { count: 'exact', head: true });
      results.push({ name: t.name, label: t.label, count: count ?? 0, included: true });
    } catch {
      results.push({ name: t.name, label: t.label, count: 0, included: false });
    }
  }
  return results;
}

export async function buildBackup(
  selectedTables: BackupTableName[],
  label: string
): Promise<BackupPackage> {
  const tables: Record<string, unknown[]> = {};
  const stats: Record<string, number> = {};

  for (const t of BACKUP_TABLES) {
    if (!selectedTables.includes(t.name)) continue;

    // users: export profile data only (no auth credentials)
    if (t.name === 'users') {
      const { data, error } = await supabase
        .from('users')
        .select('id,email,full_name,first_name,last_name,phone,rcs_number,rcs_city,role,created_at');
      if (error) throw new Error(`Erreur export ${t.name}: ${error.message}`);
      tables[t.name] = data ?? [];
      stats[t.name] = (data ?? []).length;
      continue;
    }

    const { data, error } = await supabase.from(t.name).select('*');
    if (error) throw new Error(`Erreur export ${t.name}: ${error.message}`);
    tables[t.name] = data ?? [];
    stats[t.name] = (data ?? []).length;
  }

  return {
    version: BACKUP_VERSION,
    source: BACKUP_SOURCE,
    created_at: new Date().toISOString(),
    label,
    tables,
    stats,
  };
}

export function downloadBackup(pkg: BackupPackage) {
  const date = new Date(pkg.created_at).toISOString().slice(0, 10);
  const slug = pkg.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `backup_tracfin_${slug}_${date}.json`;
  const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function totalRows(stats: Record<string, number>): number {
  return Object.values(stats).reduce((s, n) => s + n, 0);
}

// ── Validate ──────────────────────────────────────────────────────────────────

export function validateBackupFile(raw: unknown): { valid: boolean; error?: string; pkg?: BackupPackage } {
  if (!raw || typeof raw !== 'object') return { valid: false, error: 'Fichier JSON invalide.' };
  const obj = raw as Record<string, unknown>;
  if (obj.source !== BACKUP_SOURCE)
    return { valid: false, error: `Source incorrecte: attendu "${BACKUP_SOURCE}", reçu "${obj.source}".` };
  if (obj.version !== BACKUP_VERSION)
    return { valid: false, error: `Version incorrecte: attendu "${BACKUP_VERSION}", reçu "${obj.version}". Utilisez un fichier de sauvegarde récent.` };
  if (!obj.tables || typeof obj.tables !== 'object')
    return { valid: false, error: 'Structure de sauvegarde invalide (tables manquantes).' };
  return { valid: true, pkg: obj as unknown as BackupPackage };
}

// ── Restore ───────────────────────────────────────────────────────────────────

export interface RestoreResult {
  restored: Record<string, number>;
  skipped: Record<string, number>;
  errors: string[];
}

// Tables that reference users.id (agent_id / created_by / etc.)
// On restore we skip re-creating user auth accounts; existing ids must match.
const TABLES_RESTORE_ORDER: BackupTableName[] = [
  'agency_settings',
  'page_permissions',
  'clients',
  'beneficial_owners',
  'transactions',
  'transaction_risk_answers',
  'compliance_dossiers',
  'alerts',
  'tracfin_declarations',
  'tracfin_internal_register',
  'suspicion_reports',
  'risk_assessments',
  'training_attestations',
  'flashcards_progress',
  'signatures',
  'documents',
  'audit_logs',
];

export async function restoreBackup(
  pkg: BackupPackage,
  options: {
    selectedTables: BackupTableName[];
    mode: 'merge' | 'replace'; // merge = skip existing ids, replace = upsert
    agentId: string;
  }
): Promise<RestoreResult> {
  const { selectedTables, mode, agentId } = options;
  const result: RestoreResult = { restored: {}, skipped: {}, errors: [] };

  // users table: profile-only upsert (does not create auth accounts)
  if (selectedTables.includes('users') && pkg.tables['users']) {
    const rows = pkg.tables['users'] as Record<string, unknown>[];
    let ok = 0;
    let skip = 0;
    for (const row of rows) {
      const { id, ...fields } = row as { id: string; [k: string]: unknown };
      if (!id) { skip++; continue; }
      if (mode === 'merge') {
        const { data: existing } = await supabase.from('users').select('id').eq('id', id).maybeSingle();
        if (existing) { skip++; continue; }
      }
      const { error } = await supabase.from('users').upsert({ id, ...fields });
      if (error) result.errors.push(`users[${id}]: ${error.message}`);
      else ok++;
    }
    result.restored['users'] = ok;
    result.skipped['users'] = skip;
  }

  for (const tableName of TABLES_RESTORE_ORDER) {
    if (!selectedTables.includes(tableName)) continue;
    const rows = pkg.tables[tableName] as Record<string, unknown>[] | undefined;
    if (!rows || rows.length === 0) {
      result.restored[tableName] = 0;
      result.skipped[tableName] = 0;
      continue;
    }

    let ok = 0;
    let skip = 0;

    for (const row of rows) {
      const rowWithAgent = {
        ...row,
        // stamp agent on records that support it
        ...(('created_by' in row && !row.created_by) ? { created_by: agentId } : {}),
      };

      if (mode === 'merge') {
        const { id } = row as { id?: string };
        if (id) {
          const { data: existing } = await supabase
            .from(tableName)
            .select('id')
            .eq('id', id)
            .maybeSingle();
          if (existing) { skip++; continue; }
        }
      }

      const { error } = await supabase.from(tableName).upsert(rowWithAgent as never);
      if (error) {
        result.errors.push(`${tableName}: ${error.message}`);
      } else {
        ok++;
      }
    }

    result.restored[tableName] = ok;
    result.skipped[tableName] = skip;
  }

  return result;
}
