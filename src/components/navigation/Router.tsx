import { createContext, useContext, useState, ReactNode } from 'react';

type View = 'dashboard' | 'clients' | 'transactions' | 'risk-assessments' | 'alerts' | 'dossiers' | 'archive' | 'guide' | 'users' | 'permissions' | 'signature-demo' | 'audit-logs' | 'reports' | 'notifications' | 'tutorial' | 'tracfin-declarations' | 'profile';

interface RouterContextType {
  currentView: View;
  setView: (view: View) => void;
  params: Record<string, string>;
  setParams: (params: Record<string, string>) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [params, setParams] = useState<Record<string, string>>({});

  const setView = (view: View) => {
    setCurrentView(view);
    setParams({});
  };

  return (
    <RouterContext.Provider value={{ currentView, setView, params, setParams }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useLocation must be used within RouterProvider');
  }
  return context;
}
