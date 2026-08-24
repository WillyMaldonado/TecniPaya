import { useState } from 'react';
import { Laptop, Users, Search, ClipboardList, Truck } from 'lucide-react';
import LaptopsView from './components/LaptopsView';
import ConsultaNit from './components/ConsultaNit';
import ClientesView from './components/ClientesView';
import PrestamosView from './components/PrestamosView';
import SuppliersView from './components/SuppliersView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'laptops' | 'clients' | 'search' | 'loans' | 'suppliers'>('laptops');

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
              onClick={() => setActiveTab('search')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'search' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Search className="w-5 h-5" /> Consulta por NIT
            </button>
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
              onClick={() => setActiveTab('suppliers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'suppliers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Truck className="w-5 h-5" /> Proveedores
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'loans' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <ClipboardList className="w-5 h-5" /> Préstamos
            </button>
          </nav>
        </div>

        <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">
          TecniPaya S.A. v1.0.0
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'laptops' && <LaptopsView />}
        {activeTab === 'search' && <ConsultaNit />}
        {activeTab === 'clients' && <ClientesView />}
        {activeTab === 'suppliers' && <SuppliersView />}
        {activeTab === 'loans' && <PrestamosView />}
      </main>
    </div>
  );
}
