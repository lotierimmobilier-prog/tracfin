import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { EnhancedSignatureCanvas } from '../signature/EnhancedSignatureCanvas';
import { SignatureDisplay } from '../signature/SignatureDisplay';
import { saveSignature, getUserIP, getUserAgent } from '../../lib/signatureService';
import { useAuth } from '../../contexts/AuthContext';

interface SignatureModalProps {
  clientName: string;
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SignatureModal({ clientName, clientId, onClose, onSuccess }: SignatureModalProps) {
  const { user } = useAuth();
  const [showCanvas, setShowCanvas] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveSignature = async (signature: string) => {
    setLoading(true);
    setError(null);

    try {
      const ipAddress = await getUserIP();
      const userAgent = getUserAgent();

      await saveSignature({
        entityType: 'client_kyc',
        entityId: clientId,
        signatureData: signature,
        ipAddress,
        userAgent,
        metadata: {
          document_type: 'kyc_declaration',
          client_name: clientName,
          signed_by_agent: user?.email,
        },
      });

      setSignatureData(signature);
      setShowCanvas(false);

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement de la signature');
      console.error('Signature save error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (showCanvas) {
    return (
      <EnhancedSignatureCanvas
        onSave={handleSaveSignature}
        onCancel={() => setShowCanvas(false)}
        title="Signature de la déclaration KYC"
        subtitle={`Client: ${clientName}`}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Signature KYC</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-slate-700 mb-2">
            <span className="font-semibold">Client:</span> {clientName}
          </p>
          <p className="text-sm text-slate-600">
            Signez manuscritement la déclaration KYC de ce client
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {signatureData ? (
          <div className="space-y-4">
            <SignatureDisplay
              signatureData={signatureData}
              signerName={user?.email}
              signedAt={new Date().toISOString()}
            />
            <div className="text-center text-green-600 font-medium">
              Signature enregistrée avec succès
            </div>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setShowCanvas(true)}
              disabled={loading}
              className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition disabled:opacity-50"
            >
              <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <p className="text-slate-700 font-medium">Cliquez pour signer</p>
              <p className="text-sm text-slate-500 mt-1">Souris ou doigt sur l'écran</p>
            </button>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
