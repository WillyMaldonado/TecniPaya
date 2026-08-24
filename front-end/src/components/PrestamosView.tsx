import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { ClipboardList, PlusCircle, Search, CheckCircle2, ShieldAlert, Loader2, Calendar, Laptop, DollarSign, X } from 'lucide-react';

interface Loan {
  id: string;
  nit: string;
  fechaEntrega: string;
  fechaDevolucionEstimada?: string;
  fechaDevolucion?: string;
  estado: 'ACTIVO' | 'FINALIZADO' | 'CANCELADO';
  costo?: number;
  cliente: {
    nit: string;
    nombre: string;
  };
  laptops: {
    codigoInventario: string;
    laptop?: {
      marca: string;
      modelo: string;
    };
  }[];
}

interface AvailableLaptop {
  codigoInventario: string;
  estado: string;
  laptop: {
    marca: string;
    modelo: string;
  };
}

interface Client {
  nit: string;
  nombre: string;
  activo?: boolean;
}

export default function PrestamosView() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterNit, setFilterNit] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [availableLaptops, setAvailableLaptops] = useState<AvailableLaptop[]>([]);

  const [form, setForm] = useState({
    clienteId: '',
    fechaEntrega: new Date().toISOString().split('T')[0],
    fechaDevolucionEstimada: '',
    laptopIds: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAuxData = async () => {
    try {
      const [clientsRes, laptopsRes] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/laptops')
      ]);

      if (clientsRes.ok) {
        const clientsData: Client[] = await clientsRes.json();
        setClients(clientsData.filter((c) => c.activo));
      }

      if (laptopsRes.ok) {
        const laptopsData: AvailableLaptop[] = await laptopsRes.json();
        setAvailableLaptops(laptopsData.filter((l) => l.estado === 'DISPONIBLE'));
      }
    } catch (err) {
      console.error('Error al cargar datos auxiliares', err);
    }
  };

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      setError('');
      try {
        let url = '/api/loans';
        if (filterNit.trim()) {
          url += `?clienteNit=${encodeURIComponent(filterNit.trim())}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error('No se pudo obtener la lista de préstamos.');
        const data: Loan[] = await res.json();
        setLoans(data);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError('Error de conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [filterNit]);

  const handleOpenModal = () => {
    fetchAuxData();
    setShowModal(true);
    setError('');
    setSuccessMsg('');
  };

  const handleCreateLoan = async (e: FormEvent) => {
    e.preventDefault();
    if (form.laptopIds.length === 0) {
      setError('Debes seleccionar al menos una laptop para el préstamo.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fechaEntrega: new Date(form.fechaEntrega).toISOString(),
          fechaDevolucionEstimada: new Date(form.fechaDevolucionEstimada).toISOString(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { message?: string }).message || 'Error al registrar el préstamo.');
      }

      setSuccessMsg('¡Préstamo creado exitosamente!');
      setShowModal(false);
      setForm({ clienteId: '', fechaEntrega: new Date().toISOString().split('T')[0], fechaDevolucionEstimada: '', laptopIds: [] });

      // Recargar la lista de préstamos manualmente tras crear uno nuevo
      const reloadRes = await fetch('/api/loans');
      if (reloadRes.ok) {
        const data: Loan[] = await reloadRes.json();
        setLoans(data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Ocurrió un error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCerrarPrestamo = async (id: string) => {
    if (!window.confirm('¿Estás seguro de cerrar este préstamo? Se calculará el costo final y se liberarán las laptops.')) return;

    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/loans/${id}/cerrar`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { message?: string }).message || 'No se pudo cerrar el préstamo.');
      }

      setSuccessMsg('Préstamo finalizado correctamente y saldo actualizado.');

      // Recargar la lista de préstamos manualmente tras cerrar uno
      const reloadRes = await fetch('/api/loans');
      if (reloadRes.ok) {
        const data: Loan[] = await reloadRes.json();
        setLoans(data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Error al intentar cerrar el préstamo.');
    }
  };

  const toggleLaptopSelection = (codigo: string) => {
    setForm(prev => {
      const exists = prev.laptopIds.includes(codigo);
      return {
        ...prev,
        laptopIds: exists ? prev.laptopIds.filter(id => id !== codigo) : [...prev.laptopIds, codigo]
      };
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Gestión de Préstamos</h1>
          <p className="text-slate-400 text-sm mt-1">Administra la entrega, estado y cierre de equipos en préstamo</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo Préstamo
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            Historial de Préstamos ({loans.length})
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={filterNit}
              onChange={(e) => setFilterNit(e.target.value)}
              placeholder="Filtrar por NIT de cliente..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-600 focus:outline-none transition-colors"
            />
            {filterNit && (
              <button
                onClick={() => setFilterNit('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <p className="text-sm">Cargando préstamos...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-sm">No se encontraron registros de préstamos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <div key={loan.id} className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-all">

                {/* Header Card */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">ID:</span>
                      <span className="text-xs font-mono text-blue-400">{loan.id}</span>
                    </div>
                    <h3 className="text-slate-100 font-semibold text-base mt-1">
                      {loan.cliente?.nombre || 'Cliente desconocido'}
                      <span className="text-xs text-slate-400 font-mono ml-2">({loan.nit})</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      loan.estado === 'ACTIVO'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {loan.estado}
                    </span>
                    {loan.estado === 'ACTIVO' && (
                      <button
                        onClick={() => handleCerrarPrestamo(loan.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-md shadow-emerald-600/20"
                      >
                        Cerrar Préstamo
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid info: Fechas y Costo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[10px]">ENTREGA</span>
                      <span>{new Date(loan.fechaEntrega).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {loan.fechaDevolucion ? (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <div>
                        <span className="text-slate-500 block text-[10px]">DEVOLUCIÓN REAL</span>
                        <span>{new Date(loan.fechaDevolucion).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div>
                        <span className="text-slate-500 block text-[10px]">ESTADO</span>
                        <span className="text-amber-400/90 font-medium">En curso</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/10 rounded-md text-emerald-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">COSTO FINAL</span>
                      <span className="font-semibold text-emerald-400 text-sm">
                        {loan.costo !== undefined && loan.costo !== null ? `Q ${Number(loan.costo).toFixed(2)}` : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Laptops asociadas */}
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider text-[11px]">Equipos en este préstamo:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {loan.laptops.map((item, idx) => (
                      <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3 text-xs">
                        <div className="p-2 bg-blue-600/10 text-blue-400 rounded-lg border border-blue-500/20">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-mono font-medium text-blue-300">{item.codigoInventario}</p>
                          <p className="text-slate-400 text-[11px]">{item.laptop?.marca} {item.laptop?.modelo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-500" />
                Registrar Nuevo Préstamo
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Cliente</label>
                <select
                  required
                  value={form.clienteId}
                  onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
                >
                  <option value="">Seleccione un cliente...</option>
                  {clients.map((c) => (
                    <option key={c.nit} value={c.nit}>
                      {c.nombre} ({c.nit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fecha de Entrega</label>
                  <input
                    type="date"
                    required
                    value={form.fechaEntrega}
                    onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fecha de Devolución Estimada</label>
                  <input
                    type="date"
                    required
                    value={form.fechaDevolucionEstimada}
                    onChange={(e) => setForm({ ...form, fechaDevolucionEstimada: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-2">Seleccionar Laptops Disponibles</label>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                  {availableLaptops.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No hay laptops disponibles en este momento.</p>
                  ) : (
                    availableLaptops.map((item) => {
                      const isSelected = form.laptopIds.includes(item.codigoInventario);
                      return (
                        <div
                          key={item.codigoInventario}
                          onClick={() => toggleLaptopSelection(item.codigoInventario)}
                          className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <Laptop className="w-4 h-4 text-blue-400" />
                            <span className="font-mono">{item.codigoInventario}</span>
                            <span className="text-slate-400">({item.laptop?.marca} {item.laptop?.modelo})</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-800 text-blue-600 focus:ring-0"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-600/20"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar Préstamo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
