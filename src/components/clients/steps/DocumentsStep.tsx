import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface FormData {
  id_document_type: string;
  id_document_number: string;
  id_document_issue_date: string;
  id_document_expiry: string;
}

interface Documents {
  idCardRecto: File | null;
  idCardVerso: File | null;
  proofAddress: File | null;
  kbis: File | null;
  statuts: File | null;
  proofIncome: File | null;
}

interface Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  documents: Documents;
  setDocuments: React.Dispatch<React.SetStateAction<Documents>>;
  isLegalEntity: boolean;
}

export function DocumentsStep({ formData, setFormData, documents, setDocuments, isLegalEntity }: Props) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: keyof Documents) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Le fichier ne doit pas dépasser 5 Mo');
        return;
      }
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setError('Seuls les images et PDF sont acceptés');
        return;
      }
      setDocuments(prev => ({ ...prev, [docType]: file }));
      setError(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Pièce d'identité
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type de document *
            </label>
            <select
              name="id_document_type"
              value={formData.id_document_type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            >
              <option value="carte_identite">Carte d'identité</option>
              <option value="passeport">Passeport</option>
              <option value="titre_sejour">Titre de séjour</option>
              <option value="permis_conduire">Permis de conduire</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Numéro du document *
            </label>
            <input
              type="text"
              name="id_document_number"
              value={formData.id_document_number}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date de délivrance *
            </label>
            <input
              type="date"
              name="id_document_issue_date"
              value={formData.id_document_issue_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date d'expiration
            </label>
            <input
              type="date"
              name="id_document_expiry"
              value={formData.id_document_expiry}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Recto de la pièce d'identité *
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'idCardRecto')}
                accept="image/*,application/pdf"
                className="hidden"
                id="id-card-recto"
              />
              <label
                htmlFor="id-card-recto"
                className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg hover:border-slate-400 cursor-pointer transition ${
                  documents.idCardRecto ? 'border-green-400 bg-green-50' : 'border-slate-300'
                }`}
              >
                {documents.idCardRecto ? (
                  <>
                    <span className="text-2xl">✅</span>
                    <span className="text-sm text-green-700 font-medium">
                      {documents.idCardRecto.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-600" />
                    <span className="text-sm text-slate-600">Choisir un fichier</span>
                  </>
                )}
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">Image ou PDF, max 5 Mo</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Verso de la pièce d'identité *
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'idCardVerso')}
                accept="image/*,application/pdf"
                className="hidden"
                id="id-card-verso"
              />
              <label
                htmlFor="id-card-verso"
                className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg hover:border-slate-400 cursor-pointer transition ${
                  documents.idCardVerso ? 'border-green-400 bg-green-50' : 'border-slate-300'
                }`}
              >
                {documents.idCardVerso ? (
                  <>
                    <span className="text-2xl">✅</span>
                    <span className="text-sm text-green-700 font-medium">
                      {documents.idCardVerso.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-600" />
                    <span className="text-sm text-slate-600">Choisir un fichier</span>
                  </>
                )}
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">Obligatoire</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">Justificatifs complémentaires</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Justificatif de domicile
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'proofAddress')}
                accept="image/*,application/pdf"
                className="hidden"
                id="proof-address"
              />
              <label
                htmlFor="proof-address"
                className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg hover:border-slate-400 cursor-pointer transition ${
                  documents.proofAddress ? 'border-green-400 bg-green-50' : 'border-slate-300'
                }`}
              >
                {documents.proofAddress ? (
                  <>
                    <span className="text-2xl">✅</span>
                    <span className="text-sm text-green-700 font-medium">
                      {documents.proofAddress.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-600" />
                    <span className="text-sm text-slate-600">Choisir un fichier</span>
                  </>
                )}
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">Facture, avis d'imposition (recommandé)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Justificatif de revenus
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'proofIncome')}
                accept="image/*,application/pdf"
                className="hidden"
                id="proof-income"
              />
              <label
                htmlFor="proof-income"
                className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg hover:border-slate-400 cursor-pointer transition ${
                  documents.proofIncome ? 'border-green-400 bg-green-50' : 'border-slate-300'
                }`}
              >
                {documents.proofIncome ? (
                  <>
                    <span className="text-2xl">✅</span>
                    <span className="text-sm text-green-700 font-medium">
                      {documents.proofIncome.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-600" />
                    <span className="text-sm text-slate-600">Choisir un fichier</span>
                  </>
                )}
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">Bulletin de salaire, avis (optionnel)</p>
          </div>
        </div>
      </div>

      {isLegalEntity && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Documents société</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Kbis *
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'kbis')}
                  accept="image/*,application/pdf"
                  className="hidden"
                  id="kbis"
                />
                <label
                  htmlFor="kbis"
                  className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg hover:border-slate-400 cursor-pointer transition ${
                    documents.kbis ? 'border-green-400 bg-green-50' : 'border-slate-300'
                  }`}
                >
                  {documents.kbis ? (
                    <>
                      <span className="text-2xl">✅</span>
                      <span className="text-sm text-green-700 font-medium">
                        {documents.kbis.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-600" />
                      <span className="text-sm text-slate-600">Choisir un fichier</span>
                    </>
                  )}
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1">Moins de 3 mois (obligatoire)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Statuts
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, 'statuts')}
                  accept="image/*,application/pdf"
                  className="hidden"
                  id="statuts"
                />
                <label
                  htmlFor="statuts"
                  className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg hover:border-slate-400 cursor-pointer transition ${
                    documents.statuts ? 'border-green-400 bg-green-50' : 'border-slate-300'
                  }`}
                >
                  {documents.statuts ? (
                    <>
                      <span className="text-2xl">✅</span>
                      <span className="text-sm text-green-700 font-medium">
                        {documents.statuts.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-600" />
                      <span className="text-sm text-slate-600">Choisir un fichier</span>
                    </>
                  )}
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1">Fortement recommandé</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Conservation des documents</h4>
        <p className="text-sm text-yellow-800">
          Tous les documents collectés sont conservés pendant 5 ans minimum conformément
          à l'article L561-12 du Code Monétaire et Financier.
        </p>
      </div>
    </div>
  );
}
