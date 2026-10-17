import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { OPAC } from './pages/OPAC';
import { QuickCirculation } from './pages/Circulation/QuickCirculation';
import { ActiveLoans } from './pages/Circulation/ActiveLoans';
import { LoanHistory } from './pages/Circulation/LoanHistory';
import { FinesList } from './pages/Circulation/FinesList';
import { ReservationsList } from './pages/Circulation/ReservationsList';
import { BookList } from './pages/Books/BookList';
import { BookImportExport } from './pages/Books/BookImportExport';
import { DigitalCollections } from './pages/Books/DigitalCollections';
import { MemberList } from './pages/Members/MemberList';
import { MemberImportExport } from './pages/Members/MemberImportExport';
import { StockOpnamePage } from './pages/StockOpname/StockOpnamePage';
import { VisitorPage } from './pages/Visitor/VisitorPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { UserProfile } from './pages/Profile/UserProfile';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickScanOpen, setQuickScanOpen] = useState(false);

  // If checking authentication, show a clean loading indicator
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Memuat Widya Pustaka...</p>
      </div>
    );
  }

  // If user is guest and wants OPAC, let them see OPAC without login
  if (!isAuthenticated && currentRoute === 'opac') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=96&auto=format&fit=crop&q=80"
              alt="Logo SMAN 3 Nganjuk"
              className="w-8 h-8 rounded-full border border-amber-400"
            />
            <div>
              <h2 className="font-black text-sm text-slate-900 dark:text-white">WIDYA PUSTAKA</h2>
              <p className="text-[10px] text-slate-500">SMA NEGERI 3 NGANJUK</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentRoute('login')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Masuk Portal Petugas
          </button>
        </header>
        <main className="flex-1">
          <OPAC />
        </main>
      </div>
    );
  }

  // If user is not authenticated and not in OPAC, show Login
  if (!isAuthenticated) {
    return (
      <Login
        onSuccess={() => setCurrentRoute('dashboard')}
        onOpenOpac={() => setCurrentRoute('opac')}
      />
    );
  }

  // Render main page content based on currentRoute
  const renderContent = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <Dashboard onNavigate={(route) => setCurrentRoute(route)} />;
      case 'opac':
        return <OPAC onNavigate={setCurrentRoute} />;
      case 'circulation-quick':
        return <QuickCirculation />;
      case 'circulation-active':
        return <ActiveLoans />;
      case 'circulation-history':
        return <LoanHistory />;
      case 'circulation-fines':
        return <FinesList />;
      case 'circulation-reservations':
        return <ReservationsList />;
      case 'books-list':
        return <BookList />;
      case 'books-import':
        return <BookImportExport />;
      case 'books-digital':
        return <DigitalCollections />;
      case 'members-list':
        return <MemberList />;
      case 'members-import':
        return <MemberImportExport />;
      case 'stock-opname':
        return <StockOpnamePage />;
      case 'visitors':
        return <VisitorPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <UserProfile />;
      default:
        return <Dashboard onNavigate={(route) => setCurrentRoute(route)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1e293b] flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={(route) => setCurrentRoute(route)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenQuickScan={() => setCurrentRoute('circulation-quick')}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={(route) => {
            setCurrentRoute(route);
            setSidebarOpen(false);
          }}
          isOpenMobile={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#F5F7FA] pb-16 print:p-0 print:overflow-visible">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
