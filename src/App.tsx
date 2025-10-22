import { useState } from 'react';
import { ScheduleProvider } from './context/ScheduleContext';
import { RulesConfig } from './components/RulesConfig/RulesConfig';
import { ScheduleCalendar } from './components/ScheduleCalendar/ScheduleCalendar';
import './index.css';

function App() {
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  return (
    <ScheduleProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">🏥 Hospital Shift Scheduler</h1>
              <p className="text-blue-100 mt-2">
                Intelligent shift planning with constraint satisfaction
              </p>
            </div>
            <button
              onClick={() => setRulesModalOpen(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg shadow-md transition"
            >
              ⚙️ Configure Rules
            </button>
          </div>
        </header>

        <main className="px-4 py-8">
          <ScheduleCalendar />
        </main>

        <RulesConfig isOpen={rulesModalOpen} onClose={() => setRulesModalOpen(false)} />

        <footer className="bg-gray-800 text-gray-400 py-6 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p>Built with React, TypeScript, and Vite</p>
            <p className="text-sm mt-2">
              Automated shift scheduling with fair distribution and constraint satisfaction
            </p>
          </div>
        </footer>
      </div>
    </ScheduleProvider>
  );
}

export default App;
