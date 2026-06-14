import { useState } from 'react';
import { Download, ChevronRight, User, FileText, ClipboardCheck, Bell, Ligature as FileSignature } from 'lucide-react';

export function Tutorial() {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  const steps = [
    {
      id: 1,
      title: "Connexion à la plateforme",
      icon: User,
      description: "Première étape pour accéder au système TRACFIN",
      details: [
        "Accédez à l'URL de la plateforme TRACFIN fournie par votre administrateur",
        "Saisissez votre adresse email professionnelle",
        "Entrez votre mot de passe (8 caractères minimum, avec majuscules, minuscules et chiffres)",
        "Cliquez sur 'Se connecter'",
        "Si vous avez oublié votre mot de passe, cliquez sur 'Mot de passe oublié' pour le réinitialiser"
      ],
      screenshot: "Page de connexion avec champs email et mot de passe",
      tips: [
        "Conservez vos identifiants en sécurité",
        "Ne partagez jamais votre mot de passe",
        "Déconnectez-vous après chaque session"
      ]
    },
    {
      id: 2,
      title: "Tableau de bord",
      icon: FileText,
      description: "Vue d'ensemble de votre activité",
      details: [
        "Le tableau de bord affiche un résumé de votre activité",
        "Vous y trouverez le nombre total de clients, transactions et alertes",
        "Les graphiques montrent l'évolution de votre activité",
        "Les alertes récentes sont affichées en haut à droite",
        "Utilisez les cartes de statistiques pour naviguer rapidement vers les sections concernées"
      ],
      screenshot: "Tableau de bord avec statistiques, graphiques et alertes",
      tips: [
        "Consultez le tableau de bord quotidiennement",
        "Vérifiez les alertes en priorité",
        "Utilisez les filtres pour affiner vos données"
      ]
    },
    {
      id: 3,
      title: "Créer un nouveau client",
      icon: User,
      description: "Enregistrement d'un client personne physique ou morale",
      details: [
        "Cliquez sur 'Clients' dans le menu latéral",
        "Cliquez sur le bouton '+ Nouveau client' en haut à droite",
        "Choisissez le type de client : Personne physique ou Personne morale",
        "",
        "Pour une PERSONNE PHYSIQUE :",
        "• Étape 1 - Identité : Nom, prénom, date de naissance, nationalité, profession",
        "• Étape 2 - Adresse : Adresse complète, ville, code postal, pays",
        "• Étape 3 - Documents : Téléchargez pièce d'identité et justificatif de domicile",
        "• Étape 4 - Signature : Le client signe électroniquement le document",
        "",
        "Pour une PERSONNE MORALE :",
        "• Étape 1 - Identité de l'entreprise : Raison sociale, SIRET, forme juridique",
        "• Étape 2 - Adresse du siège social",
        "• Étape 3 - Bénéficiaires effectifs : Identité des personnes détenant +25% du capital",
        "• Étape 4 - Documents : Kbis, statuts, pièces d'identité des bénéficiaires",
        "• Étape 5 - Signature du représentant légal",
        "",
        "Cliquez sur 'Suivant' entre chaque étape",
        "Vérifiez toutes les informations avant de finaliser"
      ],
      screenshot: "Formulaire multi-étapes de création de client",
      tips: [
        "Vérifiez l'exactitude des informations saisies",
        "Les champs avec * sont obligatoires",
        "Les documents doivent être au format PDF ou image (max 5 Mo)",
        "La signature électronique est obligatoire pour valider le dossier",
        "Pour les personnes morales, identifiez tous les bénéficiaires effectifs"
      ]
    },
    {
      id: 4,
      title: "Enregistrer une transaction",
      icon: FileText,
      description: "Création d'une nouvelle transaction immobilière",
      details: [
        "Cliquez sur 'Transactions' dans le menu latéral",
        "Cliquez sur '+ Nouvelle transaction'",
        "Sélectionnez le client concerné dans la liste déroulante",
        "Choisissez le type de transaction : Vente, Achat ou Location",
        "Renseignez l'adresse complète du bien (adresse, ville, code postal)",
        "Indiquez le montant de la transaction en euros",
        "Saisissez la date de signature du mandat",
        "Précisez l'origine des fonds (épargne, prêt bancaire, etc.)",
        "Si un tiers intervient, cochez la case et renseignez ses informations",
        "Cliquez sur 'Créer la transaction'"
      ],
      screenshot: "Formulaire de création de transaction",
      tips: [
        "Vérifiez que le client existe avant de créer la transaction",
        "Le montant doit être cohérent avec le type de bien",
        "L'origine des fonds est une information cruciale pour TRACFIN",
        "Toute intervention de tiers doit être documentée"
      ]
    },
    {
      id: 5,
      title: "Gérer les alertes",
      icon: Bell,
      description: "Traitement des alertes et signaux suspects",
      details: [
        "Accédez à 'Alertes' dans le menu latéral",
        "Les alertes sont classées par niveau : Faible, Moyen, Élevé, Critique",
        "Cliquez sur une alerte pour voir les détails",
        "Analysez les informations : client concerné, type d'alerte, montant",
        "Actions possibles :",
        "• 'Marquer comme traitée' si l'alerte est justifiée et résolue",
        "• 'Créer une déclaration TRACFIN' si l'alerte est fondée",
        "• Ajouter des notes pour documenter votre analyse",
        "Toutes vos actions sont enregistrées dans l'historique"
      ],
      screenshot: "Liste des alertes avec niveaux de priorité",
      tips: [
        "Traitez les alertes critiques en priorité",
        "Ne supprimez jamais une alerte sans analyse",
        "Documentez systématiquement vos décisions",
        "En cas de doute, consultez votre responsable conformité"
      ]
    },
    {
      id: 6,
      title: "Formulaire de déclaration TRACFIN",
      icon: FileSignature,
      description: "Comment remplir le formulaire de déclaration de soupçon TRACFIN",
      details: [
        "Accédez à 'Déclarations TRACFIN' dans le menu",
        "Cliquez sur '+ Nouvelle déclaration'",
        "Sélectionnez le client concerné dans la liste déroulante",
        "",
        "SECTION 1 - Identification du déclarant :",
        "• Nom et prénom de l'agent commercial",
        "• Numéro de carte professionnelle",
        "• Agence et coordonnées",
        "",
        "SECTION 2 - Informations sur le client :",
        "• Type de personne (physique/morale)",
        "• Identité complète",
        "• Coordonnées et nationalité",
        "• Profession ou activité",
        "",
        "SECTION 3 - Description de l'opération suspecte :",
        "• Nature de l'opération (vente, achat, location)",
        "• Montant de la transaction",
        "• Date de l'opération",
        "• Adresse du bien concerné",
        "",
        "SECTION 4 - Motif du soupçon :",
        "• Incohérence entre revenus et montant",
        "• Origine des fonds suspecte ou non justifiée",
        "• Comportement inhabituel du client",
        "• Montage juridique ou financier complexe",
        "• Pression pour accélérer la transaction",
        "• Refus de fournir certains documents",
        "",
        "SECTION 5 - Documents justificatifs :",
        "• Joindre toutes les pièces pertinentes",
        "• Copies des documents d'identité",
        "• Justificatifs de fonds si disponibles",
        "• Correspondances avec le client",
        "",
        "SECTION 6 - Description détaillée :",
        "• Rédigez un récit chronologique des faits",
        "• Soyez factuel, précis et objectif",
        "• Mentionnez tous les éléments suspects observés",
        "• Indiquez toute démarche déjà effectuée",
        "",
        "Vérification finale :",
        "• Relisez attentivement l'ensemble du formulaire",
        "• Vérifiez que tous les champs obligatoires sont remplis",
        "• Assurez-vous de la cohérence des informations",
        "",
        "Soumission :",
        "• Cliquez sur 'Soumettre la déclaration'",
        "• Un numéro de déclaration unique vous sera attribué",
        "• Conservez ce numéro pour tout suivi ultérieur",
        "• La déclaration sera transmise automatiquement au référent de l'agence"
      ],
      screenshot: "Formulaire détaillé de déclaration TRACFIN avec sections numérotées",
      tips: [
        "Une déclaration de soupçon est OBLIGATOIRE dès le moindre doute",
        "Soyez exhaustif : mieux vaut trop d'informations que pas assez",
        "Restez factuel, évitez les suppositions ou jugements personnels",
        "Ne prévenez JAMAIS le client qu'une déclaration est en cours",
        "Conservez la confidentialité ABSOLUE (obligation légale)",
        "Rassemblez tous les documents AVANT de commencer le formulaire",
        "En cas de doute sur un champ, contactez votre responsable conformité",
        "Le délai de transmission à TRACFIN est de 72h après déclaration"
      ]
    }
  ];

  const handleDownloadPDF = () => {
    // Create a printable HTML document
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guide TRACFIN - Guide utilisateur complet</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: white;
      padding: 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      padding: 40px 20px;
      background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
      color: white;
      border-radius: 12px;
      margin-bottom: 40px;
    }

    .header h1 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .header p {
      font-size: 16px;
      opacity: 0.9;
    }

    .intro {
      background: #f8fafc;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 40px;
      border-left: 4px solid #1e293b;
    }

    .intro h2 {
      font-size: 24px;
      margin-bottom: 15px;
      color: #1e293b;
    }

    .intro p {
      margin-bottom: 12px;
      color: #475569;
    }

    .alert-box {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }

    .alert-box h3 {
      color: #92400e;
      font-size: 18px;
      margin-bottom: 8px;
    }

    .alert-box p {
      color: #78350f;
      font-size: 14px;
    }

    .toc {
      background: white;
      padding: 30px;
      border-radius: 12px;
      border: 2px solid #e2e8f0;
      margin-bottom: 40px;
    }

    .toc h2 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #1e293b;
    }

    .toc ol {
      list-style: none;
      counter-reset: toc-counter;
    }

    .toc li {
      counter-increment: toc-counter;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 16px;
    }

    .toc li:before {
      content: counter(toc-counter) ". ";
      font-weight: 700;
      color: #1e293b;
      margin-right: 8px;
    }

    .toc li:last-child {
      border-bottom: none;
    }

    .step {
      page-break-inside: avoid;
      background: white;
      padding: 30px;
      border-radius: 12px;
      border: 2px solid #e2e8f0;
      margin-bottom: 30px;
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e2e8f0;
    }

    .step-number {
      background: #1e293b;
      color: white;
      width: 50px;
      height: 50px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .step-title {
      flex: 1;
    }

    .step-title h3 {
      font-size: 22px;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .step-title p {
      color: #64748b;
      font-size: 14px;
    }

    .screenshot {
      background: #f1f5f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #3b82f6;
    }

    .screenshot h4 {
      font-size: 16px;
      color: #1e293b;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .screenshot p {
      color: #475569;
      font-style: italic;
      font-size: 14px;
    }

    .details {
      margin: 20px 0;
    }

    .details h4 {
      font-size: 16px;
      color: #1e293b;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .details ol, .details ul {
      margin-left: 20px;
    }

    .details li {
      margin-bottom: 8px;
      color: #475569;
      line-height: 1.6;
    }

    .details li.section-title {
      font-weight: 600;
      color: #1e293b;
      margin-top: 12px;
      list-style: none;
      margin-left: -20px;
    }

    .details li.bullet {
      list-style: disc;
    }

    .tips {
      background: #ecfdf5;
      border: 2px solid #10b981;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }

    .tips h4 {
      font-size: 16px;
      color: #065f46;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tips ul {
      list-style: none;
    }

    .tips li {
      padding: 6px 0;
      color: #047857;
      font-size: 14px;
      display: flex;
      align-items: start;
      gap: 8px;
    }

    .tips li:before {
      content: "•";
      color: #10b981;
      font-weight: 700;
      font-size: 18px;
    }

    .footer {
      background: #f8fafc;
      padding: 30px;
      border-radius: 12px;
      margin-top: 40px;
      border-top: 3px solid #1e293b;
    }

    .footer h3 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #1e293b;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .footer-box {
      background: white;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .footer-box h4 {
      font-size: 16px;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .footer-box p {
      color: #64748b;
      font-size: 14px;
    }

    .footer-info {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 12px;
    }

    @media print {
      body {
        padding: 0;
      }

      .step {
        page-break-inside: avoid;
      }

      @page {
        margin: 2cm;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 GUIDE UTILISATEUR TRACFIN</h1>
      <p>Guide complet pour les agents commerciaux - Toutes les étapes pour utiliser la plateforme efficacement</p>
    </div>

    <div class="intro">
      <h2>Bienvenue sur la plateforme TRACFIN</h2>
      <p>
        Ce guide vous accompagne dans l'utilisation quotidienne de la plateforme TRACFIN.
        Vous y trouverez toutes les informations nécessaires pour effectuer vos tâches en conformité
        avec la réglementation anti-blanchiment (LCB-FT).
      </p>
      <p>
        La plateforme vous permet de gérer vos clients, enregistrer les transactions, traiter les alertes
        et effectuer vos déclarations de soupçon en toute sécurité.
      </p>
      <div class="alert-box">
        <h3>⚠️ Rappel important</h3>
        <p>
          En tant qu'agent commercial dans l'immobilier, vous êtes soumis aux obligations de vigilance
          et de déclaration prévues par le Code monétaire et financier. Toute déclaration de soupçon
          doit rester strictement confidentielle.
        </p>
      </div>
    </div>

    <div class="toc">
      <h2>📋 Table des matières</h2>
      <ol>
        ${steps.map(step => `<li>${step.title}</li>`).join('')}
      </ol>
    </div>

    ${steps.map(step => `
      <div class="step">
        <div class="step-header">
          <div class="step-number">${step.id}</div>
          <div class="step-title">
            <h3>${step.title}</h3>
            <p>${step.description}</p>
          </div>
        </div>

        <div class="screenshot">
          <h4>📸 Aperçu de l'écran</h4>
          <p>${step.screenshot}</p>
        </div>

        <div class="details">
          <h4>📋 Étapes détaillées</h4>
          <ol>
            ${step.details.map(detail => {
              if (!detail) return '';
              if (detail.startsWith('•')) {
                return `<li class="bullet">${detail.substring(1).trim()}</li>`;
              }
              if (detail.startsWith('Pour') || detail.startsWith('Étape') || detail.startsWith('SECTION') || detail.startsWith('Vérification') || detail.startsWith('Soumission')) {
                return `<li class="section-title">${detail}</li>`;
              }
              return `<li>${detail}</li>`;
            }).join('')}
          </ol>
        </div>

        <div class="tips">
          <h4>💡 Conseils pratiques</h4>
          <ul>
            ${step.tips.map(tip => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
      </div>
    `).join('')}

    <div class="footer">
      <h3>Besoin d'aide ?</h3>
      <div class="footer-grid">
        <div class="footer-box">
          <h4>Support technique</h4>
          <p>Email : jerome.bouba@lotier-immobilier.com</p>
        </div>
        <div class="footer-box">
          <h4>Assistance conformité</h4>
          <p>Contactez votre responsable conformité</p>
        </div>
      </div>
      <div class="footer-info">
        <p>© ${new Date().getFullYear()} TRACFIN Platform - Tous droits réservés</p>
        <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  const toggleStep = (stepId: number) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">
                Guide utilisateur TRACFIN
              </h1>
              <p className="text-slate-600 text-lg">
                Guide complet pour les agents commerciaux - Toutes les étapes pour utiliser la plateforme efficacement
              </p>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-md"
            >
              <Download className="w-5 h-5" />
              Télécharger le guide
            </button>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Bienvenue sur la plateforme TRACFIN
          </h2>
          <div className="space-y-4 text-slate-700 leading-relaxed">
            <p>
              Ce guide vous accompagne dans l'utilisation quotidienne de la plateforme TRACFIN.
              Vous y trouverez toutes les informations nécessaires pour effectuer vos tâches en conformité
              avec la réglementation anti-blanchiment (LCB-FT).
            </p>
            <p>
              La plateforme vous permet de gérer vos clients, enregistrer les transactions, traiter les alertes
              et effectuer vos déclarations de soupçon en toute sécurité.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-amber-900 mb-2">⚠️ Rappel important</h3>
              <p className="text-amber-800 text-sm">
                En tant qu'agent commercial dans l'immobilier, vous êtes soumis aux obligations de vigilance
                et de déclaration prévues par le Code monétaire et financier. Toute déclaration de soupçon
                doit rester strictement confidentielle.
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = step.icon;
            const isExpanded = expandedStep === step.id;

            return (
              <div
                key={step.id}
                className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleStep(step.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                      {step.id}
                    </div>
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-slate-600" />
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {step.title}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-6 h-6 text-slate-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-lg p-6 mb-6">
                      <h4 className="font-semibold text-slate-900 mb-3">
                        📸 Aperçu
                      </h4>
                      <p className="text-slate-700 italic">
                        {step.screenshot}
                      </p>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold text-slate-900 mb-3">
                        📋 Étapes détaillées
                      </h4>
                      <ol className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li
                            key={idx}
                            className={`text-slate-700 ${
                              detail.startsWith('•')
                                ? 'ml-6 list-none'
                                : detail.startsWith('Pour') || detail.startsWith('Étape') || detail.startsWith('SECTION') || detail.startsWith('Vérification') || detail.startsWith('Soumission') || detail === ''
                                ? 'list-none font-semibold mt-3'
                                : 'ml-4'
                            }`}
                          >
                            {detail}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-3">
                        💡 Conseils pratiques
                      </h4>
                      <ul className="space-y-2">
                        {step.tips.map((tip, idx) => (
                          <li key={idx} className="text-green-800 text-sm flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Besoin d'aide ?
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">
                Support technique
              </h4>
              <p className="text-slate-600">
                Email : jerome.bouba@lotier-immobilier.com
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">
                Assistance conformité
              </h4>
              <p className="text-slate-600">
                Contactez votre responsable conformité
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
