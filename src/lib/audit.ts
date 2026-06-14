import { supabase } from './supabase';

export async function logAuditEvent(
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: any,
  newValues?: any
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues || null,
      new_values: newValues || null,
      ip_address: null,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}
