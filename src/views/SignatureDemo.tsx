import { useState } from 'react';
import { FileSignature, Shield, Clock, MapPin, User } from 'lucide-react';
import { SignatureSection } from '../components/signature/SignatureSection';

export function SignatureDemo() {
  const [signatureId, setSignatureId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                <FileSignature className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Système de Signature Sécurisée
                </h1>
                <p className="text-blue-100 mt-2">
                  Solution professionnelle pour LOTIER Immobilier
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <Shield className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm">Sécurisé</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Traçabilité complète avec IP et horodatage
                </p>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <Clock className="w-6 h-6 text-green-600 mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm">Horodaté</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Date et heure certifiées
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <MapPin className="w-6 h-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm">Géolocalisé</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Adresse IP enregistrée
                </p>
              </div>

              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <User className="w-6 h-6 text-orange-600 mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm">Identifié</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Utilisateur authentifié
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Fonctionnalités
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Canvas de dessin fluide</p>
                    <p className="text-sm text-slate-600">Tracé naturel à la souris ou au doigt sur écran tactile</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Stockage sécurisé</p>
                    <p className="text-sm text-slate-600">Images PNG enregistrées dans Supabase Storage avec backup Base64</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Métadonnées de sécurité</p>
                    <p className="text-sm text-slate-600">IP, User Agent, horodatage, identifiant utilisateur</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Affichage en lecture seule</p>
                    <p className="text-sm text-slate-600">Visualisation sécurisée des signatures existantes</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    5
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Responsive et professionnel</p>
                    <p className="text-sm text-slate-600">Interface adaptée mobile et desktop</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="border-t border-slate-200 pt-8">
              <SignatureSection
                entityType="demo_document"
                entityId="demo-123"
                title="Signature du document"
                subtitle="Signez ci-dessous pour valider ce document de démonstration"
                required={true}
                onSignatureComplete={(id) => {
                  setSignatureId(id);
                  console.log('Signature enregistrée avec l\'ID:', id);
                }}
              />
            </div>

            {signatureId && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Signature enregistrée avec succès!</span>
                  <br />
                  ID: <span className="font-mono text-xs">{signatureId}</span>
                </p>
              </div>
            )}

            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-3">
                Intégration dans l'application
              </h3>
              <p className="text-sm text-slate-700 mb-3">
                Ce système de signature est maintenant intégré dans:
              </p>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span>Fiches clients (signature client et agent)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span>Déclarations TRACFIN (signature déclarant)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span>Documents contractuels</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span>Registres internes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Système de signature sécurisée - LOTIER Immobilier © 2026</p>
        </div>
      </div>
    </div>
  );
}
