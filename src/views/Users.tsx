import { useEffect, useState } from 'react';
import { Users as UsersIcon, Plus, Trash2, Shield, User, LogIn, CreditCard as Edit2, X, ArrowDownUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';
import { ExportImportModal } from '../components/clients/ExportImportModal';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface NewUser {
  email: string;
  password: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  rcs_number: string;
  rcs_city: string;
  role: 'agent' | 'compliance_officer' | 'admin';
}

interface EditUser {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  rcs_number: string;
  rcs_city: string;
  role: 'agent' | 'compliance_officer' | 'admin';
}

export function Users() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    full_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    rcs_number: '',
    rcs_city: '',
    role: 'agent',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<EditUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();

      const subscription = supabase
        .channel('users_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users' },
          () => {
            loadUsers();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !session.user?.email) {
        throw new Error('Vous devez être connecté pour créer un utilisateur. Veuillez vous reconnecter.');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          phone: newUser.phone,
          rcs_number: newUser.rcs_number,
          rcs_city: newUser.rcs_city,
          role: newUser.role,
          admin_email: session.user.email,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        throw new Error('Erreur serveur: réponse invalide');
      }

      if (!response.ok) {
        console.error('Erreur API:', result);
        const errorMessage = result?.error || `Erreur ${response.status}`;
        const details = result?.details ? ` - ${result.details}` : '';
        const hint = result?.hint ? ` (${result.hint})` : '';
        throw new Error(errorMessage + details + hint);
      }

      setSuccess('Utilisateur créé avec succès. L\'utilisateur doit compléter son profil à la première connexion.');
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        first_name: '',
        last_name: '',
        phone: '',
        rcs_number: '',
        rcs_city: '',
        role: 'agent',
      });
      setShowForm(false);
      await loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error?.message || 'Erreur lors de la création de l\'utilisateur';
      setError(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);

      if (error) throw error;

      setSuccess('Utilisateur supprimé avec succès');
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleImpersonate = async (userId: string, userEmail: string) => {
    if (!confirm(`Voulez-vous vous connecter en tant que ${userEmail} ?`)) {
      return;
    }

    try {
      localStorage.setItem('impersonation_admin_id', currentUser?.id || '');
      localStorage.setItem('impersonation_target_id', userId);

      window.location.reload();
    } catch (error: any) {
      console.error('Error impersonating user:', error);
      setError('Erreur lors de la connexion en tant qu\'utilisateur');
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      rcs_number: user.rcs_number || '',
      rcs_city: user.rcs_city || '',
      role: user.role as 'agent' | 'compliance_officer' | 'admin',
    });
    setShowEditModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: editingUser.email,
          full_name: editingUser.full_name,
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          phone: editingUser.phone,
          rcs_number: editingUser.rcs_number,
          rcs_city: editingUser.rcs_city,
          role: editingUser.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (updateError) throw updateError;

      setSuccess('Utilisateur modifié avec succès');
      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Erreur lors de la modification de l\'utilisateur');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'compliance_officer':
        return 'Responsable Conformité';
      case 'agent':
        return 'Agent Commercial';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'compliance_officer':
        return 'bg-blue-100 text-blue-800';
      case 'agent':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès refusé</h2>
          <p className="text-slate-600">Vous devez être administrateur pour accéder à cette page.</p>
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
      {showExportImport && (
        <ExportImportModal
          onClose={() => setShowExportImport(false)}
          onImportSuccess={() => { setShowExportImport(false); loadUsers(); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des utilisateurs</h1>
          <p className="text-slate-600 mt-1">Gérer les agents commerciaux et utilisateurs</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExportImport(true)}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition border border-slate-300"
          >
            <ArrowDownUp className="w-5 h-5" />
            Export / Import
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Nouvel utilisateur
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Créer un nouvel utilisateur</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={newUser.first_name}
                  onChange={(e) => {
                    const firstName = e.target.value;
                    setNewUser({
                      ...newUser,
                      first_name: firstName,
                      full_name: `${firstName} ${newUser.last_name}`.trim()
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={newUser.last_name}
                  onChange={(e) => {
                    const lastName = e.target.value;
                    setNewUser({
                      ...newUser,
                      last_name: lastName,
                      full_name: `${newUser.first_name} ${lastName}`.trim()
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Numéro RCS
                </label>
                <input
                  type="text"
                  value={newUser.rcs_number}
                  onChange={(e) => setNewUser({ ...newUser, rcs_number: e.target.value })}
                  placeholder="123 456 789"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ville RCS
                </label>
                <input
                  type="text"
                  value={newUser.rcs_city}
                  onChange={(e) => setNewUser({ ...newUser, rcs_city: e.target.value })}
                  placeholder="Paris"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rôle *
                </label>
                <select
                  required
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value as 'agent' | 'compliance_officer' | 'admin' })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="agent">Agent Commercial</option>
                  <option value="compliance_officer">Responsable Conformité</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Créer l'utilisateur
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Modifier l'utilisateur</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setError(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.first_name}
                    onChange={(e) => {
                      const firstName = e.target.value;
                      setEditingUser({
                        ...editingUser,
                        first_name: firstName,
                        full_name: `${firstName} ${editingUser.last_name}`.trim()
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.last_name}
                    onChange={(e) => {
                      const lastName = e.target.value;
                      setEditingUser({
                        ...editingUser,
                        last_name: lastName,
                        full_name: `${editingUser.first_name} ${lastName}`.trim()
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Numéro RCS
                  </label>
                  <input
                    type="text"
                    value={editingUser.rcs_number}
                    onChange={(e) => setEditingUser({ ...editingUser, rcs_number: e.target.value })}
                    placeholder="123 456 789"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ville RCS
                  </label>
                  <input
                    type="text"
                    value={editingUser.rcs_city}
                    onChange={(e) => setEditingUser({ ...editingUser, rcs_city: e.target.value })}
                    placeholder="Paris"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Rôle *
                  </label>
                  <select
                    required
                    value={editingUser.role}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, role: e.target.value as 'agent' | 'compliance_officer' | 'admin' })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="agent">Agent Commercial</option>
                    <option value="compliance_officer">Responsable Conformité</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Enregistrer les modifications
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  RCS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <UsersIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500">Aucun utilisateur trouvé</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.full_name}</p>
                          {user.first_name && user.last_name && (
                            <p className="text-xs text-slate-500">{user.first_name} {user.last_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{user.phone || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">
                        {user.rcs_number ? (
                          <>
                            <p className="font-medium">{user.rcs_number}</p>
                            {user.rcs_city && <p className="text-xs text-slate-500">{user.rcs_city}</p>}
                          </>
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-slate-600 hover:text-slate-800 transition"
                          title="Modifier l'utilisateur"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleImpersonate(user.id, user.email)}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="Se connecter en tant que cet utilisateur"
                          >
                            <LogIn className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Supprimer l'utilisateur"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
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
