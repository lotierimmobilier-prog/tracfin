import { useEffect, useState } from 'react';
import { Users, FileText, AlertTriangle, Shield, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLocation } from '../components/navigation/Router';

interface Stats {
  totalClients: number;
  activeTransactions: number;
  openAlerts: number;
  highRiskClients: number;
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  pendingAlerts: number;
  incompleteDossiers: number;
  pendingTransactions: number;
}

export function Dashboard() {
  const { setView } = useLocation();
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    activeTransactions: 0,
    openAlerts: 0,
    highRiskClients: 0,
    lowRiskCount: 0,
    mediumRiskCount: 0,
    highRiskCount: 0,
    pendingAlerts: 0,
    incompleteDossiers: 0,
    pendingTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        clients,
        transactions,
        alerts,
        highRisk,
        lowRisk,
        mediumRisk,
        pendingAlerts,
        incompleteDossiers,
        pendingTransactions
      ] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('risk_level', 'high'),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('risk_level', 'low'),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('risk_level', 'medium'),
        supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('compliance_dossiers').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'in_progress')
      ]);

      setStats({
        totalClients: clients.count || 0,
        activeTransactions: transactions.count || 0,
        openAlerts: alerts.count || 0,
        highRiskClients: highRisk.count || 0,
        lowRiskCount: lowRisk.count || 0,
        mediumRiskCount: mediumRisk.count || 0,
        highRiskCount: highRisk.count || 0,
        pendingAlerts: pendingAlerts.count || 0,
        incompleteDossiers: incompleteDossiers.count || 0,
        pendingTransactions: pendingTransactions.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Clients actifs',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Alertes ouvertes',
      value: stats.openAlerts,
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
    {
      title: 'Clients à risque',
      value: stats.highRiskClients,
      icon: Shield,
      color: 'bg-red-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-600 mt-1">Vue d'ensemble de la conformité TRACFIN</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Répartition des risques</h2>
        <div className="space-y-4">
          {stats.totalClients === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Aucun client enregistré</p>
          ) : (
            <>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600">Risque faible</span>
                  <span className="text-sm font-medium text-slate-900">
                    {Math.round((stats.lowRiskCount / stats.totalClients) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(stats.lowRiskCount / stats.totalClients) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600">Risque moyen</span>
                  <span className="text-sm font-medium text-slate-900">
                    {Math.round((stats.mediumRiskCount / stats.totalClients) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${(stats.mediumRiskCount / stats.totalClients) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600">Risque élevé</span>
                  <span className="text-sm font-medium text-slate-900">
                    {Math.round((stats.highRiskCount / stats.totalClients) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(stats.highRiskCount / stats.totalClients) * 100}%` }}
                  ></div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <button
          onClick={() => setView('guide')}
          className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl p-6 text-white text-left hover:from-blue-700 hover:to-blue-600 transition shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="bg-white/20 rounded-lg p-3">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Guide TRACFIN</h2>
              <p className="text-blue-100 text-sm mb-4">
                Découvrez vos obligations légales, les critères d'alerte et des cas pratiques pour mieux
                comprendre la lutte contre le blanchiment dans l'immobilier.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>Accéder au guide</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </button>

        <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-2">Conformité TRACFIN</h2>
          <p className="text-slate-300 text-sm mb-4">
            Cette application respecte toutes les obligations légales en matière de lutte contre le blanchiment
            et le financement du terrorisme pour les professionnels de l'immobilier.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs">Vigilance KYC</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs">Détection PPE</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs">Cartographie des risques</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs">Archivage 5 ans</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs">Traçabilité complète</span>
          </div>
        </div>
      </div>
    </div>
  );
}
