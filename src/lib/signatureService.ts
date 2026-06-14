import { supabase } from './supabase';

interface SignatureMetadata {
  entityType: string;
  entityId: string;
  signatureData: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function saveSignature({
  entityType,
  entityId,
  signatureData,
  ipAddress,
  userAgent,
  metadata = {},
}: SignatureMetadata) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const base64Data = signatureData.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    const fileName = `${user.id}/${entityType}_${entityId}_${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signatures')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('signatures')
      .getPublicUrl(fileName);

    const { data: signatureRecord, error: insertError } = await supabase
      .from('signatures')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        signer_id: user.id,
        signature_url: uploadData.path,
        signature_data: signatureData,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        metadata,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return {
      success: true,
      signatureId: signatureRecord.id,
      signatureUrl: publicUrl,
    };
  } catch (error) {
    console.error('Error saving signature:', error);
    throw error;
  }
}

export async function getSignatures(entityType: string, entityId: string) {
  try {
    const { data, error } = await supabase
      .from('signatures')
      .select(`
        *,
        signer:users(id, email, first_name, last_name)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('signed_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching signatures:', error);
    throw error;
  }
}

export async function getSignatureUrl(signaturePath: string) {
  try {
    const { data } = supabase.storage
      .from('signatures')
      .getPublicUrl(signaturePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting signature URL:', error);
    return null;
  }
}

export async function getUserIP(): Promise<string | undefined> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching IP address:', error);
    return undefined;
  }
}

export function getUserAgent(): string {
  return navigator.userAgent;
}
