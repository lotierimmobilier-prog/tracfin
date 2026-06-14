import { useState } from 'react';
import { PenTool, AlertCircle } from 'lucide-react';
import { EnhancedSignatureCanvas } from './EnhancedSignatureCanvas';
import { SignatureDisplay } from './SignatureDisplay';
import { saveSignature, getUserIP, getUserAgent } from '../../lib/signatureService';
import { useAuth } from '../../contexts/AuthContext';

interface SignatureSectionProps {
  entityType: string;
  entityId: string;
  title?: string;
  subtitle?: string;
  required?: boolean;
  onSignatureComplete?: (signatureId: string) => void;
  existingSignature?: {
    signatureData: string;
    signerName?: string;
    signedAt?: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
  };
  disabled?: boolean;
}

export function SignatureSection({
  entityType,
  entityId,
  title = 'Signature',
  subtitle = 'Signature manuscrite requise',
  required = true,
  onSignatureComplete,
  existingSignature,
  disabled = false,
}: SignatureSectionProps) {
  const { user } = useAuth();
  const [showCanvas, setShowCanvas] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(
    existingSignature?.signatureData || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveSignature = async (signature: string) => {
    setLoading(true);
    setError(null);

    try {
      const ipAddress = await getUserIP();
      const userAgent = getUserAgent();

      const result = await saveSignature({
        entityType,
        entityId,
        signatureData: signature,
        ipAddress,
        userAgent,
        metadata: {
          document_version: '1.0',
          signature_source: 'web_canvas',
        },
      });

      setSignatureData(signature);
      setShowCanvas(false);

      if (onSignatureComplete) {
        onSignatureComplete(result.signatureId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement de la signature');
      console.error('Signature save error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (existingSignature) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <SignatureDisplay
          signatureData={existingSignature.signatureData}
          signerName={existingSignature.signerName}
          signedAt={existingSignature.signedAt}
          ipAddress={existingSignature.ipAddress}
          metadata={existingSignature.metadata}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {signatureData ? (
        <div className="space-y-3">
          <SignatureDisplay
            signatureData={signatureData}
            signerName={user?.email}
            signedAt={new Date().toISOString()}
          />
          {!disabled && (
            <button
              type="button"
              onClick={() => setShowCanvas(true)}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Modifier la signature
            </button>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
          <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
            <PenTool className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-slate-700 mb-4">
            {required ? 'Vous devez signer ce document' : 'Document non signé'}
          </p>
          <button
            type="button"
            onClick={() => setShowCanvas(true)}
            disabled={disabled || loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-lg shadow-blue-600/30"
          >
            <PenTool className="w-4 h-4" />
            {loading ? 'Enregistrement...' : 'Signer le document'}
          </button>
        </div>
      )}

      {showCanvas && (
        <EnhancedSignatureCanvas
          onSave={handleSaveSignature}
          onCancel={() => setShowCanvas(false)}
          title={title}
          subtitle={subtitle}
        />
      )}
    </div>
  );
}
