import { useEffect, useState } from 'react';
import { Plus, Search, FileText, AlertTriangle, Pencil, Trash2, ArrowDownUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { TracfinDeclarationForm } from '../components/tracfin/TracfinDeclarationForm';
import { ExportImportModal } from '../components/clients/ExportImportModal';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDeclarationForm, setShowDeclarationForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showExportImport, setShowExportImport] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          creator:created_by(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.property_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config = {
      in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Terminée', color: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Annulée', color: 'bg-slate-100 text-slate-600' },
    };
    const statusConfig = config[status as keyof typeof config] || config.in_progress;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    );
  };

  const getRiskBadge = (risk: string) => {
    const config = {
      low: { label: 'Faible', color: 'bg-green-100 text-green-700' },
      medium: { label: 'Moyen', color: 'bg-orange-100 text-orange-700' },
      high: { label: 'Élevé', color: 'bg-red-100 text-red-700' },
    };
    const riskConfig = config[risk as keyof typeof config] || config.low;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskConfig.color}`}>
        {riskConfig.label}
      </span>
    );
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'TRANSACTION_DELETED',
        entity_type: 'transaction',
        entity_id: id,
        user_id: user?.id,
      });

      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Erreur lors de la suppression de la transaction');
    }
  };

  const getTypeBadge = (type: string) => {
    const config = {
      sale: { label: 'Vente', color: 'bg-purple-100 text-purple-700' },
      purchase: { label: 'Achat', color: 'bg-cyan-100 text-cyan-700' },
      rental: { label: 'Location', color: 'bg-amber-100 text-amber-700' },
    };
    const typeConfig = config[type as keyof typeof config];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
        {typeConfig.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showExportImport && (
        <ExportImportModal
          defaultTab="export"
          onClose={() => setShowExportImport(false)}
          onImportSuccess={() => { setShowExportImport(false); loadTransactions(); }}
        />
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Transactions immobilières</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">Suivi et traçabilité des opérations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExportImport(true)}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition border border-slate-300 whitespace-nowrap"
          >
            <ArrowDownUp className="w-5 h-5" />
            <span className="hidden sm:inline">Export / Import</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nouvelle transaction</span>
            <span className="sm:hidden">Nouvelle</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par adresse de bien..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune transaction</h3>
          <p className="text-slate-600 text-sm sm:text-base">
            {searchTerm ? 'Aucune transaction ne correspond à votre recherche' : 'Commencez par créer une transaction'}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Adresse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Risque</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        {getTypeBadge(transaction.transaction_type)}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{transaction.property_address}</p>
                          {transaction.property_city && (
                            <p className="text-sm text-slate-500">{transaction.property_city}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(transaction.transaction_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {(transaction as any).creator ? `${(transaction as any).creator.first_name} ${(transaction as any).creator.last_name}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {getRiskBadge(transaction.risk_level)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingTransaction(transaction)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition text-sm font-medium"
                          >
                            <Pencil className="w-4 h-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowDeclarationForm(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            TRACFIN
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeBadge(transaction.transaction_type)}
                      {getRiskBadge(transaction.risk_level)}
                    </div>
                    <p className="font-medium text-slate-900 text-sm truncate">{transaction.property_address}</p>
                    {transaction.property_city && (
                      <p className="text-xs text-slate-500 mt-0.5">{transaction.property_city}</p>
                    )}
                  </div>
                  {getStatusBadge(transaction.status)}
                </div>

                <div className="mb-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(transaction.transaction_amount)}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </div>
                  {(transaction as any).creator && (
                    <div className="text-xs text-slate-500">
                      <span className="font-medium">Agent :</span> {(transaction as any).creator.first_name} {(transaction as any).creator.last_name}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTransaction(transaction)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition"
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setShowDeclarationForm(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                    title="Déclaration TRACFIN"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <TransactionForm
          onClose={() => setShowForm(false)}
          onSuccess={loadTransactions}
        />
      )}

      {editingTransaction && (
        <TransactionForm
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => {
            setEditingTransaction(null);
            loadTransactions();
          }}
        />
      )}

      {showDeclarationForm && selectedTransaction && (
        <TracfinDeclarationForm
          transactionId={selectedTransaction.id}
          onClose={() => {
            setShowDeclarationForm(false);
            setSelectedTransaction(null);
          }}
          onSuccess={() => {
            setShowDeclarationForm(false);
            setSelectedTransaction(null);
            loadTransactions();
          }}
        />
      )}
    </div>
  );
}
