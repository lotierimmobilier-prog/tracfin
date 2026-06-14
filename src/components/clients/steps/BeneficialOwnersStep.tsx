import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface BeneficialOwner {
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string;
  nationality: string;
  address: string;
  id_document_type: string;
  id_document_number: string;
  ownership_percentage: string;
  is_pep: boolean;
  pep_details: string;
}

interface Props {
  owners: BeneficialOwner[];
  setOwners: React.Dispatch<React.SetStateAction<BeneficialOwner[]>>;
}

export function BeneficialOwnersStep({ owners, setOwners }: Props) {
  const addOwner = () => {
    setOwners([
      ...owners,
      {
        first_name: '',
        last_name: '',
        birth_date: '',
        birth_place: '',
        nationality: 'France',
        address: '',
        id_document_type: 'carte_identite',
        id_document_number: '',
        ownership_percentage: '',
        is_pep: false,
        pep_details: '',
      },
    ]);
  };

  const removeOwner = (index: number) => {
    setOwners(owners.filter((_, i) => i !== index));
  };

  const updateOwner = (index: number, field: keyof BeneficialOwner, value: any) => {
    const updated = [...owners];
    updated[index] = { ...updated[index], [field]: value };
    setOwners(updated);
  };

  const totalPercentage = owners.reduce((sum, owner) => {
    const percentage = parseFloat(owner.ownership_percentage) || 0;
    return sum + percentage;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-900 mb-2">Bénéficiaires effectifs</h4>
        <p className="text-sm text-blue-800">
          Toute personne physique détenant directement ou indirectement plus de 25% du capital ou des droits de vote,
          ou exerçant un contrôle sur la société.
        </p>
      </div>

      {owners.map((owner, index) => (
        <div key={index} className="border border-slate-300 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900">Bénéficiaire effectif {index + 1}</h4>
            {owners.length > 1 && (
              <button
                type="button"
                onClick={() => removeOwner(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                value={owner.first_name}
                onChange={(e) => updateOwner(index, 'first_name', e.target.value)}
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
                value={owner.last_name}
                onChange={(e) => updateOwner(index, 'last_name', e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date de naissance
              </label>
              <input
                type="date"
                value={owner.birth_date}
                onChange={(e) => updateOwner(index, 'birth_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lieu de naissance *
              </label>
              <input
                type="text"
                value={owner.birth_place}
                onChange={(e) => updateOwner(index, 'birth_place', e.target.value)}
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
                value={owner.nationality}
                onChange={(e) => updateOwner(index, 'nationality', e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                % de participation *
              </label>
              <input
                type="number"
                value={owner.ownership_percentage}
                onChange={(e) => updateOwner(index, 'ownership_percentage', e.target.value)}
                required
                min="0"
                max="100"
                step="0.01"
                placeholder="ex: 33.33"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={owner.address}
              onChange={(e) => updateOwner(index, 'address', e.target.value)}
              placeholder="Adresse complète"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type de pièce d'identité
              </label>
              <select
                value={owner.id_document_type}
                onChange={(e) => updateOwner(index, 'id_document_type', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="carte_identite">Carte d'identité</option>
                <option value="passeport">Passeport</option>
                <option value="titre_sejour">Titre de séjour</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Numéro du document
              </label>
              <input
                type="text"
                value={owner.id_document_number}
                onChange={(e) => updateOwner(index, 'id_document_number', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={owner.is_pep}
                onChange={(e) => updateOwner(index, 'is_pep', e.target.checked)}
                className="mt-1"
                id={`owner-pep-${index}`}
              />
              <div className="flex-1">
                <label htmlFor={`owner-pep-${index}`} className="text-sm font-medium text-red-900 cursor-pointer">
                  Personne Politiquement Exposée (PPE)
                </label>
                {owner.is_pep && (
                  <textarea
                    value={owner.pep_details}
                    onChange={(e) => updateOwner(index, 'pep_details', e.target.value)}
                    rows={2}
                    placeholder="Précisions..."
                    className="w-full mt-2 px-2 py-1 text-sm border border-red-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addOwner}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition text-slate-700"
      >
        <Plus className="w-5 h-5" />
        Ajouter un bénéficiaire effectif
      </button>

      <div className={`p-4 rounded-lg border-2 ${totalPercentage === 100 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${totalPercentage === 100 ? 'text-green-600' : 'text-yellow-600'}`} />
          <div>
            <p className={`font-medium ${totalPercentage === 100 ? 'text-green-900' : 'text-yellow-900'}`}>
              Total de participation : {totalPercentage.toFixed(2)}%
            </p>
            {totalPercentage !== 100 && (
              <p className="text-sm text-yellow-800 mt-1">
                Le total des participations devrait être égal à 100%
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
