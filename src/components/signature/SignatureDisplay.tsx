import { Check, Calendar, MapPin, User } from 'lucide-react';
import { formatDate } from '../../utils/formatting';

interface SignatureDisplayProps {
  signatureData: string;
  signerName?: string;
  signedAt?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  className?: string;
}

export function SignatureDisplay({
  signatureData,
  signerName,
  signedAt,
  ipAddress,
  metadata,
  className = '',
}: SignatureDisplayProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-green-100 rounded">
          <Check className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="font-semibold text-slate-900">Signature validée</h3>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
        <img
          src={signatureData}
          alt="Signature"
          className="max-w-full h-auto mx-auto"
          style={{ maxHeight: '120px' }}
        />
      </div>

      <div className="space-y-2 text-sm">
        {signerName && (
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Signé par :</span>
            <span>{signerName}</span>
          </div>
        )}

        {signedAt && (
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Date :</span>
            <span>{formatDate(signedAt)}</span>
          </div>
        )}

        {ipAddress && (
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">IP :</span>
            <span className="font-mono text-xs">{ipAddress}</span>
          </div>
        )}

        {metadata && Object.keys(metadata).length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-2">Informations complémentaires :</p>
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-medium capitalize">{key}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-xs text-green-800">
          Cette signature a été capturée de manière sécurisée avec horodatage et traçabilité complète.
        </p>
      </div>
    </div>
  );
}
