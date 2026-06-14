import { useState } from 'react';
import { Plus, Trash2, AlertCircle, User } from 'lucide-react';

interface BeneficialOwner {
  id?: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  nationality: string;
  ownership_percentage: string;
  is_pep: boolean;
  pep_details: string;
}

interface BeneficialOwnersProps {
  owners: BeneficialOwner[];
  onChange: (owners: BeneficialOwner[]) => void;
}

export function BeneficialOwners({ owners, onChange }: BeneficialOwnersProps) {
  const addOwner = () => {
    onChange([
      ...owners,
      {
        first_name: '',
        last_name: '',
        birth_date: '',
        nationality: 'France',
        ownership_percentage: '',
        is_pep: false,
        pep_details: '',
      },
    ]);
  };

  const removeOwner = (index: number) => {
    onChange(owners.filter((_, i) => i !== index));
  };

  const updateOwner = (index: number, field: keyof BeneficialOwner, value: string | boolean) => {
    const newOwners = [...owners];
    newOwners[index] = { ...newOwners[index], [field]: value };
    onChange(newOwners);
  };

  const totalPercentage = owners.reduce((sum, owner) => sum + (parseFloat(owner.ownership_percentage) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            Bénéficiaires effectifs
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Personnes physiques détenant plus de 25% du capital ou exerçant un contrôle
          </p>
        </div>
        <button
          type="button"
          onClick={addOwner}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {owners.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
          <User className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">Aucun bénéficiaire effectif ajouté</p>
          <button
            type="button"
            onClick={addOwner}
            className="mt-3 text-sm text-slate-900 font-medium hover:underline"
          >
            Ajouter un bénéficiaire effectif
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {owners.map((owner, index) => (
              <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900">Bénéficiaire {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeOwner(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                      Nationalité
                    </label>
                    <input
                      type="text"
                      value={owner.nationality}
                      onChange={(e) => updateOwner(index, 'nationality', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Part du capital (%) *
                    </label>
                    <input
                      type="number"
                      value={owner.ownership_percentage}
                      onChange={(e) => updateOwner(index, 'ownership_percentage', e.target.value)}
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
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
                        placeholder="Précisions sur le statut PPE..."
                        rows={2}
                        className="w-full mt-2 px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPercentage > 0 && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
              totalPercentage !== 100 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'
            }`}>
              <AlertCircle className={`w-5 h-5 ${totalPercentage !== 100 ? 'text-orange-600' : 'text-green-600'}`} />
              <p className={`text-sm font-medium ${totalPercentage !== 100 ? 'text-orange-900' : 'text-green-900'}`}>
                Total de la participation : {totalPercentage.toFixed(2)}%
                {totalPercentage !== 100 && ' (devrait être 100%)'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
