import { useState } from 'react';
import { LayoutDashboard, Users } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { PeopleList } from './components/PeopleList';
import { CreatePersonModal } from './components/CreatePersonModal';
import { PersonProfile } from './components/PersonProfile';

export function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'people' | 'profile'>('dashboard');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePersonCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSelectPerson = (id: string) => {
    setSelectedPersonId(id);
    setCurrentTab('profile');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
              <div className="bg-indigo-600 text-white p-2 rounded-lg font-bold">
                ₹
              </div>
              <span className="font-bold text-lg text-slate-900">Daily Due Ledger</span>
            </div>

            <nav className="flex space-x-2">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  currentTab === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setCurrentTab('people')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  currentTab === 'people' || currentTab === 'profile'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>People Accounts</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            key={`dash-${refreshKey}`}
            onNavigateToPeople={() => setCurrentTab('people')}
            onNavigateToCreatePerson={() => setIsCreateModalOpen(true)}
          />
        )}

        {currentTab === 'people' && (
          <PeopleList
            key={`people-${refreshKey}`}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onSelectPerson={handleSelectPerson}
          />
        )}

        {currentTab === 'profile' && selectedPersonId && (
          <PersonProfile
            key={`prof-${selectedPersonId}-${refreshKey}`}
            personId={selectedPersonId}
            onBack={() => setCurrentTab('people')}
            onDataChanged={handlePersonCreated}
          />
        )}
      </main>

      {/* Create Person Modal */}
      <CreatePersonModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPersonCreated={handlePersonCreated}
      />
    </div>
  );
}

export default App;