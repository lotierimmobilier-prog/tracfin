import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, X-Admin-Email',
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  rcs_number: string;
  rcs_city: string;
  role: 'agent' | 'compliance_officer' | 'admin';
  admin_email: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuration serveur manquante');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const requestData: CreateUserRequest = await req.json();
    const { email, password, full_name, first_name, last_name, phone, rcs_number, rcs_city, role, admin_email } = requestData;

    if (!admin_email) {
      return new Response(
        JSON.stringify({ error: 'Email admin requis' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Vérifier que l'email admin existe et a bien le rôle admin
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', admin_email)
      .maybeSingle();

    if (adminError || !adminProfile || adminProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Accès refusé: droits administrateur requis' }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!email || !password || !full_name || !first_name || !last_name || !role) {
      throw new Error('Données manquantes: email, password, nom complet, prénom, nom et rôle requis');
    }

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      throw new Error(createError.message || 'Erreur lors de la création du compte');
    }

    if (!authData.user) {
      throw new Error('Erreur lors de la création du compte');
    }

    const { error: profileInsertError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      full_name,
      first_name,
      last_name,
      phone,
      rcs_number,
      rcs_city,
      role,
    });

    if (profileInsertError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error('Erreur lors de la création du profil: ' + profileInsertError.message);
    }

    return new Response(
      JSON.stringify({ success: true, user: authData.user, userId: authData.user.id }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message || 'Erreur inconnue' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
