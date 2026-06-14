import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export interface RiskQuestion {
  code: string;
  question: string;
  description: string;
  category: 'client' | 'transaction' | 'funds' | 'property';
}

export const RISK_QUESTIONS: RiskQuestion[] = [
  {
    code: 'Q1',
    question: 'Discordance entre le profil du client et la valeur du bien',
    description: 'L\'âge, les revenus ou la catégorie socio-professionnelle du client ne correspondent pas à la valeur du bien acquis',
    category: 'client'
  },
  {
    code: 'Q2',
    question: 'Client non-résident ou établi dans une juridiction à risque',
    description: 'Le client réside à l\'étranger, notamment dans un pays à risque ou à fiscalité privilégiée',
    category: 'client'
  },
  {
    code: 'Q3',
    question: 'Présence d\'un tiers influent dans l\'opération',
    description: 'Un tiers accompagne le client et son comportement laisse penser qu\'il est le véritable bénéficiaire de l\'opération',
    category: 'client'
  },
  {
    code: 'Q4',
    question: 'Difficulté à identifier le bénéficiaire effectif',
    description: 'Le client refuse ou hésite à fournir les informations sur le bénéficiaire effectif (notamment pour les structures sociétaires)',
    category: 'client'
  },
  {
    code: 'Q5',
    question: 'Opération rapide d\'achat puis revente',
    description: 'Le client procède à des achats et reventes dans un délai très court sans justification économique apparente',
    category: 'transaction'
  },
  {
    code: 'Q6',
    question: 'Discordance entre la valeur de marché et le prix de transaction',
    description: 'Le montant de la transaction est significativement différent de la valeur de marché du bien',
    category: 'transaction'
  },
  {
    code: 'Q7',
    question: 'Montage juridique complexe ou atypique',
    description: 'Recours à l\'interposition de plusieurs sociétés, structures offshore, ou montages inhabituels sans justification claire',
    category: 'transaction'
  },
  {
    code: 'Q8',
    question: 'Origine des fonds non traçable ou douteuse',
    description: 'Utilisation d\'espèces importantes, tontine, ou refus de justifier l\'origine licite des fonds',
    category: 'funds'
  },
  {
    code: 'Q9',
    question: 'Fonds provenant d\'un compte différent de l\'acquéreur',
    description: 'Les fonds sont émis à partir d\'un compte bancaire qui n\'appartient pas à l\'acquéreur identifié',
    category: 'funds'
  },
  {
    code: 'Q10',
    question: 'Bien de luxe ou localisation à risque',
    description: 'Bien immobilier de très forte valeur, de prestige, ou situé dans une zone sensible au blanchiment',
    category: 'property'
  }
];

interface RiskQuestionnaireProps {
  answers: Record<string, boolean>;
  onChange: (answers: Record<string, boolean>) => void;
  readOnly?: boolean;
}

export function RiskQuestionnaire({ answers, onChange, readOnly = false }: RiskQuestionnaireProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    client: true,
    transaction: true,
    funds: true,
    property: true
  });

  const handleAnswerChange = (questionCode: string, value: boolean) => {
    if (readOnly) return;
    onChange({
      ...answers,
      [questionCode]: value
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const riskScore = Object.values(answers).filter(Boolean).length;

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      client: 'Profil du client',
      transaction: 'Nature de l\'opération',
      funds: 'Origine des fonds',
      property: 'Caractéristiques du bien'
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    return expandedCategories[category] ? '▼' : '▶';
  };

  const getRiskLevelInfo = () => {
    if (riskScore === 0) {
      return {
        level: 'Aucun facteur de risque identifié',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: <CheckCircle className="w-5 h-5" />
      };
    } else if (riskScore < 3) {
      return {
        level: `${riskScore} facteur${riskScore > 1 ? 's' : ''} de risque identifié${riskScore > 1 ? 's' : ''}`,
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: <AlertTriangle className="w-5 h-5" />
      };
    } else {
      return {
        level: `${riskScore} facteurs de risque identifiés - ALERTE`,
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: <XCircle className="w-5 h-5" />
      };
    }
  };

  const riskInfo = getRiskLevelInfo();

  const groupedQuestions = RISK_QUESTIONS.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, RiskQuestion[]>);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">
              Questionnaire d'évaluation du risque LCB-FT
            </h3>
            <p className="text-sm text-blue-800">
              Conformément aux lignes directrices TRACFIN, répondez aux 10 questions suivantes pour évaluer le niveau de risque de cette transaction.
              <strong> Si 3 facteurs de risque ou plus sont identifiés, une alerte sera automatiquement envoyée à l'administrateur.</strong>
            </p>
          </div>
        </div>
      </div>

      <div className={`border rounded-lg p-4 ${riskInfo.bgColor} ${riskInfo.borderColor}`}>
        <div className="flex items-center gap-2">
          <div className={riskInfo.color}>
            {riskInfo.icon}
          </div>
          <div>
            <p className={`font-semibold ${riskInfo.color}`}>
              Score de risque : {riskScore}/10
            </p>
            <p className={`text-sm ${riskInfo.color}`}>
              {riskInfo.level}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(groupedQuestions).map(([category, questions]) => (
          <div key={category} className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between"
            >
              <span className="font-medium text-slate-900">
                {getCategoryIcon(category)} {getCategoryLabel(category)}
              </span>
              <span className="text-sm text-slate-600">
                {questions.filter(q => answers[q.code]).length}/{questions.length} facteurs présents
              </span>
            </button>

            {expandedCategories[category] && (
              <div className="p-4 space-y-3">
                {questions.map((question) => (
                  <div
                    key={question.code}
                    className={`border rounded-lg p-3 transition ${
                      answers[question.code]
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-500">
                            {question.code}
                          </span>
                          <h4 className="font-medium text-slate-900 text-sm">
                            {question.question}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600">
                          {question.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAnswerChange(question.code, true)}
                          disabled={readOnly}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            answers[question.code]
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          } ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          Oui
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAnswerChange(question.code, false)}
                          disabled={readOnly}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            !answers[question.code]
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          } ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          Non
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {riskScore >= 3 && !readOnly && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">
                Seuil d'alerte atteint
              </h4>
              <p className="text-sm text-red-800">
                Le score de risque est de <strong>{riskScore}/10</strong>. Une notification sera automatiquement
                envoyée à l'administrateur lors de l\'enregistrement de cette transaction. Une analyse approfondie
                et une déclaration de soupçon TRACFIN peuvent être nécessaires.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
