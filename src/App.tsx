import { RouterProvider, useLocation } from './components/navigation/Router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { Landing } from './views/Landing';
import { Dashboard } from './views/Dashboard';
import { Clients } from './views/Clients';
import { Transactions } from './views/Transactions';
import { RiskAssessments } from './views/RiskAssessments';
import { Alerts } from './views/Alerts';
import { Dossiers } from './views/Dossiers';
import { Archive } from './views/Archive';
import { Guide } from './views/Guide';
import { Tutorial } from './views/Tutorial';
import { Users } from './views/Users';
import { Permissions } from './views/Permissions';
import { SignatureDemo } from './views/SignatureDemo';
import { AuditLogs } from './views/AuditLogs';
import { Reports } from './views/Reports';
import { Notifications } from './views/Notifications';
import { TracfinDeclarations } from './views/TracfinDeclarations';
import { Profile } from './views/Profile';

function AppContent() {
  const { currentView, setView } = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'tutorial':
        return <Tutorial />;
      case 'clients':
        return <Clients />;
      case 'transactions':
        return <Transactions />;
      case 'risk-assessments':
        return <RiskAssessments />;
      case 'alerts':
        return <Alerts />;
      case 'tracfin-declarations':
        return <TracfinDeclarations />;
      case 'dossiers':
        return <Dossiers />;
      case 'archive':
        return <Archive />;
      case 'guide':
        return <Guide />;
      case 'users':
        return <Users />;
      case 'permissions':
        return <Permissions />;
      case 'audit-logs':
        return <AuditLogs />;
      case 'reports':
        return <Reports />;
      case 'notifications':
        return <Notifications />;
      case 'signature-demo':
        return <SignatureDemo />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return <Layout onNavigate={setView}>{renderView()}</Layout>;
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;
