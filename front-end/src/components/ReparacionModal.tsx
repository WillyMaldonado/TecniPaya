import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, Loader2, Wrench } from 'lucide-react';
import type { Supplier } from '../types';

interface ReparacionModalProps {
  isOpen: boolean;
  codigoInventario: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReparacionModal({
  isOpen,
  codigoInventario,
  onClose,
  onSuccess,
}: ReparacionModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState({
    proveedorId: '',
    fechaEstimadaRetorno: '',
    motivoFalla: '',
  });

  // Cargar proveedores solo cuando el modal se abre, de forma segura
  useEffect(() => {
    if (isOpen) {
      const fetchSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
          const res = await fetch('/api/proveedores');
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

  if (!isOpen || !codigoInventario) return null;

  const handleClose = () => {
    setFormData({ proveedorId: '', fechaEstimadaRetorno: '', motivoFalla: '' });
    setError('');
    onClose();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const body: Record<string, string> = {
        proveedorId: formData.proveedorId,
        motivoFalla: formData.motivoFalla,
      };
      if (formData.fechaEstimadaRetorno) {
        body.fechaEstimadaRetorno = new Date(formData.fechaEstimadaRetorno).toISOString();
      }

      const res = await fetch(
        `/api/laptops/${codigoInventario}/reparacion`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { message?: string }).message ||
            'No se pudo enviar la laptop a reparación.',
        );
      }

      onSuccess();
      handleClose();
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-purple-400" />
            Enviar a Reparación
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 -mt-2">
          Laptop: <span className="font-mono text-blue-400">{codigoInventario}</span>
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Proveedor que realiza la reparación *
            </label>
            {loadingSuppliers ? (
              <p className="text-xs text-slate-500">Cargando proveedores...</p>
            ) : (
              <select
                required
                value={formData.proveedorId}
                onChange={(e) => setFormData({ ...formData, proveedorId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
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

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Fecha estimada de retorno
            </label>
            <input
              type="date"
              value={formData.fechaEstimadaRetorno}
              onChange={(e) =>
                setFormData({ ...formData, fechaEstimadaRetorno: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Opcional.</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Motivo o descripción de la falla *
            </label>
            <textarea
              required
              rows={3}
              value={formData.motivoFalla}
              onChange={(e) => setFormData({ ...formData, motivoFalla: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-purple-500 focus:outline-none resize-none"
              placeholder="Ej. No enciende, pantalla dañada..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-600/20"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Enviar a Reparación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
