export interface RiskScores {
  incomeCoherenceScore: number;
  fundsOriginScore: number;
  thirdPartyScore: number;
  legalStructureScore: number;
  geographicRiskScore: number;
  paymentMethodScore: number;
}

export function calculateTotalRiskScore(scores: RiskScores): number {
  return (
    scores.incomeCoherenceScore +
    scores.fundsOriginScore +
    scores.thirdPartyScore +
    scores.legalStructureScore +
    scores.geographicRiskScore +
    scores.paymentMethodScore
  );
}

export function getRiskLevel(totalScore: number): 'low' | 'medium' | 'high' {
  if (totalScore <= 20) return 'low';
  if (totalScore <= 40) return 'medium';
  return 'high';
}

export function calculateIncomeCoherenceScore(
  annualIncome: number | null,
  transactionAmount: number
): number {
  if (!annualIncome) return 10;

  const ratio = transactionAmount / annualIncome;

  if (ratio > 5) return 10;
  if (ratio > 3) return 7;
  if (ratio > 1) return 4;
  return 0;
}

export function calculateFundsOriginScore(origin: string | null): number {
  if (!origin) return 8;

  const lowRiskSources = ['salaire', 'épargne', 'héritage déclaré', 'vente immobilière'];
  const mediumRiskSources = ['prêt bancaire', 'donation'];

  const originLower = origin.toLowerCase();

  if (lowRiskSources.some(source => originLower.includes(source))) return 0;
  if (mediumRiskSources.some(source => originLower.includes(source))) return 4;
  return 8;
}

export function calculateThirdPartyScore(hasThirdParty: boolean): number {
  return hasThirdParty ? 8 : 0;
}

export function calculateLegalStructureScore(clientType: 'individual' | 'legal_entity'): number {
  return clientType === 'legal_entity' ? 5 : 0;
}

export function calculateGeographicRiskScore(country: string | null): number {
  if (!country) return 5;

  const lowRiskCountries = ['france', 'allemagne', 'belgique', 'suisse', 'luxembourg'];
  const countryLower = country.toLowerCase();

  if (lowRiskCountries.includes(countryLower)) return 0;
  return 7;
}

export function calculatePaymentMethodScore(method: string | null): number {
  if (!method) return 5;

  const methodLower = method.toLowerCase();

  if (methodLower.includes('virement') || methodLower.includes('chèque')) return 0;
  if (methodLower.includes('espèces')) return 10;
  return 5;
}
