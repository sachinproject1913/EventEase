import { useState, useCallback } from 'react';
import { User, CampusEvent, EventRegistration } from './types';
import { apiService } from './services/apiService';
import { Navbar } from './components/Navbar';
import { StudentPanel } from './components/StudentPanel';
import { OrganizerPanel } from './components/OrganizerPanel';
import { AdminPanel } from './components/AdminPanel';
import { BackendArchitectureModal } from './components/BackendArchitectureModal';
import { RegistrationConfirmModal } from './components/RegistrationConfirmModal';
import { AttendanceQrScannerModal } from './components/AttendanceQrScannerModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { AuthView } from './components/AuthView';
import { SupabaseDatabaseModal } from './components/SupabaseDatabaseModal';
import { X, Database } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => apiService.getActiveUser());
  
  // Registration confirmation modal state
  const [registeredItem, setRegisteredItem] = useState<{ event: CampusEvent; registration: EventRegistration } | null>(null);

  // Direct QR scanner modal from confirmation
  const [directQrScannerItem, setDirectQrScannerItem] = useState<{ event: CampusEvent; registration: EventRegistration } | null>(null);

  // Profile edit modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Backend Technical Specs Modal state
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);

  // Supabase Database Connection & Schema Modal state
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);

  // Refresh trigger for dependent counts
  const [, setRefreshKey] = useState(0);

  const handleRefreshAll = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    handleRefreshAll();
  };

  const handleLogout = () => {
    apiService.logout();
    setCurrentUser(null);
  };

  const handleSwitchUser = (userId: string) => {
    const updated = apiService.setActiveUser(userId);
    setCurrentUser({ ...updated });
    handleRefreshAll();
  };

  const handleProfileSave = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = apiService.updateUserProfile(currentUser.id, updates);
    setCurrentUser({ ...updated });
    handleRefreshAll();
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo data (events, leave templates, registrations) to initial state?')) {
      apiService.resetToDefaults();
      const user = apiService.getActiveUser();
      setCurrentUser(user);
      handleRefreshAll();
    }
  };

  const handleRegisterSuccess = (event: CampusEvent, registration: EventRegistration) => {
    setRegisteredItem({ event, registration });
    handleRefreshAll();
  };

  // If not logged in, render authentication page (Login & Signup)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-900 tracking-tight">CAMPUSGUARD</span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">GLA UNIVERSITY MATHURA</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Multi-Role Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSupabaseOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl font-bold shadow-2xs transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase DB & Schema</span>
            </button>
            <button
              onClick={handleResetData}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
            >
              Reset Sample Data
            </button>
          </div>
        </header>

        <main className="flex-1">
          <AuthView onAuthSuccess={handleAuthSuccess} />
        </main>

        <SupabaseDatabaseModal
          isOpen={isSupabaseOpen}
          onClose={() => setIsSupabaseOpen(false)}
          onConfigChanged={handleRefreshAll}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenProfileEdit={() => setIsProfileModalOpen(true)}
        onResetData={handleResetData}
        onLogout={handleLogout}
        onOpenSpecs={() => setIsSpecsOpen(true)}
        onOpenSupabase={() => setIsSupabaseOpen(true)}
      />

      {/* Main View: Strictly Isolated Role-Based Panels */}
      <main className="flex-1 pb-16">
        
        {/* 1. STUDENT / USER PANEL: Download only, Browse events, My registrations, QR check-in */}
        {currentUser.role === 'student' && (
          <StudentPanel
            student={currentUser}
            onOpenProfileEdit={() => setIsProfileModalOpen(true)}
            onRegisterSuccess={handleRegisterSuccess}
            onRefreshData={handleRefreshAll}
          />
        )}

        {/* 2. ORGANIZER PANEL: Form upload option only shown to organizers */}
        {currentUser.role === 'organizer' && (
          <OrganizerPanel
            organizer={currentUser}
            onRefreshEvents={handleRefreshAll}
            onOpenProfileEdit={() => setIsProfileModalOpen(true)}
          />
        )}

        {/* 3. ADMIN PANEL: Dean governance, executive metrics, master audit, event approvals */}
        {currentUser.role === 'admin' && (
          <AdminPanel
            adminUser={currentUser}
            onOpenSpecs={() => setIsSpecsOpen(true)}
            onOpenSupabase={() => setIsSupabaseOpen(true)}
          />
        )}

      </main>

      {/* Registration Confirmation Modal */}
      {registeredItem && (
        <RegistrationConfirmModal
          isOpen={true}
          onClose={() => setRegisteredItem(null)}
          event={registeredItem.event}
          student={currentUser}
          registration={registeredItem.registration}
          onGoToLeaveForms={() => setRegisteredItem(null)}
          onOpenQrScanner={(event, registration) => {
            setRegisteredItem(null);
            setDirectQrScannerItem({ event, registration });
          }}
        />
      )}

      {/* Direct QR Scanner Modal */}
      {directQrScannerItem && (
        <AttendanceQrScannerModal
          isOpen={true}
          onClose={() => setDirectQrScannerItem(null)}
          event={directQrScannerItem.event}
          registration={directQrScannerItem.registration}
          onAttendanceVerified={() => {
            handleRefreshAll();
          }}
        />
      )}

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onSave={handleProfileSave}
      />

      {/* Spring Boot & MySQL Backend Architecture Modal */}
      {isSpecsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <span className="font-bold text-sm">Java Spring Boot & MySQL Technical Specifications</span>
              <button onClick={() => setIsSpecsOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <BackendArchitectureModal />
            </div>
          </div>
        </div>
      )}

      {/* Supabase Database Connection & Schema Modal */}
      <SupabaseDatabaseModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        onConfigChanged={handleRefreshAll}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CampusGuard &copy; 2026. <strong>GLA UNIVERSITY MATHURA</strong> &bull; Event Discovery & Academic Exemption System.</span>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Active Panel: <strong className="text-slate-700 capitalize">{currentUser.role} Panel</strong></span>
            <span>&bull;</span>
            <span>Logged in as: <strong className="text-slate-700">{currentUser.name}</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
