import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Dashboard } from './pages/Dashboard';
import { Notes } from './pages/Notes';
import { Vault } from './pages/Vault';
import { Reminders } from './pages/Reminders';
import { Agent } from './pages/Agent';
import { Settings } from './pages/Settings';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'notes':
        return <Notes />;
      case 'vault':
        return <Vault />;
      case 'reminders':
        return <Reminders />;
      case 'agent':
        return <Agent />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-8 lg:pt-8">
          {renderPage()}
        </div>
      </main>

      <MobileNav currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider />
      <AppContent />
    </ThemeProvider>
  );
}