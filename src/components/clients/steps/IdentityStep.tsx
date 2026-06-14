import { Building2, User } from 'lucide-react';

interface FormData {
  client_type: 'individual' | 'legal_entity';
  client_role: 'vendeur' | 'acquereur' | 'bailleur' | 'locataire' | 'caution' | '';
  first_name: string;
  last_name: string;
  company_name: string;
  birth_date: string;
  birth_place: string;
  nationality: string;
  profession: string;
  annual_income: string;
  income_source: string;
  is_pep: boolean;
  pep_details: string;
  doubt_level: 'none' | 'low' | 'medium' | 'high';
}

interface Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export function IdentityStep({ formData, setFormData }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-xl p-4">
        <label className="block text-sm font-medium text-slate-900 mb-3">Rôle du client *</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, client_role: 'vendeur' }))}
            className={`px-4 py-2 rounded-lg border-2 transition text-sm font-medium ${
              formData.client_role === 'vendeur'
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            Vendeur
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, client_role: 'acquereur' }))}
            className={`px-4 py-2 rounded-lg border-2 transition text-sm font-medium ${
              formData.client_role === 'acquereur'
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            Acquéreur
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, client_role: 'bailleur' }))}
            className={`px-4 py-2 rounded-lg border-2 transition text-sm font-medium ${
              formData.client_role === 'bailleur'
                ? 'border-green-600 bg-green-50 text-green-900'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            Bailleur
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, client_role: 'locataire' }))}
            className={`px-4 py-2 rounded-lg border-2 transition text-sm font-medium ${
              formData.client_role === 'locataire'
                ? 'border-green-600 bg-green-50 text-green-900'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            Locataire
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, client_role: 'caution' }))}
            className={`px-4 py-2 rounded-lg border-2 transition text-sm font-medium ${
              formData.client_role === 'caution'
                ? 'border-orange-600 bg-orange-50 text-orange-900'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            Caution
          </button>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <label className="block text-sm font-medium text-slate-900 mb-3">Type de client *</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, client_type: 'individual' }))}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition ${
              formData.client_type === 'individual'
                ? 'border-slate-900 bg-white'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <User className="w-5 h-5 text-slate-600" />
            <div className="text-left">
              <p className="font-medium text-slate-900">Personne physique</p>
              <p className="text-xs text-slate-600">Particulier</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, client_type: 'legal_entity' }))}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition ${
              formData.client_type === 'legal_entity'
                ? 'border-slate-900 bg-white'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Building2 className="w-5 h-5 text-slate-600" />
            <div className="text-left">
              <p className="font-medium text-slate-900">Personne morale</p>
              <p className="text-xs text-slate-600">Société, SCI, association</p>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <label className="block text-sm font-medium text-slate-900 mb-3">Niveau de doute *</label>
        <p className="text-xs text-slate-600 mb-3">
          Évaluez votre niveau de doute concernant ce client
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, doubt_level: 'none' }))}
            className={`px-4 py-3 rounded-lg border-2 transition ${
              formData.doubt_level === 'none'
                ? 'border-green-600 bg-green-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${
                formData.doubt_level === 'none' ? 'bg-green-600' : 'bg-green-300'
              }`}></div>
              <p className={`text-sm font-medium ${
                formData.doubt_level === 'none' ? 'text-green-900' : 'text-slate-700'
              }`}>
                Aucun
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, doubt_level: 'low' }))}
            className={`px-4 py-3 rounded-lg border-2 transition ${
              formData.doubt_level === 'low'
                ? 'border-lime-600 bg-lime-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${
                formData.doubt_level === 'low' ? 'bg-lime-600' : 'bg-lime-300'
              }`}></div>
              <p className={`text-sm font-medium ${
                formData.doubt_level === 'low' ? 'text-lime-900' : 'text-slate-700'
              }`}>
                Faible
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, doubt_level: 'medium' }))}
            className={`px-4 py-3 rounded-lg border-2 transition ${
              formData.doubt_level === 'medium'
                ? 'border-orange-600 bg-orange-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${
                formData.doubt_level === 'medium' ? 'bg-orange-600' : 'bg-orange-300'
              }`}></div>
              <p className={`text-sm font-medium ${
                formData.doubt_level === 'medium' ? 'text-orange-900' : 'text-slate-700'
              }`}>
                Moyen
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, doubt_level: 'high' }))}
            className={`px-4 py-3 rounded-lg border-2 transition ${
              formData.doubt_level === 'high'
                ? 'border-red-600 bg-red-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${
                formData.doubt_level === 'high' ? 'bg-red-600' : 'bg-red-300'
              }`}></div>
              <p className={`text-sm font-medium ${
                formData.doubt_level === 'high' ? 'text-red-900' : 'text-slate-700'
              }`}>
                Élevé
              </p>
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">Informations obligatoires</h3>

        {formData.client_type === 'individual' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date de naissance *
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lieu de naissance *
                </label>
                <input
                  type="text"
                  name="birth_place"
                  value={formData.birth_place}
                  onChange={handleChange}
                  required
                  placeholder="Ville, Pays"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nationalité *
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Profession *
                </label>
                <input
                  type="text"
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dénomination sociale *
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {formData.client_type === 'individual' && (
        <>
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Informations financières</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Revenus annuels estimés
                </label>
                <input
                  type="number"
                  name="annual_income"
                  value={formData.annual_income}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  placeholder="ex: 45000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Origine des revenus
                </label>
                <input
                  type="text"
                  name="income_source"
                  value={formData.income_source}
                  onChange={handleChange}
                  placeholder="Salaire, entreprise, patrimoine..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="is_pep"
                checked={formData.is_pep}
                onChange={handleChange}
                className="mt-1"
                id="is-pep"
              />
              <div className="flex-1">
                <label htmlFor="is-pep" className="font-medium text-red-900 cursor-pointer">
                  Personne Politiquement Exposée (PPE)
                </label>
                <p className="text-xs text-red-700 mt-1">
                  Membre du gouvernement, parlementaire, haut fonctionnaire, dirigeant d'entreprise publique, famille proche
                </p>
              </div>
            </div>

            {formData.is_pep && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-red-900 mb-2">
                  Précisions sur le statut PPE *
                </label>
                <textarea
                  name="pep_details"
                  value={formData.pep_details}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Fonction exercée, organisme, période..."
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
