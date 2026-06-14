import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  client_id: string;
  agent_email: string;
}

async function generateKYCPDF(client: any, agentEmail: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const clientName = client.client_type === 'legal_entity'
    ? client.company_name
    : `${client.first_name} ${client.last_name}`;

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let y = height - 50;

  page.drawText('DÉCLARATION KYC', {
    x: 50,
    y: y,
    size: 24,
    font: fontBold,
    color: rgb(0.11, 0.16, 0.23),
  });

  page.drawText('(Know Your Customer)', {
    x: 50,
    y: y - 25,
    size: 12,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  y -= 60;
  page.drawText(`Date: ${currentDate}`, {
    x: 50,
    y: y,
    size: 11,
    font: font,
  });

  y -= 40;
  page.drawText('Informations Client', {
    x: 50,
    y: y,
    size: 16,
    font: fontBold,
    color: rgb(0.27, 0.32, 0.41),
  });

  y -= 25;
  page.drawRectangle({
    x: 50,
    y: y - 120,
    width: width - 100,
    height: 120,
    color: rgb(0.95, 0.96, 0.97),
  });

  y -= 20;
  page.drawText(`Nom: ${clientName}`, {
    x: 60,
    y: y,
    size: 10,
    font: font,
  });

  y -= 20;
  page.drawText(`Type: ${client.client_type === 'legal_entity' ? 'Personne Morale' : 'Personne Physique'}`, {
    x: 60,
    y: y,
    size: 10,
    font: font,
  });

  if (client.email) {
    y -= 20;
    page.drawText(`Email: ${client.email}`, {
      x: 60,
      y: y,
      size: 10,
      font: font,
    });
  }

  if (client.phone) {
    y -= 20;
    page.drawText(`Téléphone: ${client.phone}`, {
      x: 60,
      y: y,
      size: 10,
      font: font,
    });
  }

  if (client.address) {
    y -= 20;
    page.drawText(`Adresse: ${client.address}`, {
      x: 60,
      y: y,
      size: 10,
      font: font,
    });
  }

  y -= 40;
  page.drawText('Évaluation des Risques', {
    x: 50,
    y: y,
    size: 16,
    font: fontBold,
    color: rgb(0.27, 0.32, 0.41),
  });

  y -= 25;
  const riskLabel = client.risk_level === 'high' ? 'Élevé' : client.risk_level === 'medium' ? 'Moyen' : 'Faible';
  page.drawText(`Niveau de risque: ${riskLabel}`, {
    x: 60,
    y: y,
    size: 10,
    font: font,
  });

  if (client.is_pep) {
    y -= 20;
    page.drawText('⚠️ Personne Politiquement Exposée (PPE)', {
      x: 60,
      y: y,
      size: 10,
      font: fontBold,
      color: rgb(0.86, 0.15, 0.15),
    });
  }

  y -= 40;
  page.drawText('Déclaration', {
    x: 50,
    y: y,
    size: 16,
    font: fontBold,
    color: rgb(0.27, 0.32, 0.41),
  });

  y -= 25;
  const declarationText = 'Je, soussigné(e), agent TRACFIN, certifie avoir vérifié les informations du';
  page.drawText(declarationText, {
    x: 50,
    y: y,
    size: 10,
    font: font,
  });

  y -= 15;
  page.drawText('client mentionné ci-dessus conformément aux réglementations en vigueur en', {
    x: 50,
    y: y,
    size: 10,
    font: font,
  });

  y -= 15;
  page.drawText('matière de lutte contre le blanchiment d\'argent et le financement du terrorisme.', {
    x: 50,
    y: y,
    size: 10,
    font: font,
  });

  y -= 50;
  page.drawRectangle({
    x: 50,
    y: y - 80,
    width: width - 100,
    height: 80,
    borderColor: rgb(0.8, 0.83, 0.88),
    borderWidth: 2,
  });

  y -= 20;
  page.drawText('Signature de l\'agent', {
    x: (width - 150) / 2,
    y: y,
    size: 12,
    font: fontBold,
  });

  y -= 25;
  page.drawText(agentEmail, {
    x: (width - agentEmail.length * 6) / 2,
    y: y,
    size: 10,
    font: font,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { client_id, agent_email }: RequestBody = await req.json();

    if (!client_id || !agent_email) {
      return new Response(
        JSON.stringify({ error: "client_id et agent_email sont requis" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: client, error: clientError } = await supabaseClient
      .from("clients")
      .select("*")
      .eq("id", client_id)
      .maybeSingle();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: "Client non trouvé" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const yousignApiKey = Deno.env.get("YOUSIGN_API_KEY");

    if (!yousignApiKey) {
      return new Response(
        JSON.stringify({
          error: "Configuration YouSign manquante",
          message: "Veuillez configurer YOUSIGN_API_KEY dans les variables d'environnement"
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const clientName = client.client_type === 'legal_entity'
      ? client.company_name
      : `${client.first_name} ${client.last_name}`;

    const yousignBaseUrl = "https://api-sandbox.yousign.app/v3";

    console.log('[YouSign] Step 1: Creating signature request for', clientName);
    const createRequestBody = {
      name: `Déclaration KYC - ${clientName}`,
      delivery_mode: "email",
    };

    const createRequestResponse = await fetch(
      `${yousignBaseUrl}/signature_requests`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${yousignApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createRequestBody),
      }
    );

    console.log('[YouSign] Create request status:', createRequestResponse.status);

    if (!createRequestResponse.ok) {
      const errorData = await createRequestResponse.text();
      console.error("[YouSign] Create Request Error:", errorData);

      return new Response(
        JSON.stringify({
          error: "Erreur lors de la création de la demande de signature",
          details: errorData,
          step: "create_request"
        }),
        {
          status: createRequestResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const signatureRequest = await createRequestResponse.json();
    const signatureRequestId = signatureRequest.id;
    console.log('[YouSign] Signature request created with ID:', signatureRequestId);

    console.log('[YouSign] Step 2: Generating PDF document...');
    const pdfBytes = await generateKYCPDF(client, agent_email);
    console.log('[YouSign] PDF generated, size:', pdfBytes.length, 'bytes');

    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

    const formData = new FormData();
    formData.append("file", pdfBlob, "declaration-kyc.pdf");
    formData.append("nature", "signable_document");

    console.log('[YouSign] Step 3: Uploading document...');
    const uploadDocResponse = await fetch(
      `${yousignBaseUrl}/signature_requests/${signatureRequestId}/documents`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${yousignApiKey}`,
        },
        body: formData,
      }
    );

    console.log('[YouSign] Upload document status:', uploadDocResponse.status);

    if (!uploadDocResponse.ok) {
      const errorData = await uploadDocResponse.text();
      console.error("[YouSign] Upload Document Error:", errorData);

      return new Response(
        JSON.stringify({
          error: "Erreur lors de l'upload du document",
          details: errorData,
          step: "upload_document"
        }),
        {
          status: uploadDocResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const document = await uploadDocResponse.json();
    const documentId = document.id;
    console.log('[YouSign] Document uploaded with ID:', documentId);

    console.log('[YouSign] Step 4: Adding signer...');
    const signerBody = {
      info: {
        first_name: "Agent",
        last_name: "TRACFIN",
        email: agent_email,
        locale: "fr",
      },
      signature_level: "electronic_signature",
      signature_authentication_mode: "no_otp",
      fields: [
        {
          type: "signature",
          document_id: documentId,
          page: 1,
          x: 200,
          y: 600,
        },
      ],
    };

    const addSignerResponse = await fetch(
      `${yousignBaseUrl}/signature_requests/${signatureRequestId}/signers`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${yousignApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signerBody),
      }
    );

    console.log('[YouSign] Add signer status:', addSignerResponse.status);

    if (!addSignerResponse.ok) {
      const errorData = await addSignerResponse.text();
      console.error("[YouSign] Add Signer Error:", errorData);

      return new Response(
        JSON.stringify({
          error: "Erreur lors de l'ajout du signataire",
          details: errorData,
          step: "add_signer"
        }),
        {
          status: addSignerResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const signer = await addSignerResponse.json();
    console.log('[YouSign] Signer added, ID:', signer.id);

    console.log('[YouSign] Step 5: Activating signature request...');
    const activateResponse = await fetch(
      `${yousignBaseUrl}/signature_requests/${signatureRequestId}/activate`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${yousignApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log('[YouSign] Activate status:', activateResponse.status);

    if (!activateResponse.ok) {
      const errorData = await activateResponse.text();
      console.error("[YouSign] Activate Error:", errorData);

      return new Response(
        JSON.stringify({
          error: "Erreur lors de l'activation de la demande",
          details: errorData,
          step: "activate"
        }),
        {
          status: activateResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log('[YouSign] Signature request activated successfully!');

    await supabaseClient.from("audit_logs").insert({
      action: "SIGNATURE_REQUESTED",
      entity_type: "client",
      entity_id: client_id,
      new_values: {
        signature_request_id: signatureRequestId,
        client_name: clientName,
        agent_email: agent_email,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        signature_url: signer.signature_link,
        signature_request_id: signatureRequestId,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);

    return new Response(
      JSON.stringify({
        error: "Erreur interne du serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
