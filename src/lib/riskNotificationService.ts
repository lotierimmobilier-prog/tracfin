import { supabase } from './supabase';

export async function sendRiskAlertNotification(
  transactionId: string,
  riskScore: number,
  userId: string
): Promise<void> {
  try {
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('role', 'admin');

    if (adminError) throw adminError;

    if (!admins || admins.length === 0) {
      console.warn('No admin users found to send risk alert notification');
      return;
    }

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('property_address, transaction_amount, client_id, clients(first_name, last_name, company_name)')
      .eq('id', transactionId)
      .single();

    if (transactionError) throw transactionError;

    const clientName = (transaction as any).clients?.company_name ||
      `${(transaction as any).clients?.first_name} ${(transaction as any).clients?.last_name}`;

    const notificationPromises = admins.map(admin =>
      supabase.from('notifications').insert({
        user_id: admin.id,
        type: 'risk_alert',
        title: `Alerte risque élevé - Score ${riskScore}/10`,
        message: `Une transaction présentant ${riskScore} facteurs de risque LCB-FT nécessite votre attention.\n\nClient: ${clientName}\nBien: ${transaction.property_address}\nMontant: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(transaction.transaction_amount)}`,
        related_entity_type: 'transaction',
        related_entity_id: transactionId,
      })
    );

    await Promise.all(notificationPromises);

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'RISK_ALERT_SENT',
      entity_type: 'transaction',
      entity_id: transactionId,
      ip_address: null,
      user_agent: navigator.userAgent,
    });

    console.log(`Risk alert notification sent to ${admins.length} admin(s) for transaction ${transactionId}`);
  } catch (error) {
    console.error('Error sending risk alert notification:', error);
    throw error;
  }
}
