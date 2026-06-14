import { BookOpen, AlertTriangle, CheckCircle, FileText, Shield, Users, Building2, PenTool, Brain, Download, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AttestationSignatureModal } from '../components/guide/AttestationSignatureModal';
import { FlashcardsSection } from '../components/guide/FlashcardsSection';
import { useAuth } from '../contexts/AuthContext';

type Section = 'overview' | 'obligations' | 'criteria' | 'cartographie' | 'cases' | 'declaration' | 'resources' | 'flashcards' | 'validation';

export function Guide() {
  const [activeSection, setActiveSection] = useState<Section>('overview');

  const sections = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Shield },
    { id: 'obligations', label: 'Vos obligations', icon: CheckCircle },
    { id: 'criteria', label: 'Critères d\'alerte', icon: AlertTriangle },
    { id: 'cartographie', label: 'Cartographie & Typologie', icon: Building2 },
    { id: 'cases', label: 'Cas typologiques', icon: FileText },
    { id: 'declaration', label: 'Déclaration de soupçon', icon: Users },
    { id: 'resources', label: 'Guide Opérationnel TRACFIN', icon: Download },
    { id: 'flashcards', label: 'Flashcards d\'entraînement', icon: Brain },
    { id: 'validation', label: 'Attestation de formation', icon: PenTool },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-8 h-8 text-slate-900" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Guide TRACFIN</h1>
          <p className="text-slate-600 mt-1">Formation et bonnes pratiques LCB-FT</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as Section)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                    activeSection === section.id
                      ? 'bg-slate-900 text-white'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            {activeSection === 'overview' && <OverviewSection />}
            {activeSection === 'obligations' && <ObligationsSection />}
            {activeSection === 'criteria' && <CriteriaSection />}
            {activeSection === 'cartographie' && <CartographieSection />}
            {activeSection === 'cases' && <CasesSection />}
            {activeSection === 'declaration' && <DeclarationSection />}
            {activeSection === 'resources' && <ResourcesSection />}
            {activeSection === 'flashcards' && <FlashcardsSection />}
            {activeSection === 'validation' && <ValidationSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Qu'est-ce que TRACFIN ?</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          <strong>TRACFIN</strong> (Traitement du Renseignement et Action contre les Circuits Financiers clandestins)
          est le service de renseignement français chargé de la lutte contre le blanchiment d'argent et le financement
          du terrorisme.
        </p>
        <p className="text-slate-700 leading-relaxed">
          Les professionnels de l'immobilier sont <strong>assujettis aux obligations LCB-FT</strong> (Lutte Contre
          le Blanchiment et le Financement du Terrorisme) depuis 1998. Ils jouent un rôle essentiel dans la détection
          des opérations suspectes.
        </p>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl p-6 text-white">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
          <CheckCircle className="w-6 h-6" />
          Les avantages du registre Tracfin / LCB-FT
        </h3>
        <ul className="space-y-3 text-slate-100">
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Définir une équipe dédiée aux déclarations (organigramme Tracfin)</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Accéder au protocole Tracfin interne à l'entreprise</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Créer des fiches contacts pour vérifier l'identité des clients, identifier l'origine des fonds et conserver les pièces justificatives</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Simplifier vos vérifications clients grâce à l'interconnexion du registre avec les bases de données sécurisées d'instances reconnues</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Établir une cartographie des risques pour analyser chaque profil client et adapter votre niveau de vigilance en conséquence</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Effectuer vos déclarations de soupçons auprès de la cellule Tracfin</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Stocker et sécuriser en ligne toutes vos démarches Tracfin</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Accéder au registre en temps réel en cas de contrôle</span>
          </li>
        </ul>
      </div>

      <div className="bg-slate-50 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Professionnels concernés
        </h3>
        <ul className="space-y-2 text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-slate-400">•</span>
            <span>Agents immobiliers et intermédiaires en transactions immobilières</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-slate-400">•</span>
            <span>Syndics de copropriété (depuis 2014)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-slate-400">•</span>
            <span>Gestionnaires de location (depuis 2016)</span>
          </li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Pourquoi le secteur immobilier ?
        </h3>
        <p className="text-sm text-blue-800">
          L'immobilier constitue un <strong>vecteur privilégié de blanchiment</strong> en raison des montants
          élevés des transactions, de la possibilité d'opacifier l'origine des fonds et de la capacité à
          transférer de la valeur de manière durable.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl p-6 text-white text-center">
          <p className="text-3xl font-bold mb-2">84</p>
          <p className="text-sm text-slate-300">Déclarations en 2016</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl p-6 text-white text-center">
          <p className="text-3xl font-bold mb-2">178</p>
          <p className="text-sm text-slate-300">Déclarations en 2017</p>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-green-500 rounded-xl p-6 text-white text-center">
          <p className="text-3xl font-bold mb-2">↗</p>
          <p className="text-sm text-green-100">Tendance positive</p>
        </div>
      </div>
    </div>
  );
}

function ObligationsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Vos obligations en matière de LCB-FT</h2>
        <p className="text-slate-700 leading-relaxed">
          En tant que professionnel de l'immobilier, vous devez respecter plusieurs obligations légales
          pour prévenir le blanchiment d'argent et le financement du terrorisme.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-l-4 border-slate-900 bg-slate-50 p-6 rounded-r-xl">
          <h3 className="font-semibold text-slate-900 mb-3">1. Cartographie des risques</h3>
          <p className="text-slate-700 mb-3">
            Établir et maintenir une analyse des risques de blanchiment propres à votre activité.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Identifier les risques selon la nature des opérations</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Adapter les mesures de vigilance en fonction du niveau de risque</span>
            </li>
          </ul>
        </div>

        <div className="border-l-4 border-slate-900 bg-slate-50 p-6 rounded-r-xl">
          <h3 className="font-semibold text-slate-900 mb-3">2. Vigilance et identification du client</h3>
          <p className="text-slate-700 mb-3">
            Vérifier l'identité de vos clients et comprendre la nature de la relation d'affaires.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Recueillir les documents d'identité officiels</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Vérifier l'adresse et la situation professionnelle</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>S'assurer de la cohérence entre le profil et l'opération</span>
            </li>
          </ul>
        </div>

        <div className="border-l-4 border-slate-900 bg-slate-50 p-6 rounded-r-xl">
          <h3 className="font-semibold text-slate-900 mb-3">3. Identification du bénéficiaire effectif</h3>
          <p className="text-slate-700 mb-3">
            Pour les personnes morales, identifier la personne physique qui contrôle réellement l'entité.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Détenir plus de 25% du capital ou des droits de vote</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Exercer un pouvoir de contrôle sur les organes de direction</span>
            </li>
          </ul>
        </div>

        <div className="border-l-4 border-red-600 bg-red-50 p-6 rounded-r-xl">
          <h3 className="font-semibold text-red-900 mb-3">4. Détection des Personnes Politiquement Exposées (PPE)</h3>
          <p className="text-red-800 mb-3">
            Les PPE présentent un risque accru et nécessitent une vigilance renforcée.
          </p>
          <p className="text-sm text-red-700">
            <strong>Qui sont les PPE ?</strong> Dirigeants politiques, membres de gouvernement, parlementaires,
            hauts fonctionnaires, dirigeants d'entreprises publiques, ainsi que leurs proches collaborateurs
            et membres de leur famille.
          </p>
        </div>

        <div className="border-l-4 border-slate-900 bg-slate-50 p-6 rounded-r-xl">
          <h3 className="font-semibold text-slate-900 mb-3">5. Conservation des documents</h3>
          <p className="text-slate-700 mb-3">
            Archiver tous les documents et informations pendant une durée minimale de 5 ans.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Documents d'identité et justificatifs</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Analyses de risque et mesures de vigilance</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Correspondances et échanges liés à l'opération</span>
            </li>
          </ul>
        </div>

        <div className="border-l-4 border-orange-600 bg-orange-50 p-6 rounded-r-xl">
          <h3 className="font-semibold text-orange-900 mb-3">6. Déclaration de soupçon</h3>
          <p className="text-orange-800">
            Lorsque vous identifiez une opération suspecte, vous avez l'obligation de la déclarer à TRACFIN
            via le portail sécurisé ERMES. Cette déclaration est <strong>strictement confidentielle</strong>
            et vous protège juridiquement.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-xl p-6">
        <h3 className="font-semibold mb-2">⚠️ Sanctions en cas de non-respect</h3>
        <p className="text-slate-300 text-sm">
          Le non-respect des obligations LCB-FT peut entraîner des sanctions administratives et pénales,
          y compris des amendes significatives et la suspension d'activité.
        </p>
      </div>
    </div>
  );
}

function CriteriaSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Critères d'alerte et signaux suspects</h2>
        <p className="text-slate-700 leading-relaxed">
          Certains indices doivent vous alerter et vous conduire à approfondir votre vigilance.
          Voici les principaux critères d'alerte à surveiller :
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Incohérence financière</h3>
              <p className="text-sm text-red-800">
                Discordance entre le profil du client (âge, revenus, profession) et la valeur du bien immobilier.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Prix suspect</h3>
              <p className="text-sm text-red-800">
                Discordance entre la valeur de marché du bien et le montant de la transaction (sur/sous-évaluation).
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-2">Présence d'un tiers</h3>
              <p className="text-sm text-orange-800">
                Présence d'une personne tierce très active lors de la transaction, laissant penser qu'elle
                est le véritable bénéficiaire.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-2">Achats-reventes rapides</h3>
              <p className="text-sm text-orange-800">
                Le client procède à des achats et reventes dans un délai très court, sans justification économique.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Origine des fonds</h3>
              <p className="text-sm text-yellow-800">
                Les fonds proviennent d'un compte différent de celui de l'acquéreur ou d'un pays à fiscalité privilégiée.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Montage complexe</h3>
              <p className="text-sm text-yellow-800">
                Recours à plusieurs personnes morales ou montage juridique anormalement complexe opacifiant
                le bénéficiaire effectif.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Secteur sensible</h3>
              <p className="text-sm text-slate-700">
                Les fonds proviennent d'un secteur d'activité sensible (BTP, restauration, téléphonie, etc.).
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Comportement atypique</h3>
              <p className="text-sm text-slate-700">
                Comportement insolite du client, réticence à fournir des justificatifs, empressement inhabituel.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Connivence</h3>
              <p className="text-sm text-slate-700">
                Connivence supposée entre le vendeur et l'acquéreur, comportement coordonné suspect.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Personne Politiquement Exposée</h3>
              <p className="text-sm text-red-800">
                Présence d'une PPE nécessitant une vigilance renforcée systématique.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Zone géographique sensible</h3>
              <p className="text-sm text-slate-700">
                Lien avec un pays figurant sur les listes de pays non coopératifs ou à risque élevé.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Paiement atypique</h3>
              <p className="text-sm text-yellow-800">
                Demande de paiement en espèces pour des montants importants ou modalités de paiement inhabituelles.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-xl p-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Important
        </h3>
        <p className="text-slate-300 text-sm">
          Ces critères ne sont pas exhaustifs. Un seul critère n'est pas forcément synonyme de blanchiment,
          mais la <strong>combinaison de plusieurs critères</strong> doit vous alerter et vous conduire à
          approfondir votre vigilance, voire à effectuer une déclaration de soupçon à TRACFIN.
        </p>
      </div>
    </div>
  );
}

function CartographieSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Cartographie des risques et typologie des biens</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          Conformément aux articles L561-4-1 et suivants du Code monétaire et financier, l'agence doit mettre en œuvre
          une <strong>approche par les risques</strong> pour adapter son niveau de vigilance à chaque opération.
        </p>
        <p className="text-slate-700 leading-relaxed">
          La classification des biens selon leur niveau de risque permet d'identifier les transactions nécessitant
          une vigilance standard, renforcée ou maximale.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Principe de la cartographie des risques
        </h3>
        <p className="text-sm text-blue-800">
          Chaque transaction immobilière est évaluée selon le type de bien concerné, le mode de financement,
          le profil du client et les caractéristiques de l'opération. Cette évaluation détermine le niveau
          de vigilance à appliquer et les mesures de contrôle appropriées.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-green-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              Niveau 1 : Biens à risque faible
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Caractéristiques</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Logements destinés à l'habitation principale de l'acquéreur</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Ventes réalisées avec financement bancaire classique (prêt immobilier)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Transactions portant sur des montants modestes en rapport avec le marché local</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Profil client standard et transparent</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2 text-sm">Exemples typiques</h4>
              <ul className="space-y-1 text-sm text-green-800">
                <li>→ Appartement ou maison acquis pour y résider</li>
                <li>→ Primo-accession financée par un crédit immobilier</li>
                <li>→ Mutation classique entre particuliers</li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2 text-sm">Niveau de vigilance : Standard</h4>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Identification et vérification de l'identité du client</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Conservation des pièces justificatives</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Traçabilité de l'opération</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-2 border-orange-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Niveau 2 : Biens à risque moyen
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Caractéristiques</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>Immeubles de rapport (biens destinés à la location)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>Locaux commerciaux, bureaux, entrepôts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>Biens détenus ou acquis par une Société Civile Immobilière (SCI)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>Ventes réalisées sans recours à un financement bancaire</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>Opérations d'investissement locatif</span>
                </li>
              </ul>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2 text-sm">Exemples typiques</h4>
              <ul className="space-y-1 text-sm text-orange-800">
                <li>→ Acquisition d'un immeuble avec plusieurs logements destinés à la location</li>
                <li>→ Achat de murs commerciaux par un professionnel</li>
                <li>→ Paiement comptant d'un bien d'investissement</li>
                <li>→ Acquisition via une structure sociétaire</li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2 text-sm">Niveau de vigilance : Renforcé</h4>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Approfondissement des informations relatives au client</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Justification de l'origine des fonds</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Vérification de la cohérence économique de l'opération</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Vérification de l'identité des bénéficiaires effectifs (SCI)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-2 border-red-300 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-700 to-red-600 px-6 py-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Niveau 3 : Biens à risque élevé
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Caractéristiques</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Biens de luxe ou de très forte valeur (supérieure aux standards du marché)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Opérations rapides d'achat puis revente sans justification économique</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Paiement avec fonds propres importants sans financement bancaire</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Acquisition par société étrangère (pays à risque)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Clients non résidents ou juridictions à fiscalité privilégiée</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Montages juridiques complexes sans justification apparente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Transactions impliquant des intermédiaires multiples ou opaques</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2 text-sm">Exemples typiques</h4>
              <ul className="space-y-1 text-sm text-red-800">
                <li>→ Villa de prestige acquise comptant par une société offshore</li>
                <li>→ Bien acheté puis revendu dans un délai très court sans travaux</li>
                <li>→ Acquisition par un client établi dans un paradis fiscal</li>
                <li>→ Opération avec versement de fonds en espèces ou circuits atypiques</li>
                <li>→ Réticence du client à fournir des informations sur l'origine des fonds</li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2 text-sm">Niveau de vigilance : Maximal</h4>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Vérification approfondie de l'identité et du bénéficiaire effectif</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Recherche documentée sur l'origine et la licéité des fonds</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Analyse de la cohérence avec le profil et l'activité du client</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Documentation exhaustive de tous les éléments de l'opération</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Évaluation systématique de l'opportunité de déclarer à TRACFIN</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-xl p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Conservation et traçabilité
        </h3>
        <p className="text-slate-300 text-sm mb-3">
          Conformément à l'article L561-12 du Code monétaire et financier, l'ensemble des éléments relatifs
          à l'évaluation du risque et aux mesures de vigilance appliquées doit être conservé pendant une durée
          de <strong className="text-white">5 ans</strong> à compter de la fin de la relation d'affaires ou de la
          réalisation de l'opération.
        </p>
        <p className="text-slate-300 text-sm">
          Cette classification du risque est intégrée au dossier de conformité TRACFIN de chaque transaction
          et peut être exportée en cas de contrôle par les autorités compétentes (TRACFIN, DGCCRF, autorités judiciaires).
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Mise à jour régulière
        </h3>
        <p className="text-sm text-blue-800">
          La cartographie des risques doit faire l'objet d'une révision régulière pour tenir compte de l'évolution
          de la réglementation LCB-FT, des typologies de blanchiment identifiées par TRACFIN, du retour d'expérience
          de l'agence et des recommandations des autorités de contrôle.
        </p>
      </div>
    </div>
  );
}

function CasesSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Cas typologiques réels</h2>
        <p className="text-slate-700 leading-relaxed">
          Voici des exemples concrets d'opérations suspectes détectées par TRACFIN dans le secteur immobilier.
        </p>
      </div>

      <div className="space-y-6">
        <div className="border border-red-200 rounded-xl overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-red-200">
            <h3 className="font-bold text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Cas 1 : Achat pour le compte d'une personne tierce (Homme de paille)
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Les faits</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                M. X, 21 ans, technicien de maintenance, se porte acquéreur d'un appartement de 490 000 €.
                Il indique financer avec des fonds propres, sans prêt. Lors des visites, il est accompagné
                de Mme Z, une personne plus âgée sans lien familial apparent. M. X reste discret tandis que
                Mme Z mène toutes les discussions et montre un empressement inhabituel. Elle demande si une
                partie peut être réglée en espèces.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2 text-sm">Investigations TRACFIN</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                M. X travaille depuis 18 mois, était non-imposable l'année précédente, et dispose d'une épargne
                faible. Mme Z et son époux gèrent une PME d'import/export de véhicules. L'analyse révèle des
                flux importants du compte de la société vers les comptes personnels et une minoration du chiffre
                d'affaires déclaré. M. X sert d'homme de paille pour blanchir des fonds détournés de la société.
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Critères d'alerte détectés
              </h4>
              <ul className="space-y-1 text-sm text-red-800">
                <li>• Jeune âge de l'acquéreur (21 ans)</li>
                <li>• Incohérence revenus/valeur du bien (technicien / 490k€)</li>
                <li>• Absence de recours à un prêt</li>
                <li>• Présence d'une personne tierce très active</li>
                <li>• Demande de règlement en espèces</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border border-orange-200 rounded-xl overflow-hidden">
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
            <h3 className="font-bold text-orange-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Cas 2 : Utilisation d'un compte intermédiaire (Compte taxi)
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Les faits</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                Mme X souhaite acquérir un bien manifestement surévalué. Elle accepte immédiatement le prix
                demandé. Pour le financement, elle indique que les fonds proviendront d'un compte d'une société
                située dans un pays à fiscalité privilégiée. Lorsque l'agence demande des justificatifs d'identité,
                de revenus et sur l'origine des fonds, Mme X répond qu'elle les communiquera ultérieurement
                (mais ne les fournit jamais).
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2 text-sm">Investigations TRACFIN</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                Mme X, mère de 5 enfants, est non imposable et n'a aucun patrimoine. Son compte montre des
                dépôts fréquents d'espèces &lt; 1 000 € et des virements depuis un pays non coopératif.
                Son dernier emploi connu : secrétaire. Les investigations révèlent qu'elle agit pour le compte
                d'un ressortissant français poursuivi pour extorsion de fonds et escroquerie en bande organisée.
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Critères d'alerte détectés
              </h4>
              <ul className="space-y-1 text-sm text-orange-800">
                <li>• Surévaluation manifeste du bien</li>
                <li>• Absence de recours à un prêt sans justification</li>
                <li>• Réticence à produire les justificatifs</li>
                <li>• Compte intermédiaire dans un paradis fiscal</li>
                <li>• Profil incohérent avec l'opération</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Ces cas montrent l'importance de la vigilance
        </h3>
        <p className="text-sm text-blue-800">
          Dans les deux situations, les professionnels qui ont signalé ces opérations suspectes ont permis
          à TRACFIN de démanteler des schémas de blanchiment. La détection précoce des signaux d'alerte
          et la déclaration de soupçon sont essentielles.
        </p>
      </div>
    </div>
  );
}

