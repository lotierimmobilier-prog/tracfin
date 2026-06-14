import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, FileText, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ClientImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportedClient {
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  nationalite?: string;
  profession?: string;
  type_piece_identite?: string;
  numero_piece_identite?: string;
  raison_sociale?: string;
  forme_juridique?: string;
  siret?: string;
  type_client?: 'personne_physique' | 'personne_morale';
  [key: string]: any;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function ClientImportModal({ onClose, onSuccess }: ClientImportModalProps) {
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [preview, setPreview] = useState<ImportedClient[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setPreview([]);
    setSuccessCount(0);

    try {
      const data = await parseFile(selectedFile);
      setPreview(data.slice(0, 5));
    } catch (err: any) {
      setErrors([{ row: 0, field: 'file', message: err.message }]);
    }
  };

  const parseFile = async (file: File): Promise<ImportedClient[]> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data as ImportedClient[]);
          },
          error: (error) => {
            reject(new Error(`Erreur lors de la lecture du CSV: ${error.message}`));
          }
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet) as ImportedClient[];
            resolve(jsonData);
          } catch (error: any) {
            reject(new Error(`Erreur lors de la lecture du fichier Excel: ${error.message}`));
          }
        };
        reader.onerror = () => {
          reject(new Error('Erreur lors de la lecture du fichier'));
        };
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls)'));
      }
    });
  };

  const validateClient = (client: ImportedClient, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const row = index + 2;

    if (!client.type_client) {
      errors.push({ row, field: 'type_client', message: 'Le type de client est requis (personne_physique ou personne_morale)' });
    }

    if (client.type_client === 'personne_physique') {
      if (!client.nom) {
        errors.push({ row, field: 'nom', message: 'Le nom est requis pour une personne physique' });
      }
      if (!client.prenom) {
        errors.push({ row, field: 'prenom', message: 'Le prénom est requis pour une personne physique' });
      }
    } else if (client.type_client === 'personne_morale') {
      if (!client.raison_sociale) {
        errors.push({ row, field: 'raison_sociale', message: 'La raison sociale est requise pour une personne morale' });
      }
    }

    if (client.email && !client.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push({ row, field: 'email', message: 'Format d\'email invalide' });
    }

    return errors;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setErrors([]);
    setSuccessCount(0);

    try {
      const clients = await parseFile(file);
      const allErrors: ValidationError[] = [];
      let imported = 0;

      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        const validationErrors = validateClient(client, i);

        if (validationErrors.length > 0) {
          allErrors.push(...validationErrors);
          continue;
        }

        try {
          const clientData: any = {
            client_type: client.type_client === 'personne_morale' ? 'legal_entity' : 'individual',
            email: client.email || null,
            phone: client.telephone || null,
            address: client.adresse || null,
            postal_code: client.code_postal || null,
            city: client.ville || null,
            country: client.pays || 'France',
            status: 'active',
            risk_level: 'low',
            agent_id: profile?.id || null,
            created_by: profile?.id || null,
          };

          if (client.type_client === 'personne_physique') {
            clientData.last_name = client.nom;
            clientData.first_name = client.prenom;
            clientData.birth_date = client.date_naissance || null;
            clientData.birth_place = client.lieu_naissance || null;
            clientData.nationality = client.nationalite || null;
            clientData.profession = client.profession || null;
            clientData.id_document_type = client.type_piece_identite || null;
            clientData.id_document_number = client.numero_piece_identite || null;
          } else {
            clientData.company_name = client.raison_sociale;
            clientData.legal_form = client.forme_juridique || null;
            clientData.siret = client.siret || null;
          }

          const { error } = await supabase
            .from('clients')
            .insert(clientData);

          if (error) {
            allErrors.push({
              row: i + 2,
              field: 'general',
              message: `Erreur lors de l'insertion: ${error.message}`
            });
          } else {
            imported++;
          }
        } catch (err: any) {
          allErrors.push({
            row: i + 2,
            field: 'general',
            message: `Erreur inattendue: ${err.message}`
          });
        }
      }

      setSuccessCount(imported);
      setErrors(allErrors);

      if (imported > 0 && allErrors.length === 0) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setErrors([{ row: 0, field: 'file', message: err.message }]);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `type_client,nom,prenom,email,telephone,adresse,code_postal,ville,pays,date_naissance,lieu_naissance,nationalite,profession,type_piece_identite,numero_piece_identite,raison_sociale,forme_juridique,siret
personne_physique,Dupont,Jean,jean.dupont@example.com,0601020304,10 rue de Paris,75001,Paris,France,1980-01-15,Paris,Française,Cadre,carte_identite,123456789,,,
personne_morale,,,contact@entreprise.com,0102030405,20 avenue des Champs,75008,Paris,France,,,,,,,SARL Exemple,SARL,12345678901234`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modele_import_clients.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Importer des clients</h2>
            <p className="text-sm text-slate-600 mt-1">Importez vos clients via un fichier CSV ou Excel</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Format requis</p>
                <p className="mb-2">Le fichier doit contenir au minimum les colonnes suivantes :</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li><strong>type_client</strong> : "personne_physique" ou "personne_morale"</li>
                  <li>Pour une personne physique : <strong>nom</strong>, <strong>prenom</strong></li>
                  <li>Pour une personne morale : <strong>raison_sociale</strong></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm font-medium text-slate-700"
            >
              <Download className="w-4 h-4" />
              Télécharger le modèle CSV
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="text-center">
              {file ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-slate-900">
                    {file.name.endsWith('.csv') ? (
                      <FileText className="w-8 h-8 text-green-600" />
                    ) : (
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    )}
                    <span className="font-medium">{file.name}</span>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Choisir un autre fichier
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Sélectionnez un fichier
                    </button>
                    <p className="text-sm text-slate-600 mt-1">
                      ou glissez-déposez un fichier CSV ou Excel
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {preview.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">
                Aperçu des données (5 premières lignes)
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Nom/Raison sociale</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Téléphone</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Ville</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {preview.map((client, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-3 py-2 text-xs text-slate-900">{client.type_client}</td>
                        <td className="px-3 py-2 text-xs text-slate-900">
                          {client.type_client === 'personne_physique'
                            ? `${client.prenom || ''} ${client.nom || ''}`
                            : client.raison_sociale}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-900">{client.email}</td>
                        <td className="px-3 py-2 text-xs text-slate-900">{client.telephone}</td>
                        <td className="px-3 py-2 text-xs text-slate-900">{client.ville}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {successCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold">
                    {successCount} client{successCount > 1 ? 's' : ''} importé{successCount > 1 ? 's' : ''} avec succès
                  </p>
                </div>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800 flex-1">
                  <p className="font-semibold mb-2">
                    {errors.length} erreur{errors.length > 1 ? 's' : ''} détectée{errors.length > 1 ? 's' : ''}
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {errors.slice(0, 10).map((error, idx) => (
                      <p key={idx}>
                        Ligne {error.row} - {error.field}: {error.message}
                      </p>
                    ))}
                    {errors.length > 10 && (
                      <p className="text-red-600 font-medium">
                        ... et {errors.length - 10} autres erreurs
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-lg shadow-blue-600/30"
          >
            {importing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Importation en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importer les clients
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
