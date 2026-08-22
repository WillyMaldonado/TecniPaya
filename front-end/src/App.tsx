import { useState } from 'react';
import { Laptop, Users, Calendar, DollarSign, Activity } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'laptops' | 'clients' | 'rentals'>('laptops');

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Laptop className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">TecniPaya</h1>
              <span className="text-xs text-slate-400">Control de Equipos</span>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('laptops')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'laptops' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Laptop className="w-5 h-5" /> Laptops
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'clients' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" /> Clientes
            </button>
            <button
              onClick={() => setActiveTab('rentals')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'rentals' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Calendar className="w-5 h-5" /> Alquileres / Historial
            </button>
          </nav>
        </div>

        <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">
          TecniPaya S.A. v1.0.0
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
            <p className="text-sm text-slate-400">Gestión operativa del inventario y préstamos</p>
          </div>
        </header>

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Disponibles</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Prestadas</p>
              <p className="text-2xl font-bold">5</p>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Alquileres Activos</p>
              <p className="text-2xl font-bold">5</p>
            </div>
          </div>
        </div>

        {/* Placeholder para vistas */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
          Módulo de <strong className="text-white capitalize">{activeTab}</strong> listo para conectar con NestJS.
        </div>
      </main>
    </div>
  );
}
