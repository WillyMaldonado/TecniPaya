import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Supplier } from '../types';

interface LaptopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LaptopModal({ isOpen, onClose, onSuccess }: LaptopModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState({
    codigoInventario: '',
    marca: '',
    modelo: '',
    maletin: true,
    cargador: true,
    proveedorId: '',
  });

  useEffect(() => {
    if (isOpen) {
      const fetchSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
          const res = await fetch('http://localhost:3000/proveedores');
          if (res.ok) {
            const data: Supplier[] = await res.json();
            setSuppliers(data);
          }
        } catch (err) {
          console.error('Error cargando proveedores', err);
        } finally {
          setLoadingSuppliers(false);
        }
      };
      fetchSuppliers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3000/laptops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('No se pudo registrar la laptop. Verifique los datos.');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error desconocido.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-lg p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold">Alta de Nueva Laptop</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Código de Inventario *</label>
            <input
              type="text"
              required
              value={formData.codigoInventario}
              onChange={(e) => setFormData({ ...formData, codigoInventario: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              placeholder="ej. LAP-001"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Marca *</label>
              <input
                type="text"
                required
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                placeholder="ej. Dell"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Modelo *</label>
              <input
                type="text"
                required
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                placeholder="ej. Latitude 5420"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Proveedor *</label>
            {loadingSuppliers ? (
              <p className="text-xs text-slate-500">Cargando proveedores...</p>
            ) : (
              <select
                required
                value={formData.proveedorId}
                onChange={(e) => setFormData({ ...formData, proveedorId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-blue-600 focus:outline-none text-slate-200"
              >
                <option value="">Seleccione un proveedor</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-3 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={formData.maletin}
                onChange={(e) => setFormData({ ...formData, maletin: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
              />
              <span className="text-sm">Incluye Maletín</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-3 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={formData.cargador}
                onChange={(e) => setFormData({ ...formData, cargador: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
              />
              <span className="text-sm">Incluye Cargador</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm bg-slate-900 hover:bg-slate-800 text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar Equipo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
