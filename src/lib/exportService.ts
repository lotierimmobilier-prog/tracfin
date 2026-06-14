import { supabase } from './supabase';

export interface ExportPackage {
  version: '1.0';
  exported_at: string;
  source: 'tracfin-kyc';
  users?: ExportedUser[];
  clients?: ExportedClient[];
  beneficial_owners?: ExportedBeneficialOwner[];
  transactions?: ExportedTransaction[];
}

export type ExportedUser = {
  email: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  rcs_number: string | null;
  rcs_city: string | null;
  role: 'agent' | 'compliance_officer' | 'admin';
};

export type ExportedClient = {
  // Identity
  client_type: 'individual' | 'legal_entity';
  client_role: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  legal_form: string | null;
  siren: string | null;
  siret: string | null;
  legal_representative_name: string | null;
  // Personal
  birth_date: string | null;
  birth_place: string | null;
  nationality: string | null;
  // Document
  id_document_type: string | null;
  id_document_number: string | null;
  id_document_issue_date: string | null;
  id_document_expiry: string | null;
  // Contact
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  // Financial
  profession: string | null;
  annual_income: number | null;
  income_source: string | null;
  // Compliance
  is_pep: boolean;
  pep_details: string | null;
  risk_level: 'low' | 'medium' | 'high';
  doubt_level: 'none' | 'low' | 'medium' | 'high';
  status: 'active' | 'archived';
  // Export-only reference (not re-imported as id)
  _export_ref: string;
};

export type ExportedBeneficialOwner = {
  _client_export_ref: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  birth_place: string | null;
  nationality: string | null;
  address: string | null;
  id_document_type: string | null;
  id_document_number: string | null;
  ownership_percentage: number | null;
  is_pep: boolean;
  pep_details: string | null;
};

export type ExportedTransaction = {
  // Link to client via export ref (optional)
  _client_export_ref: string | null;
  transaction_type: 'sale' | 'purchase' | 'rental';
  property_address: string;
  property_city: string | null;
  property_postal_code: string | null;
  property_type: string | null;
  transaction_amount: number;
  payment_method: string | null;
  payment_origin: string | null;
  payment_destination: string | null;
  has_third_party: boolean;
  third_party_details: string | null;
  unusual_urgency: boolean;
  suspicion_detected_date: string | null;
  transaction_date: string | null;
  status: 'in_progress' | 'completed' | 'cancelled';
  risk_level: 'low' | 'medium' | 'high';
};

export type ExportScope = 'clients' | 'transactions' | 'both' | 'users';

export async function buildExportPackage(scope: ExportScope): Promise<ExportPackage> {
  const pkg: ExportPackage = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    source: 'tracfin-kyc',
  };

  if (scope === 'users') {
    const { data, error } = await supabase
      .from('users')
      .select('email,full_name,first_name,last_name,phone,rcs_number,rcs_city,role')
      .order('created_at', { ascending: true });
    if (error) throw error;
    pkg.users = (data || []) as ExportedUser[];
    return pkg;
  }

  if (scope === 'clients' || scope === 'both') {
    const { data: clientsData, error: cErr } = await supabase
      .from('clients')
      .select('*')
      .eq('is_draft', false)
      .order('created_at', { ascending: true });

    if (cErr) throw cErr;

    pkg.clients = (clientsData || []).map((c) => ({
      _export_ref: c.id,
      client_type: c.client_type,
      client_role: c.client_role,
      first_name: c.first_name,
      last_name: c.last_name,
      company_name: c.company_name,
      legal_form: c.legal_form,
      siren: c.siren,
      siret: c.siret,
      legal_representative_name: c.legal_representative_name,
      birth_date: c.birth_date,
      birth_place: c.birth_place,
      nationality: c.nationality,
      id_document_type: c.id_document_type,
      id_document_number: c.id_document_number,
      id_document_issue_date: c.id_document_issue_date,
      id_document_expiry: c.id_document_expiry,
      address: c.address,
      city: c.city,
      postal_code: c.postal_code,
      country: c.country,
      phone: c.phone,
      email: c.email,
      profession: c.profession,
      annual_income: c.annual_income,
      income_source: c.income_source,
      is_pep: c.is_pep,
      pep_details: c.pep_details,
      risk_level: c.risk_level,
      doubt_level: c.doubt_level,
      status: c.status,
    }));

    const clientIds = (clientsData || []).map((c) => c.id);
    if (clientIds.length > 0) {
      const { data: ownersData, error: oErr } = await supabase
        .from('beneficial_owners')
        .select('*')
        .in('client_id', clientIds);

      if (oErr) throw oErr;

      pkg.beneficial_owners = (ownersData || []).map((o) => ({
        _client_export_ref: o.client_id,
        first_name: o.first_name,
        last_name: o.last_name,
        birth_date: o.birth_date,
        birth_place: o.birth_place,
        nationality: o.nationality,
        address: o.address,
        id_document_type: o.id_document_type,
        id_document_number: o.id_document_number,
        ownership_percentage: o.ownership_percentage,
        is_pep: o.is_pep,
        pep_details: o.pep_details,
      }));
    }
  }

  if (scope === 'transactions' || scope === 'both') {
    const { data: txData, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: true });

    if (txErr) throw txErr;

    pkg.transactions = (txData || []).map((t) => ({
      _client_export_ref: t.client_id,
      transaction_type: t.transaction_type,
      property_address: t.property_address,
      property_city: t.property_city,
      property_postal_code: t.property_postal_code,
      property_type: t.property_type,
      transaction_amount: t.transaction_amount,
      payment_method: t.payment_method,
      payment_origin: t.payment_origin,
      payment_destination: t.payment_destination,
      has_third_party: t.has_third_party,
      third_party_details: t.third_party_details,
      unusual_urgency: t.unusual_urgency,
      suspicion_detected_date: t.suspicion_detected_date,
      transaction_date: t.transaction_date,
      status: t.status,
      risk_level: t.risk_level,
    }));
  }

  return pkg;
}

