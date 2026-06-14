import { useEffect, useState } from 'react';
import { Download, FileText, AlertCircle, Building2, User as UserIcon, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';

type Client = Database['public']['Tables']['clients']['Row'];

interface ClientWithUser extends Client {
  created_by_email?: string;
}

export function Reports() {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState<ClientWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email');

      if (usersError) throw usersError;

      const usersMap = new Map(usersData?.map(u => [u.id, u.email]) || []);

      const enrichedClients = (clientsData || []).map(client => ({
        ...client,
        created_by_email: client.created_by ? usersMap.get(client.created_by) : 'Inconnu'
      }));

      setClients(enrichedClients);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    if (filterUser !== 'all' && client.created_by !== filterUser) return false;
    if (filterType !== 'all' && client.client_type !== filterType) return false;
    return true;
  });

  const exportToCSV = () => {
    const headers = [
      'Type',
      'Nom',
      'Prénom',
      'Société',
      'Email',
      'Téléphone',
      'Adresse',
      'Ville',
      'Code Postal',
      'Pays',
      'Niveau de Risque',
      'PPE',
      'Créé par',
      'Date de création'
    ];

    const rows = filteredClients.map(client => [
      client.client_type === 'legal_entity' ? 'Personne morale' : 'Personne physique',
      client.last_name || '',
      client.first_name || '',
      client.company_name || '',
      client.email || '',
      client.phone || '',
      client.address || '',
      client.city || '',
      client.postal_code || '',
      client.country || '',
      client.risk_level === 'low' ? 'Faible' : client.risk_level === 'medium' ? 'Moyen' : 'Élevé',
      client.is_pep ? 'Oui' : 'Non',
      client.created_by_email || '',
      new Date(client.created_at).toLocaleDateString('fr-FR')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_clients_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapport Clients TRACFIN</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              color: #1e293b;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 10px;
            }
            .meta {
              margin-bottom: 20px;
              color: #64748b;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 12px;
            }
            th {
              background-color: #f1f5f9;
              padding: 10px;
              text-align: left;
              border: 1px solid #cbd5e1;
              font-weight: 600;
            }
            td {
              padding: 8px;
              border: 1px solid #e2e8f0;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .badge {
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
            }
            .badge-low { background-color: #dcfce7; color: #166534; }
            .badge-medium { background-color: #fed7aa; color: #9a3412; }
            .badge-high { background-color: #fecaca; color: #991b1b; }
            .badge-pep { background-color: #fee2e2; color: #991b1b; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Rapport Clients TRACFIN</h1>
          <div class="meta">
            <p>Date du rapport: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p>Nombre de clients: ${filteredClients.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Nom complet</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Ville</th>
                <th>Risque</th>
                <th>PPE</th>
                <th>Créé par</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredClients.map(client => `
                <tr>
                  <td>${client.client_type === 'legal_entity' ? 'PM' : 'PP'}</td>
                  <td>${client.client_type === 'legal_entity'
                    ? client.company_name || ''
                    : `${client.first_name || ''} ${client.last_name || ''}`}</td>
                  <td>${client.email || ''}</td>
                  <td>${client.phone || ''}</td>
                  <td>${client.city || ''}</td>
                  <td>
                    <span class="badge badge-${client.risk_level}">
                      ${client.risk_level === 'low' ? 'Faible' : client.risk_level === 'medium' ? 'Moyen' : 'Élevé'}
                    </span>
                  </td>
                  <td>${client.is_pep ? '<span class="badge badge-pep">OUI</span>' : 'Non'}</td>
                  <td>${client.created_by_email || ''}</td>
                  <td>${new Date(client.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getStats = () => {
    const total = filteredClients.length;
    const physicalPersons = filteredClients.filter(c => c.client_type === 'physical_person').length;
    const legalEntities = filteredClients.filter(c => c.client_type === 'legal_entity').length;
    const pep = filteredClients.filter(c => c.is_pep).length;
    const highRisk = filteredClients.filter(c => c.risk_level === 'high').length;

    return { total, physicalPersons, legalEntities, pep, highRisk };
  };

  const stats = getStats();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Accès refusé</h2>
          <p className="text-slate-600">Seuls les administrateurs peuvent accéder aux rapports.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rapports Clients</h1>
          <p className="text-slate-600 mt-1">Vue d'ensemble de tous les clients saisis par les agents</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-sm text-slate-600 mt-1">Total clients</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-3xl font-bold text-blue-600">{stats.physicalPersons}</div>
          <div className="text-sm text-slate-600 mt-1">Personnes physiques</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-3xl font-bold text-purple-600">{stats.legalEntities}</div>
          <div className="text-sm text-slate-600 mt-1">Personnes morales</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-3xl font-bold text-red-600">{stats.pep}</div>
          <div className="text-sm text-slate-600 mt-1">PPE</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-3xl font-bold text-orange-600">{stats.highRisk}</div>
          <div className="text-sm text-slate-600 mt-1">Risque élevé</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-5 h-5 text-slate-600" />
          <h2 className="font-semibold text-slate-900">Filtres</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filtrer par agent
            </label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les agents</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filtrer par type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="physical_person">Personnes physiques</option>
              <option value="legal_entity">Personnes morales</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Nom complet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Ville
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Risque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  PPE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Créé par
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <UserIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Aucun client trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {client.client_type === 'legal_entity' ? (
                          <Building2 className="w-4 h-4 text-blue-600" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-slate-600" />
                        )}
                        <span className="text-sm text-slate-900">
                          {client.client_type === 'legal_entity' ? 'PM' : 'PP'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {client.client_type === 'legal_entity'
                          ? client.company_name
                          : `${client.first_name} ${client.last_name}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{client.email || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{client.city || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.risk_level === 'low' ? 'bg-green-100 text-green-700' :
                        client.risk_level === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {client.risk_level === 'low' ? 'Faible' :
                         client.risk_level === 'medium' ? 'Moyen' : 'Élevé'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {client.is_pep ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Oui
                        </span>
                      ) : (
                        <span className="text-sm text-slate-600">Non</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{client.created_by_email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">
                        {new Date(client.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
