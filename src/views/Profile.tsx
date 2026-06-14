import { useEffect, useState } from 'react';
import { User, Lock, Save, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { EnhancedSignatureCanvas } from '../components/signature/EnhancedSignatureCanvas';
import { SignatureDisplay } from '../components/signature/SignatureDisplay';
import { saveSignature, getUserIP, getUserAgent } from '../lib/signatureService';

interface ProfileData {
  phone: string;
  rcs_number: string;
  rcs_city: string;
  signature?: string;
}

export function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    phone: '',
    rcs_number: '',
    rcs_city: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [existingSignature, setExistingSignature] = useState<{
    signature_data: string;
    signed_at: string;
  } | null>(null);

  useEffect(() => {
    loadProfile();
    loadSignature();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('phone, rcs_number, rcs_city')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData({
          phone: data.phone || '',
          rcs_number: data.rcs_number || '',
          rcs_city: data.rcs_city || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSignature = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('signatures')
        .select('signature_data, signed_at')
        .eq('entity_type', 'user_profile')
        .eq('entity_id', user.id)
        .order('signed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingSignature(data);
      }
    } catch (error) {
      console.error('Error loading signature:', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          phone: profileData.phone,
          rcs_number: profileData.rcs_number,
          rcs_city: profileData.rcs_city,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      if (profileData.signature) {
        const ipAddress = await getUserIP();
        const userAgent = getUserAgent();

        await saveSignature({
          entityType: 'user_profile',
          entityId: user.id,
          signatureData: profileData.signature,
          ipAddress,
          userAgent,
          metadata: {
            document_type: 'profile_completion',
            signed_by: user.email,
          },
        });

        await loadSignature();
      }

      setSuccess('Profil mis à jour avec succès');
      setProfileData({ ...profileData, signature: undefined });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setSuccess('Mot de passe modifié avec succès');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordChange(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      setError(error.message || 'Erreur lors du changement de mot de passe');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Mon profil</h1>
        <p className="text-slate-600 mt-1">Gérer vos informations personnelles et votre signature</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Informations professionnelles
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="06 12 34 56 78"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Numéro RCS
              </label>
              <input
                type="text"
                value={profileData.rcs_number}
                onChange={(e) => setProfileData({ ...profileData, rcs_number: e.target.value })}
                placeholder="123 456 789"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ville RCS
              </label>
              <input
                type="text"
                value={profileData.rcs_city}
                onChange={(e) => setProfileData({ ...profileData, rcs_city: e.target.value })}
                placeholder="Paris"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 mt-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              Signature par défaut
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Cette signature sera utilisée pour tous vos documents
            </p>

            {existingSignature ? (
              <div className="space-y-3">
                <SignatureDisplay
                  signatureData={existingSignature.signature_data}
                  signerName={user?.email || ''}
                  signedAt={existingSignature.signed_at}
                />
                <button
                  type="button"
                  onClick={() => setShowSignatureCanvas(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Modifier la signature
                </button>
              </div>
            ) : profileData.signature ? (
              <div className="space-y-3">
                <SignatureDisplay
                  signatureData={profileData.signature}
                  signerName={user?.email || ''}
                  signedAt={new Date().toISOString()}
                />
                <button
                  type="button"
                  onClick={() => setShowSignatureCanvas(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Modifier la signature
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSignatureCanvas(true)}
                className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition"
              >
                <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <p className="text-slate-700 font-medium">Cliquez pour signer</p>
                <p className="text-sm text-slate-500 mt-1">Souris ou doigt sur l'écran</p>
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Sécurité
        </h2>

        {!showPasswordChange ? (
          <button
            onClick={() => setShowPasswordChange(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <KeyRound className="w-4 h-4" />
            Changer mon mot de passe
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nouveau mot de passe *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirmer le mot de passe *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Changer le mot de passe
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                  setError(null);
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

      {showSignatureCanvas && (
        <EnhancedSignatureCanvas
          onSave={(signatureData) => {
            setProfileData({ ...profileData, signature: signatureData });
            setShowSignatureCanvas(false);
          }}
          onCancel={() => setShowSignatureCanvas(false)}
          title="Votre signature"
          subtitle="Signez avec la souris ou le doigt"
        />
      )}
    </div>
  );
}