function ValidationSection() {
  const { profile } = useAuth();
  const [hasAttestation, setHasAttestation] = useState(false);
  const [attestation, setAttestation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      checkAttestation();
    }
  }, [profile?.id]);

  const checkAttestation = async () => {
    try {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('training_attestations')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasAttestation(true);
        setAttestation(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking attestation:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Chargement...</div>
      </div>
    );
  }

  if (hasAttestation && attestation) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Attestation de formation TRACFIN</h2>
          <p className="text-slate-700 leading-relaxed">
            Vous avez déjà validé votre attestation de formation. Voici les détails :
          </p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-bold text-green-900 text-lg">Attestation validée</h3>
              <p className="text-sm text-green-700">
                Votre engagement a été enregistré de manière sécurisée et immuable.
              </p>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-green-700 font-medium mb-1">Nom complet</p>
                <p className="text-sm text-green-900 font-semibold">{attestation.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-green-700 font-medium mb-1">Fonction</p>
                <p className="text-sm text-green-900 font-semibold">{attestation.role}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-green-700 font-medium mb-1">Date et heure de signature</p>
              <p className="text-sm text-green-900 font-semibold">
                {new Date(attestation.signed_at).toLocaleString('fr-FR', {
                  dateStyle: 'full',
                  timeStyle: 'long'
                })}
              </p>
            </div>

            {attestation.signature_data && (
              <div>
                <p className="text-xs text-green-700 font-medium mb-2">Signature électronique</p>
                <div className="bg-white border-2 border-green-300 rounded-lg p-4 inline-block">
                  <img
                    src={attestation.signature_data}
                    alt="Signature"
                    className="max-w-xs h-24 object-contain"
                  />
                </div>
              </div>
            )}

            <div className="bg-white border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-xs text-green-700 font-medium mb-2">Engagement attesté</p>
              <p className="text-sm text-green-900 whitespace-pre-line">{attestation.attestation_text}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Document juridiquement valable
          </h3>
          <p className="text-sm text-blue-800">
            Cette attestation est horodatée, signée électroniquement et enregistrée de manière immuable.
            Elle constitue une preuve de votre engagement à respecter les procédures LCB-FT et peut être
            présentée lors de contrôles par les autorités compétentes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Attestation de formation TRACFIN</h2>
        <p className="text-slate-700 leading-relaxed">
          En tant que professionnel assujetti aux obligations LCB-FT, vous devez attester avoir pris connaissance
          de la formation et vous engager à respecter les procédures.
        </p>
      </div>

      <div className="bg-slate-900 text-white rounded-xl p-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Engagement de conformité LCB-FT
        </h3>
        <div className="space-y-4 text-slate-200 text-sm leading-relaxed">
          <p>Je soussigné(e), certifie par la présente :</p>
          <ul className="space-y-3 ml-6">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Avoir pris connaissance et compris les obligations légales en matière de lutte contre le blanchiment de capitaux et le financement du terrorisme (LCB-FT) applicables aux professionnels de l'immobilier</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Avoir étudié les critères d'alerte et les typologies de blanchiment présentés dans cette formation</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Avoir compris la cartographie des risques et les différents niveaux de vigilance à appliquer selon les types de biens et d'opérations</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>M'engager à appliquer les mesures de vigilance appropriées lors de chaque transaction immobilière</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>M'engager à identifier et vérifier l'identité de mes clients ainsi que celle des bénéficiaires effectifs</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>M'engager à déclarer à TRACFIN toute opération suspecte que je pourrais identifier</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>M'engager à conserver l'ensemble des documents et informations pendant la durée légale de 5 ans</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Comprendre que le non-respect de ces obligations peut entraîner des sanctions administratives et pénales</span>
            </li>
          </ul>
          <p className="mt-6 pt-4 border-t border-slate-700 text-slate-300">
            Cette attestation sera horodatée et enregistrée de manière sécurisée et immuable.
            Elle constitue une preuve de votre engagement professionnel en matière de LCB-FT.
          </p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Important : Attestation non modifiable
        </h3>
        <p className="text-sm text-red-800">
          Une fois signée, cette attestation ne pourra plus être modifiée ni supprimée. Elle sera horodatée
          et conservée de manière immuable dans le système. Assurez-vous d'avoir bien lu et compris l'intégralité
          de la formation avant de signer.
        </p>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={() => setShowSignatureModal(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-slate-800 transition flex items-center gap-3 text-lg"
        >
          <PenTool className="w-6 h-6" />
          Signer l'attestation de formation
        </button>
      </div>

      {showSignatureModal && (
        <AttestationSignatureModal
          onClose={() => setShowSignatureModal(false)}
          onSuccess={() => {
            setShowSignatureModal(false);
            checkAttestation();
          }}
        />
      )}
    </div>
  );
}

function ResourcesSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Guide Opérationnel TRACFIN 2025</h2>
        <p className="text-slate-700 leading-relaxed">
          Téléchargez le guide officiel complet de TRACFIN pour les professionnels assujettis.
          Ce document de référence contient l'ensemble des informations sur vos obligations LCB-FT.
        </p>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl p-8 text-white">
        <div className="flex items-start gap-6">
          <div className="bg-white/10 rounded-xl p-6">
            <FileText className="w-16 h-16 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-3">
              L'Obligation de Déclaration TRACFIN
            </h3>
            <p className="text-slate-200 mb-2 text-lg">
              Guide Opérationnel LCB-FT pour les Professionnels Assujettis
            </p>
            <p className="text-slate-300 text-sm mb-6">
              Cadre légal, détection des signaux faibles et bouclier juridique (Mise à jour 2024/2025)
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-slate-300 mb-1">Pages</p>
                <p className="text-lg font-bold">15</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-slate-300 mb-1">Format</p>
                <p className="text-lg font-bold">PDF</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-slate-300 mb-1">Taille</p>
                <p className="text-lg font-bold">~1 MB</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-slate-300 mb-1">Version</p>
                <p className="text-lg font-bold">2025</p>
              </div>
            </div>

            <a
              href="/Guide_Opérationnel_TRACFIN_2025_compressed.pdf"
              download="Guide_Operationnel_TRACFIN_2025.pdf"
              className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-slate-100 transition shadow-lg"
            >
              <Download className="w-6 h-6" />
              Télécharger le Guide Complet
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Contenu du guide
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Le périmètre légal de l'obligation déclarative</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>L'approche par les risques et le principe de vigilance</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Signaux d'alerte pour les personnes physiques et morales</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Typologie des opérations suspectes</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Focus sur le secteur immobilier ultra-ciblé</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Le nouveau dispositif de déclaration (2023)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Le bouclier juridique : immunité du déclarant</span>
            </li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Pourquoi utiliser ce guide ?
          </h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Document de référence officiel mis à jour</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Clarification du cadre légal par le Conseil d'État</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Schémas et visuels pédagogiques</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Exemples concrets d'opérations immobilières</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Modalités pratiques de déclaration</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Protection juridique complète du déclarant</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Synthèse des 3 réflexes LCB-FT essentiels</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-slate-600" />
          Points clés du guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-full mb-3 font-bold text-xl">
              1
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">IDENTIFIER</h4>
            <p className="text-slate-600 text-xs">
              Collecter systématiquement les justificatifs avant toute signature et analyser l'origine des fonds
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-full mb-3 font-bold text-xl">
              2
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">ANALYSER</h4>
            <p className="text-slate-600 text-xs">
              Croiser le profil avec la typologie de l'opération pour détecter les incohérences
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-full mb-3 font-bold text-xl">
              3
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">DÉCLARER</h4>
            <p className="text-slate-600 text-xs">
              En cas de doute raisonnable, utiliser le portail TRACFIN pour bénéficier d'une protection légale absolue
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-xl p-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Conservation recommandée
        </h3>
        <p className="text-slate-300 text-sm">
          Conservez ce guide dans vos archives professionnelles. Il constitue une ressource essentielle
          pour respecter vos obligations légales et peut être présenté en cas de contrôle par les autorités
          compétentes (TRACFIN, DGCCRF).
        </p>
      </div>
    </div>
  );
}

function DeclarationSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Déclaration de soupçon à TRACFIN</h2>
        <p className="text-slate-700 leading-relaxed">
          Lorsque vous identifiez une opération suspecte, vous avez l'obligation légale d'effectuer
          une déclaration de soupçon auprès de TRACFIN.
        </p>
      </div>
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl p-6 text-white border-2 border-blue-700">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 rounded-full p-3">
            <Users className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Référent TRACFIN de l'agence</h3>
            <p className="text-blue-50 mb-4">
              Pour toute question ou si vous identifiez une opération suspecte, contactez votre référent :
            </p>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <p className="font-bold text-lg mb-1">Nicolas Popovitch</p>
              <p className="text-sm text-blue-100">
                Référent LCB-FT en charge des déclarations de soupçon
              </p>
            </div>
            <p className="text-sm text-blue-100 mt-4">
              Nicolas effectuera la déclaration
              auprès de TRACFIN si nécessaire.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Pourquoi déclarer ?
          </h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>C'est une obligation légale</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Vous participez à la lutte contre la criminalité</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Vous protégez votre activité professionnelle</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>La déclaration vous protège juridiquement</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Vos garanties
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>Confidentialité absolue garantie</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>Protection contre toute poursuite</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>Transmission sécurisée via ERMES</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>Accompagnement par TRACFIN si besoin</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">Quand effectuer une déclaration ?</h3>

        <div className="border-l-4 border-red-600 bg-red-50 p-5 rounded-r-xl">
          <p className="text-sm text-red-800 font-medium mb-2">Vous devez déclarer lorsque :</p>
          <ul className="space-y-1 text-sm text-red-700">
            <li>• Vous constatez plusieurs critères d'alerte combinés</li>
            <li>• Le client refuse de fournir les justificatifs demandés</li>
            <li>• L'origine des fonds reste inexpliquée ou douteuse</li>
            <li>• Le comportement du client est manifestement suspect</li>
            <li>• Vous avez un doute sérieux sur la licéité de l'opération</li>
          </ul>
        </div>

        <div className="border-l-4 border-orange-600 bg-orange-50 p-5 rounded-r-xl">
          <p className="text-sm text-orange-800 font-medium mb-2">⚠️ Important</p>
          <p className="text-sm text-orange-700">
            Le soupçon n'a pas besoin d'être une certitude. Si vous avez un doute raisonnable,
            vous devez déclarer. TRACFIN mènera les investigations approfondies.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Que se passe-t-il après la déclaration ?</h3>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <div>
              <p className="font-medium text-slate-900 text-sm">Réception par TRACFIN</p>
              <p className="text-xs text-slate-600">Votre déclaration est reçue de manière sécurisée et confidentielle</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <div>
              <p className="font-medium text-slate-900 text-sm">Analyse approfondie</p>
              <p className="text-xs text-slate-600">TRACFIN mène des investigations (comptes bancaires, fiscalité, etc.)</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <div>
              <p className="font-medium text-slate-900 text-sm">Transmission éventuelle</p>
              <p className="text-xs text-slate-600">Si le soupçon est confirmé, transmission au Procureur de la République</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <div>
              <p className="font-medium text-slate-900 text-sm">Vous êtes protégé</p>
              <p className="text-xs text-slate-600">Votre identité reste confidentielle tout au long du processus</p>
            </div>
          </li>
        </ol>
      </div>


    </div>
  );
}
