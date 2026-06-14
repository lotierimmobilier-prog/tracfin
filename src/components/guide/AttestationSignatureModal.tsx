import { useState } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';
import { EnhancedSignatureCanvas } from '../signature/EnhancedSignatureCanvas';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AttestationSignatureModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ATTESTATION_TEXT = `Je soussigné(e), certifie par la présente :

✓ Avoir pris connaissance et compris les obligations légales en matière de lutte contre le blanchiment de capitaux et le financement du terrorisme (LCB-FT) applicables aux professionnels de l'immobilier

✓ Avoir étudié les critères d'alerte et les typologies de blanchiment présentés dans cette formation

✓ Avoir compris la cartographie des risques et les différents niveaux de vigilance à appliquer selon les types de biens et d'opérations

✓ M'engager à appliquer les mesures de vigilance appropriées lors de chaque transaction immobilière

✓ M'engager à identifier et vérifier l'identité de mes clients ainsi que celle des bénéficiaires effectifs

✓ M'engager à déclarer à TRACFIN toute opération suspecte que je pourrais identifier

✓ M'engager à conserver l'ensemble des documents et informations pendant la durée légale de 5 ans

✓ Comprendre que le non-respect de ces obligations peut entraîner des sanctions administratives et pénales`;

export function AttestationSignatureModal({ onClose, onSuccess }: AttestationSignatureModalProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState<'form' | 'signature'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    role: '',
  });

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.role.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setError('');
    setStep('signature');
  };

  const handleSaveSignature = async (signatureData: string) => {
    setLoading(true);
    setError('');

    try {
      if (!profile?.id) {
        throw new Error('Utilisateur non connecté');
      }

      const { error: insertError } = await supabase
        .from('training_attestations')
        .insert({
          user_id: profile.id,
          full_name: formData.fullName.trim(),
          role: formData.role.trim(),
          signature_data: signatureData,
          attestation_text: ATTESTATION_TEXT,
          ip_address: null,
          user_agent: navigator.userAgent,
        });

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      console.error('Error saving attestation:', err);
      setError(err.message || 'Erreur lors de l\'enregistrement de l\'attestation');
      setLoading(false);
    }
  };

  if (step === 'signature') {
    return (
      <EnhancedSignatureCanvas
        title="Signature de l'attestation de formation"
        subtitle="Signez pour valider votre engagement"
        onSave={handleSaveSignature}
        onCancel={() => setStep('form')}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Attestation de formation LCB-FT</h2>
            <p className="text-sm text-slate-600 mt-1">Informations du signataire</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          <form onSubmit={handleSubmitForm} className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Attention</p>
                  <p>
                    Cette attestation sera horodatée et enregistrée de manière permanente et immuable.
                    Elle ne pourra pas être modifiée ou supprimée une fois signée.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom et prénom complets *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Jean Dupont"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fonction / Rôle *
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Agent immobilier"
                  required
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Engagement attesté :</h3>
              <div className="text-sm text-slate-700 space-y-2 max-h-64 overflow-y-auto">
                <p className="font-medium">Je soussigné(e), certifie par la présente :</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Avoir pris connaissance et compris les obligations légales en matière de LCB-FT</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Avoir étudié les critères d'alerte et les typologies de blanchiment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Avoir compris la cartographie des risques</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>M'engager à appliquer les mesures de vigilance appropriées</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>M'engager à identifier et vérifier l'identité des clients et bénéficiaires effectifs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>M'engager à déclarer à TRACFIN toute opération suspecte</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>M'engager à conserver les documents pendant 5 ans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Comprendre les sanctions en cas de non-respect</span>
                  </li>
                </ul>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-lg shadow-blue-600/30"
              >
                <Check className="w-4 h-4" />
                Continuer vers la signature
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
