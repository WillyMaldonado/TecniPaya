import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { Truck, PlusCircle, Search, ShieldAlert, CheckCircle2, Loader2, X, Trash2, Pencil } from 'lucide-react';
import type { Supplier } from '../types';

export default function SuppliersView() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estados para controlar la edición
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombre: '',
  });

  const fetchSuppliers = useCallback(async () => {
    setError('');

    try {
      const res = await fetch(
        '/api/proveedores?todos=true',
      );

      if (!res.ok) {
        throw new Error('No se pudo obtener la lista de proveedores.');
      }

      const data: Supplier[] = await res.json();
      setSuppliers(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error de conexión con el servidor.');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSuppliers = async () => {
      try {
        const res = await fetch(
          '/api/proveedores?todos=true',
        );

        if (!res.ok) {
          throw new Error('No se pudo obtener la lista de proveedores.');
        }

        const data: Supplier[] = await res.json();

        if (!cancelled) {
          setSuppliers(data);
          setError('');
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Error de conexión con el servidor.');
          }

          setLoading(false);
        }
      }
    };

    void loadSuppliers();

    return () => {
      cancelled = true;
    };
  }, []);

  // Manejador unificado para Crear y Actualizar
  const handleSubmitSupplier = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const url = isEditing
        ? `/api/proveedores/${currentId}`
        : '/api/proveedores';

      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { message?: string }).message || (isEditing ? 'Error al actualizar el proveedor.' : 'Error al registrar el proveedor.'));
      }

      setSuccessMsg(isEditing ? '¡Proveedor actualizado exitosamente!' : '¡Proveedor registrado exitosamente!');
      closeModal();
      fetchSuppliers();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Ocurrió un error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentId(null);
    setForm({ nombre: '' });
    setError('');
    setSuccessMsg('');
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (sup: Supplier) => {
    setIsEditing(true);
    setCurrentId(sup.id);
    setForm({ nombre: sup.nombre });
    setError('');
    setSuccessMsg('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentId(null);
    setForm({ nombre: '' });
  };

  const handleInactivate = async (id: string, nombre: string) => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas inactivar al proveedor "${nombre}"?`);
    if (!confirmar) return;

    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/proveedores/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { message?: string }).message || 'Error al inactivar el proveedor.');
      }

      setSuccessMsg('Proveedor inactivado correctamente.');
      fetchSuppliers();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Error al intentar inactivar.');
    }
  };

  const filteredSuppliers = suppliers.filter(sup => {
    const matchesSearch = sup.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const isVisible = searchTerm ? true : sup.activo !== false;
    return matchesSearch && isVisible;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Gestión de Proveedores</h1>
          <p className="text-slate-400 text-sm mt-1">Administra los proveedores registrados en el sistema</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo Proveedor
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
            <Truck className="w-4 h-4 text-blue-500" />
            Proveedores ({filteredSuppliers.length})
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar (incluye inactivos)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-600 focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
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
            <p className="text-sm">Cargando proveedores...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-sm">No se encontraron proveedores.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((sup) => (
              <div key={sup.id} className="group bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg border ${sup.activo === false ? 'bg-slate-800/50 border-slate-700 text-slate-500' : 'bg-blue-600/10 border-blue-500/20 text-blue-500'}`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">ID: {sup.id}</span>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold text-base ${sup.activo === false ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                        {sup.nombre}
                      </h3>
                      {sup.activo === false && (
                        <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                          Inactivo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  {/* Botón de Editar */}
                  <button
                    onClick={() => handleOpenEdit(sup)}
                    className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                    title="Editar proveedor"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Botón de Inactivar */}
                  {sup.activo !== false && (
                    <button
                      onClick={() => handleInactivate(sup.id, sup.nombre)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Inactivar proveedor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para Crear / Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {isEditing ? <Pencil className="w-5 h-5 text-amber-500" /> : <PlusCircle className="w-5 h-5 text-blue-500" />}
                {isEditing ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre del Proveedor *</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ nombre: e.target.value })}
                  placeholder="ej. Dell Guatemala"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2 rounded-xl text-xs text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg ${
                    isEditing
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                  }`}
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isEditing ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