export function downloadJson(pkg: ExportPackage, filename: string) {
  const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import ────────────────────────────────────────────────────────────────────

export interface ImportResult {
  users_imported: number;
  users_skipped: number;
  clients_imported: number;
  clients_skipped: number;
  beneficial_owners_imported: number;
  transactions_imported: number;
  errors: string[];
}

export async function importPackage(
  pkg: ExportPackage,
  agentId: string,
  tempPassword?: string,
  adminEmail?: string
): Promise<ImportResult> {
  const result: ImportResult = {
    users_imported: 0,
    users_skipped: 0,
    clients_imported: 0,
    clients_skipped: 0,
    beneficial_owners_imported: 0,
    transactions_imported: 0,
    errors: [],
  };

  if (pkg.users && pkg.users.length > 0) {
    const password = tempPassword || 'Tracfin2025!';
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`;

    for (const u of pkg.users) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            email: u.email,
            password,
            full_name: u.full_name,
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            phone: u.phone || '',
            rcs_number: u.rcs_number || '',
            rcs_city: u.rcs_city || '',
            role: u.role,
            admin_email: adminEmail || '',
          }),
        });
        const res = await response.json();
        if (!response.ok) {
          result.errors.push(`Utilisateur ${u.email}: ${res.error || response.status}`);
          result.users_skipped++;
        } else {
          result.users_imported++;
        }
      } catch (e: any) {
        result.errors.push(`Utilisateur ${u.email}: ${e.message}`);
        result.users_skipped++;
      }
    }
  }

  // Map old export_ref → new inserted id
  const refToNewId = new Map<string, string>();

  if (pkg.clients) {
    for (const ec of pkg.clients) {
      const { _export_ref, ...fields } = ec;
      try {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            ...fields,
            is_draft: false,
            created_by: agentId,
            agent_id: agentId,
          })
          .select('id')
          .single();

        if (error) {
          result.errors.push(`Client ${ec.first_name || ec.company_name}: ${error.message}`);
          result.clients_skipped++;
        } else {
          refToNewId.set(_export_ref, data.id);
          result.clients_imported++;
        }
      } catch (e: any) {
        result.errors.push(`Client ${ec.first_name || ec.company_name}: ${e.message}`);
        result.clients_skipped++;
      }
    }
  }

  if (pkg.beneficial_owners) {
    for (const bo of pkg.beneficial_owners) {
      const newClientId = refToNewId.get(bo._client_export_ref);
      if (!newClientId) continue;
      const { _client_export_ref, ...fields } = bo;
      try {
        const { error } = await supabase
          .from('beneficial_owners')
          .insert({ ...fields, client_id: newClientId });
        if (!error) result.beneficial_owners_imported++;
      } catch {
        // non-blocking
      }
    }
  }

  if (pkg.transactions) {
    for (const tx of pkg.transactions) {
      const newClientId = tx._client_export_ref
        ? refToNewId.get(tx._client_export_ref)
        : undefined;

      if (!newClientId && tx._client_export_ref) {
        result.errors.push(
          `Transaction "${tx.property_address}": client de référence non trouvé (importez les clients d'abord)`
        );
        continue;
      }

      const { _client_export_ref, ...fields } = tx;
      try {
        const { error } = await supabase.from('transactions').insert({
          ...fields,
          client_id: newClientId!,
          created_by: agentId,
        });
        if (error) {
          result.errors.push(`Transaction "${tx.property_address}": ${error.message}`);
        } else {
          result.transactions_imported++;
        }
      } catch (e: any) {
        result.errors.push(`Transaction "${tx.property_address}": ${e.message}`);
      }
    }
  }

  return result;
}
