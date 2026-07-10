import { useEffect, useState, useRef } from 'react';
import {
  Database, Download, Upload, Shield, CheckCircle, AlertCircle,
  Loader, Info, RefreshCw, ChevronDown, ChevronUp, FileJson,
  RotateCcw, Eye,
} from 'lucide-react';
import {
  fetchTableStats, buildBackup, downloadBackup, validateBackupFile,
  restoreBackup, totalRows, BACKUP_TABLES,
  type TableStats, type BackupPackage, type RestoreResult, type BackupTableName,
} from '../lib/backupService';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'export' | 'restore';
type RestoreMode = 'merge' | 'replace';

export function Backup() {
  const { isAdmin, user } = useAuth();
  const [tab, setTab] = useState<Tab>('export');

  // Export state
  const [stats, setStats] = useState<TableStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<BackupTableName>>(
    new Set(BACKUP_TABLES.map((t) => t.name))
  );
  const [backupLabel, setBackupLabel] = useState(`Sauvegarde ${new Date().toLocaleDateString('fr-FR')}`);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportDone, setExportDone] = useState<{ label: string; rows: number } | null>(null);
  const [showTableList, setShowTableList] = useState(false);

  // Restore state
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [parsedPkg, setParsedPkg] = useState<BackupPackage | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [restoreSelected, setRestoreSelected] = useState<Set<BackupTableName>>(new Set());
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('merge');
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [showRestoreDetails, setShowRestoreDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const s = await fetchTableStats();
      setStats(s);
    } finally {
      setStatsLoading(false);
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────

  const toggleTable = (name: BackupTableName) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    setExportDone(null);
    try {
      const pkg = await buildBackup(Array.from(selected) as BackupTableName[], backupLabel);
      downloadBackup(pkg);
      setExportDone({ label: backupLabel, rows: totalRows(pkg.stats) });
    } catch (e: any) {
      setExportError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setExporting(false);
    }
  };

  // ── Restore ───────────────────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setRestoreFile(f);
    setParsedPkg(null);
    setParseError(null);
    setRestoreResult(null);
    setRestoreSelected(new Set());

    try {
      const raw = JSON.parse(await f.text());
      const validation = validateBackupFile(raw);
      if (!validation.valid) { setParseError(validation.error!); return; }
      const pkg = validation.pkg!;
      setParsedPkg(pkg);
      // Pre-select tables that exist in this backup
      const available = Object.keys(pkg.tables).filter(
        (k) => (pkg.tables[k] as unknown[]).length > 0
      ) as BackupTableName[];
      setRestoreSelected(new Set(available));
    } catch {
      setParseError('Fichier JSON invalide ou corrompu.');
    }
  };

  const handleRestore = async () => {
    if (!parsedPkg || !user) return;
    if (!confirm('Confirmer la restauration ? Les données existantes peuvent être modifiées selon le mode choisi.')) return;
    setRestoring(true);
    setRestoreResult(null);
    try {
      const result = await restoreBackup(parsedPkg, {
        selectedTables: Array.from(restoreSelected) as BackupTableName[],
        mode: restoreMode,
        agentId: user.id,
      });
      setRestoreResult(result);
    } catch (e: any) {
      setRestoreResult({ restored: {}, skipped: {}, errors: [e.message] });
    } finally {
      setRestoring(false);
    }
  };

  const totalSelectedRows = stats
    .filter((s) => selected.has(s.name))
    .reduce((n, s) => n + s.count, 0);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès refusé</h2>
          <p className="text-slate-600">Réservé aux administrateurs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-slate-700" />
            Sauvegarde & Restauration
          </h1>
          <p className="text-slate-500 mt-1">Exportez ou restaurez l'intégralité de la base de données</p>
        </div>
        <button
          onClick={loadStats}
          disabled={statsLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition border border-slate-200"
        >
          <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([['export', 'Sauvegarder', Download], ['restore', 'Restaurer', RotateCcw]] as const).map(
          ([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )
        )}
      </div>

      {/* ── EXPORT TAB ── */}
      {tab === 'export' && (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Sauvegarde complète de la base</p>
              <p>Exporte toutes les tables sélectionnées dans un fichier JSON horodaté. Les mots de passe et données d'authentification ne sont jamais exportés.</p>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {statsLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
                    <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-6 bg-slate-100 rounded w-1/2" />
                  </div>
                ))
              : stats.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => toggleTable(s.name)}
                    className={`relative text-left bg-white border-2 rounded-xl p-4 transition ${
                      selected.has(s.name)
                        ? 'border-slate-900 ring-1 ring-slate-900/10'
                        : 'border-slate-200 opacity-50 hover:opacity-70'
                    }`}
                  >
                    {selected.has(s.name) && (
                      <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-slate-900" />
                    )}
                    <p className="text-xs text-slate-500 mb-1 pr-5 leading-tight">{s.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{s.count.toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">enregistrement{s.count !== 1 ? 's' : ''}</p>
                  </button>
                ))}
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            <span>
              <strong>{selected.size}</strong> table{selected.size !== 1 ? 's' : ''} sélectionnée{selected.size !== 1 ? 's' : ''} —{' '}
              <strong>{totalSelectedRows.toLocaleString('fr-FR')}</strong> ligne{totalSelectedRows !== 1 ? 's' : ''} au total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelected(new Set(BACKUP_TABLES.map((t) => t.name)))}
                className="text-xs text-blue-600 hover:underline"
              >
                Tout sélectionner
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-slate-500 hover:underline"
              >
                Désélectionner
              </button>
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nom de la sauvegarde
            </label>
            <input
              type="text"
              value={backupLabel}
              onChange={(e) => setBackupLabel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
              placeholder="Ex : Sauvegarde mensuelle juin 2026"
            />
          </div>

          {exportError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{exportError}</p>
            </div>
          )}

          {exportDone && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold">Sauvegarde téléchargée avec succès</p>
                <p className="mt-0.5">{exportDone.rows.toLocaleString('fr-FR')} lignes exportées — "{exportDone.label}"</p>
              </div>
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={exporting || selected.size === 0}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-lg shadow-slate-900/10"
          >
            {exporting ? (
              <><Loader className="w-5 h-5 animate-spin" /> Sauvegarde en cours...</>
            ) : (
              <><Download className="w-5 h-5" /> Télécharger la sauvegarde</>
            )}
          </button>
        </div>
      )}

      {/* ── RESTORE TAB ── */}
      {tab === 'restore' && (
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Attention — opération sensible</p>
              <p>La restauration injecte des données dans la base. Choisissez le mode <strong>Fusionner</strong> pour n'ajouter que les enregistrements manquants, ou <strong>Écraser</strong> pour remplacer les données existantes via upsert.</p>
            </div>
          </div>

          {/* File drop */}
          <div
            className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center cursor-pointer hover:border-slate-400 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
            {restoreFile ? (
              <div className="space-y-2">
                <FileJson className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="font-medium text-slate-900">{restoreFile.name}</p>
                <p className="text-xs text-blue-600 hover:text-blue-700">Choisir un autre fichier</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-blue-600">Sélectionnez</span> ou glissez un fichier de sauvegarde .json
                </p>
              </div>
            )}
          </div>

          {parseError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{parseError}</p>
            </div>
          )}

          {parsedPkg && !parseError && (
            <>
              {/* Backup info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{parsedPkg.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Créé le {new Date(parsedPkg.created_at).toLocaleString('fr-FR')} —{' '}
                      {totalRows(parsedPkg.stats).toLocaleString('fr-FR')} lignes au total
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTableList(!showTableList)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                  >
                    <Eye className="w-4 h-4" />
                    Détail
                    {showTableList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {showTableList && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    {BACKUP_TABLES.map((t) => {
                      const count = parsedPkg.stats[t.name] ?? 0;
                      const available = count > 0;
                      return (
                        <label
                          key={t.name}
                          className={`flex items-center gap-2 text-sm cursor-pointer ${!available ? 'opacity-40' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={restoreSelected.has(t.name)}
                            disabled={!available}
                            onChange={() => {
                              setRestoreSelected((prev) => {
                                const next = new Set(prev);
                                next.has(t.name) ? next.delete(t.name) : next.add(t.name);
                                return next;
                              });
                            }}
                            className="accent-slate-900"
                          />
                          <span className="text-slate-700">{t.label}</span>
                          <span className="ml-auto text-xs text-slate-400">{count.toLocaleString('fr-FR')}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Restore mode */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Mode de restauration</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    ['merge', 'Fusionner', 'Ajoute uniquement les enregistrements absents (ID non existant). Aucune donnée existante n\'est modifiée.'],
                    ['replace', 'Écraser', 'Upsert sur toutes les lignes : crée ou remplace selon l\'ID. Les enregistrements existants sont mis à jour.'],
                  ] as const).map(([id, label, desc]) => (
                    <label
                      key={id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                        restoreMode === id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === id}
                        onChange={() => setRestoreMode(id)}
                        className="mt-0.5 accent-slate-900"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRestore}
                disabled={restoring || restoreSelected.size === 0}
                className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-lg shadow-amber-600/20"
              >
                {restoring ? (
                  <><Loader className="w-5 h-5 animate-spin" /> Restauration en cours...</>
                ) : (
                  <><RotateCcw className="w-5 h-5" /> Lancer la restauration</>
                )}
              </button>
            </>
          )}

          {/* Restore result */}
          {restoreResult && (
            <div className={`border rounded-xl p-5 space-y-3 ${restoreResult.errors.length === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {restoreResult.errors.length === 0
                    ? <CheckCircle className="w-5 h-5 text-green-600" />
                    : <AlertCircle className="w-5 h-5 text-amber-600" />}
                  <p className={`font-semibold text-sm ${restoreResult.errors.length === 0 ? 'text-green-800' : 'text-amber-800'}`}>
                    Restauration terminée
                  </p>
                </div>
                <button
                  onClick={() => setShowRestoreDetails(!showRestoreDetails)}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  Détail {showRestoreDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {showRestoreDetails && (
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 border-t border-slate-200 pt-3">
                  {BACKUP_TABLES.map((t) => {
                    const r = restoreResult.restored[t.name];
                    const s = restoreResult.skipped[t.name];
                    if (r === undefined && s === undefined) return null;
                    return (
                      <div key={t.name} className="flex justify-between bg-white rounded-lg px-3 py-2 border border-slate-100">
                        <span className="text-slate-600">{t.label}</span>
                        <span>
                          <span className="text-green-700 font-medium">{r ?? 0} ajoutés</span>
                          {(s ?? 0) > 0 && <span className="text-slate-400 ml-1">/ {s} ignorés</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {restoreResult.errors.length > 0 && (
                <div className="border-t border-amber-200 pt-3 max-h-40 overflow-y-auto space-y-1">
                  {restoreResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-700 font-mono">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
