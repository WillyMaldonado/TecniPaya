import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import type { LaptopData } from '../types';
import LaptopModal from './LaptopModal';

export default function LaptopsView() {
  const [laptopsList, setLaptopsList] = useState<LaptopData[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchLaptops = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('http://localhost:3000/laptops');
      if (res.ok) {
        const data: LaptopData[] = await res.json();
        setLaptopsList(data);
      }
    } catch (error) {
      console.error('Error fetching laptops:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    const loadLaptops = async () => {
      await fetchLaptops();
    };
    loadLaptops();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventario de Laptops</h2>
          <p className="text-sm text-slate-400">Administración y ciclo de vida de los equipos</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva Laptop
        </button>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p>Cargando inventario de laptops...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-sm border-b border-slate-800">
                <th className="px-6 py-4 font-medium">Código Inv.</th>
                <th className="px-6 py-4 font-medium">Marca y Modelo</th>
                <th className="px-6 py-4 font-medium">Proveedor</th>
                <th className="px-6 py-4 font-medium">Accesorios</th>
                <th className="px-6 py-4 font-medium">Licencias</th>
                <th className="px-6 py-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {laptopsList.map((laptop) => (
                <tr key={laptop.codigoInventario} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-blue-400 text-sm">{laptop.codigoInventario}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold">{laptop.marca}</p>
                    <p className="text-xs text-slate-400">{laptop.modelo}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {laptop.proveedor?.nombre || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded ${laptop.tieneMaletin ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-800 text-slate-500'}`}>
                        Maletín {laptop.tieneMaletin ? 'Sí' : 'No'}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${laptop.tieneCargador ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-800 text-slate-500'}`}>
                        Cargador {laptop.tieneCargador ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {laptop.licencias && laptop.licencias.length > 0 ? (
                        laptop.licencias.map((lic) => (
                          <span key={lic.id} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded border border-slate-700">
                            {lic.nombreLicencia}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic">Sin licencias</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      laptop.estado === 'DISPONIBLE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      laptop.estado === 'PRESTADA' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      laptop.estado === 'EN_REPARACION' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {laptop.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {laptopsList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No hay laptops registradas en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para dar de alta una nueva laptop */}
      <LaptopModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLaptops}
      />
    </div>
  );
}
