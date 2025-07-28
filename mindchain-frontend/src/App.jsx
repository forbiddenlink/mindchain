// src/App.jsx
import Header from './components/Header';
import DebatePanel from './components/DebatePanel';
import MessageStream from './components/MessageStream';
import FactChecker from './components/FactChecker';
import Controls from './components/Controls';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <DebatePanel />
        <div className="space-y-6">
          <MessageStream />
          <FactChecker />
          <Controls />
        </div>
      </main>
    </div>
  );
}
