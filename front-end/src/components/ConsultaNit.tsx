import { useState } from 'react';
import type { FormEvent } from 'react';
import { Search, Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Client {
  nit: string;
  nombre: string;
  telefono?: string;
  contacto?: string;
  saldoPendiente?: number | string;
}

interface LoanItem {
  id: string;
  fechaEntrega: string;
  estado: string;
  laptops: {
    codigoInventario: string;
    laptop: {
      marca: string;
      modelo: string;
    };
  }[];
}

export default function ConsultaNit() {
  const [nitInput, setNitInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [activeLoans, setActiveLoans] = useState<LoanItem[]>([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!nitInput.trim()) return;

    setLoading(true);
    setError('');
    setClientData(null);
    setActiveLoans([]);
    setSearched(true);

    const nitTrimmed = nitInput.trim();

    try {
      // 1. Consultar datos del cliente
      const clientRes = await fetch(`http://localhost:3000/clientes/${nitTrimmed}`);

      if (!clientRes.ok) {
        if (clientRes.status === 404) {
          throw new Error(`El NIT ingresado no existe en el sistema: ${nitTrimmed}`);
        }
        throw new Error('Error al consultar la información del cliente.');
      }

      const clientJson: Client = await clientRes.json();
      setClientData(clientJson);

      // 2. Consultar los préstamos asociados a este NIT
      const loansRes = await fetch(`http://localhost:3000/loans?clienteNit=${nitTrimmed}`);
      if (loansRes.ok) {
        const loansJson: LoanItem[] = await loansRes.json();
        const activos = loansJson.filter((loan) => loan.estado === 'ACTIVO');
        setActiveLoans(activos);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error desconocido.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">Consulta De Préstamos Por NIT</h1>
        <p className="text-slate-400 text-sm mt-1">Gestión operativa del inventario y préstamos</p>
      </div>

      {/* Formulario de Búsqueda */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-6 shadow-xl">
        <form onSubmit={handleSearch} className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
            <input
              type="text"
              required
              value={nitInput}
              onChange={(e) => setNitInput(e.target.value)}
              placeholder="Ingrese el NIT del cliente (ej. 1234567-8)..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-12 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-blue-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Consultar
          </button>
        </form>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Secciones de Resultados */}
      {clientData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tarjeta Datos del Cliente */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800/80 rounded-xl p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-semibold text-white border-b border-slate-800/80 pb-3">
              Datos del Cliente
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Razón Social / Nombre</p>
                <p className="text-slate-100 font-medium text-base mt-0.5">{clientData.nombre}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">NIT</p>
                <p className="text-slate-200 font-mono mt-0.5">{clientData.nit}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Teléfono y Contacto</p>
                <p className="text-slate-200 mt-0.5">
                  {clientData.telefono || 'Sin teléfono'} ({clientData.contacto || 'Sin contacto'})
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-500">Saldo Pendiente Acumulado</p>
                <p className="text-emerald-400 font-semibold text-lg mt-0.5">
                  Q {Number(clientData.saldoPendiente || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta Equipos Actuales en Préstamo */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800/80 rounded-xl p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-semibold text-white border-b border-slate-800/80 pb-3">
              Equipos Actuales en Préstamo
            </h2>

            {activeLoans.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
                <p className="text-sm">El cliente no tiene equipos en préstamo actualmente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeLoans.map((loan) => (
                  <div key={loan.id} className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-lg space-y-3">
                    <p className="text-xs text-slate-400">
                      Fecha de entrega: <span className="text-slate-200 font-medium">{new Date(loan.fechaEntrega).toLocaleDateString()}</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {loan.laptops && loan.laptops.map((lap, idx) => (
                        <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800/60">
                          <p className="font-mono text-xs text-blue-400">{lap.codigoInventario}</p>
                          <p className="font-semibold text-sm text-slate-100">
                            {lap.laptop?.marca} {lap.laptop?.modelo}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {searched && !clientData && !error && !loading && (
        <div className="text-center py-12 text-slate-400 bg-slate-950 border border-slate-800 rounded-xl">
          <p>Ingresa un NIT para comenzar la consulta.</p>
        </div>
      )}
    </div>
  );
}
