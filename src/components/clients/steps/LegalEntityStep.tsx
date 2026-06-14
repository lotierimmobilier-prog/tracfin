interface FormData {
  legal_form: string;
  siren: string;
  siret: string;
  legal_representative_name: string;
}

interface Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export function LegalEntityStep({ formData, setFormData }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">Informations société obligatoires</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Forme juridique *
          </label>
          <select
            name="legal_form"
            value={formData.legal_form}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            <option value="">Sélectionner</option>
            <option value="SCI">SCI - Société Civile Immobilière</option>
            <option value="SARL">SARL - Société à Responsabilité Limitée</option>
            <option value="SAS">SAS - Société par Actions Simplifiée</option>
            <option value="SA">SA - Société Anonyme</option>
            <option value="EURL">EURL - Entreprise Unipersonnelle à Responsabilité Limitée</option>
            <option value="SASU">SASU - Société par Actions Simplifiée Unipersonnelle</option>
            <option value="Association">Association</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              SIREN *
            </label>
            <input
              type="text"
              name="siren"
              value={formData.siren}
              onChange={handleChange}
              required
              maxLength={9}
              placeholder="123456789"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">9 chiffres</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              SIRET *
            </label>
            <input
              type="text"
              name="siret"
              value={formData.siret}
              onChange={handleChange}
              required
              maxLength={14}
              placeholder="12345678900001"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">14 chiffres</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Identité du représentant légal *
          </label>
          <input
            type="text"
            name="legal_representative_name"
            value={formData.legal_representative_name}
            onChange={handleChange}
            required
            placeholder="Prénom et nom du gérant/président"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-900 mb-2">Documents requis</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Kbis de moins de 3 mois (obligatoire)</li>
          <li>• Statuts de la société (fortement recommandé)</li>
          <li>• Liste des associés et parts sociales</li>
          <li>• Identification des bénéficiaires effectifs</li>
        </ul>
        <p className="text-xs text-blue-700 mt-3">
          Ces documents seront demandés à l'étape suivante
        </p>
      </div>
    </div>
  );
}
