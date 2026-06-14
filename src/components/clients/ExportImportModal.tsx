import { useState, useRef } from 'react';
import {
  X, Download, Upload, FileJson, CheckCircle, AlertCircle,
  Users, ArrowLeftRight, Package, Loader, Info, UserCog, Eye, EyeOff,
} from 'lucide-react';
import {
  buildExportPackage, downloadJson, importPackage,
  type ExportScope, type ExportPackage, type ImportResult,
} from '../../lib/exportService';
import { useAuth } from '../../contexts/AuthContext';

interface ExportImportModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
  defaultTab?: 'export' | 'import';
}

export function ExportImportModal({ onClose, onImportSuccess, defaultTab = 'export' }: ExportImportModalProps) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<'export' | 'import'>(defaultTab);

  // Export state
  const [exportScope, setExportScope] = useState<ExportScope>('both');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportedCounts, setExportedCounts] = useState<{ users?: number; clients?: number; transactions?: number } | null>(null);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedPkg, setParsedPkg] = useState<ExportPackage | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [tempPassword, setTempPassword] = useState('Tracfin2025!');
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    setExportedCounts(null);
    try {
      const pkg = await buildExportPackage(exportScope);
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(pkg, `tracfin-export-${exportScope}-${date}.json`);
      setExportedCounts({
        users: pkg.users?.length,
        clients: pkg.clients?.length,
        transactions: pkg.transactions?.length,
      });
    } catch (e: any) {
      setExportError(e.message || 'Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  // ── Import ────────────────────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImportFile(f);
    setParsedPkg(null);
    setParseError(null);
    setImportResult(null);

    try {
      const text = await f.text();
      const pkg = JSON.parse(text) as ExportPackage;
      if (pkg.source !== 'tracfin-kyc' || pkg.version !== '1.0') {
        setParseError('Ce fichier ne semble pas être un export TracFin KYC valide (source ou version incorrecte).');
        return;
      }
      setParsedPkg(pkg);
    } catch {
      setParseError('Impossible de lire le fichier. Assurez-vous qu\'il s\'agit d\'un fichier JSON valide.');
    }
  };

  const handleImport = async () => {
    if (!parsedPkg || !user) return;
    setImporting(true);
    setImportResult(null);
    try {
      const adminEmail = profile?.email || user.email || '';
      const result = await importPackage(parsedPkg, user.id, tempPassword, adminEmail);
      setImportResult(result);
      if (
        result.clients_imported > 0 ||
        result.transactions_imported > 0 ||
        result.users_imported > 0
      ) {
        onImportSuccess();
      }
    } catch (e: any) {
      setImportResult({
        users_imported: 0,
        users_skipped: 0,
        clients_imported: 0,
        clients_skipped: 0,
        beneficial_owners_imported: 0,
        transactions_imported: 0,
        errors: [e.message || 'Erreur inattendue lors de l\'import'],
      });
    } finally {
      setImporting(false);
    }
  };

  const hasUsers = parsedPkg?.users && parsedPkg.users.length > 0;

  const scopeOptions: { value: ExportScope; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      value: 'both',
      label: 'Clients + Transactions',
      icon: <Package className="w-5 h-5" />,
      desc: 'Exporte les deux tables avec les bénéficiaires effectifs',
    },
    {
      value: 'clients',
      label: 'Clients uniquement',
      icon: <Users className="w-5 h-5" />,
      desc: 'Clients KYC et leurs bénéficiaires effectifs',
    },
    {
      value: 'transactions',
      label: 'Transactions uniquement',
      icon: <ArrowLeftRight className="w-5 h-5" />,
      desc: 'Toutes les transactions immobilières',
    },
    {
      value: 'users',
      label: 'Utilisateurs (agents)',
      icon: <UserCog className="w-5 h-5" />,
      desc: 'Profils des agents et responsables (sans mot de passe)',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Export / Import des données</h2>
            <p className="text-sm text-slate-500 mt-0.5">Format compatible entre sites TracFin KYC</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {(['export', 'import'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition capitalize ${
                tab === t
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'export' ? <Download className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {t === 'export' ? 'Exporter' : 'Importer'}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* ── EXPORT TAB ── */}
          {tab === 'export' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Le fichier exporté est au format <strong>JSON</strong> et peut être importé
                  directement sur tout autre site TracFin KYC utilisant la même base de données.
                  Les brouillons non finalisés sont exclus. Les mots de passe ne sont jamais exportés.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Sélectionner les données à exporter</p>
                <div className="space-y-2">
                  {scopeOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                        exportScope === opt.value
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportScope"
                        value={opt.value}
                        checked={exportScope === opt.value}
                        onChange={() => setExportScope(opt.value)}
                        className="sr-only"
                      />
                      <div className={`${exportScope === opt.value ? 'text-slate-900' : 'text-slate-400'}`}>
                        {opt.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${exportScope === opt.value ? 'text-slate-900' : 'text-slate-700'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        exportScope === opt.value ? 'border-slate-900' : 'border-slate-300'
                      }`}>
                        {exportScope === opt.value && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {exportError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{exportError}</p>
                </div>
              )}

              {exportedCounts && (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold mb-1">Fichier exporté avec succès</p>
                    {(exportedCounts.users ?? 0) > 0 && <p>{exportedCounts.users} utilisateur(s) exporté(s)</p>}
                    {(exportedCounts.clients ?? 0) > 0 && <p>{exportedCounts.clients} client(s) exporté(s)</p>}
                    {(exportedCounts.transactions ?? 0) > 0 && <p>{exportedCounts.transactions} transaction(s) exportée(s)</p>}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── IMPORT TAB ── */}
          {tab === 'import' && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Importez un fichier <strong>.json</strong> exporté depuis un autre site TracFin KYC.
                  Les données sont <strong>ajoutées</strong> sans supprimer l'existant.
                  Pour les utilisateurs, un mot de passe temporaire sera assigné — ils pourront le modifier à leur première connexion.
                </p>
              </div>

              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {importFile ? (
                  <div className="space-y-2">
                    <FileJson className="w-10 h-10 text-slate-700 mx-auto" />
                    <p className="font-medium text-slate-900">{importFile.name}</p>
                    <p className="text-xs text-blue-600 hover:text-blue-700">Choisir un autre fichier</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileJson className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-blue-600">Sélectionnez</span> ou glissez un fichier JSON
                    </p>
                  </div>
                )}
              </div>

              {parseError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{parseError}</p>
                </div>
              )}

              {parsedPkg && !parseError && (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1">
                    <p className="text-sm font-medium text-slate-700">Contenu du fichier</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {parsedPkg.users && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <UserCog className="w-4 h-4 text-slate-400" />
                          <span><strong>{parsedPkg.users.length}</strong> utilisateur(s)</span>
                        </div>
                      )}
                      {parsedPkg.clients && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span><strong>{parsedPkg.clients.length}</strong> client(s)</span>
                        </div>
                      )}
                      {parsedPkg.beneficial_owners && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span><strong>{parsedPkg.beneficial_owners.length}</strong> bénéficiaire(s) effectif(s)</span>
                        </div>
                      )}
                      {parsedPkg.transactions && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                          <span><strong>{parsedPkg.transactions.length}</strong> transaction(s)</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        Exporté le {new Date(parsedPkg.exported_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  {hasUsers && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Mot de passe temporaire pour les nouveaux utilisateurs
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={tempPassword}
                          onChange={(e) => setTempPassword(e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                          placeholder="Mot de passe temporaire"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Les utilisateurs importés recevront ce mot de passe et devront le modifier à leur première connexion.
                      </p>
                    </div>
                  )}
                </>
              )}

              {importResult && (
                <div className={`border rounded-lg p-4 space-y-2 ${importResult.errors.length === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2">
                    {importResult.errors.length === 0
                      ? <CheckCircle className="w-5 h-5 text-green-600" />
                      : <AlertCircle className="w-5 h-5 text-amber-600" />}
                    <p className={`text-sm font-semibold ${importResult.errors.length === 0 ? 'text-green-800' : 'text-amber-800'}`}>
                      Import terminé
                    </p>
                  </div>
                  <ul className="text-sm text-slate-700 space-y-0.5 ml-7">
                    {importResult.users_imported > 0 && <li>{importResult.users_imported} utilisateur(s) importé(s)</li>}
                    {importResult.users_skipped > 0 && <li className="text-red-700">{importResult.users_skipped} utilisateur(s) ignoré(s) (erreur)</li>}
                    {importResult.clients_imported > 0 && <li>{importResult.clients_imported} client(s) importé(s)</li>}
                    {importResult.clients_skipped > 0 && <li className="text-red-700">{importResult.clients_skipped} client(s) ignoré(s) (erreur)</li>}
                    {importResult.beneficial_owners_imported > 0 && <li>{importResult.beneficial_owners_imported} bénéficiaire(s) effectif(s) importé(s)</li>}
                    {importResult.transactions_imported > 0 && <li>{importResult.transactions_imported} transaction(s) importée(s)</li>}
                  </ul>
                  {importResult.errors.length > 0 && (
                    <div className="ml-7 mt-2 max-h-32 overflow-y-auto space-y-1">
                      {importResult.errors.map((e, i) => (
                        <p key={i} className="text-xs text-red-700">{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-sm"
          >
            Fermer
          </button>
          {tab === 'export' && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
            >
              {exporting ? (
                <><Loader className="w-4 h-4 animate-spin" /> Export en cours...</>
              ) : (
                <><Download className="w-4 h-4" /> Télécharger le fichier</>
              )}
            </button>
          )}
          {tab === 'import' && (
            <button
              onClick={handleImport}
              disabled={!parsedPkg || importing || !!parseError}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
            >
              {importing ? (
                <><Loader className="w-4 h-4 animate-spin" /> Import en cours...</>
              ) : (
                <><Upload className="w-4 h-4" /> Lancer l'import</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}