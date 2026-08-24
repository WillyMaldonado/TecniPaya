import { useState } from 'react';
import type { FormEvent } from 'react';
import { X, Loader2, Ban } from 'lucide-react';

interface BajaDefinitivaModalProps {
  isOpen: boolean;
  codigoInventario: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BajaDefinitivaModal({
  isOpen,
  codigoInventario,
  onClose,
  onSuccess,
}: BajaDefinitivaModalProps) {
  const [motivoBaja, setMotivoBaja] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !codigoInventario) return null;

  const handleClose = () => {
    setMotivoBaja('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(
        `/api/laptops/${codigoInventario}/baja-definitiva`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivoBaja }),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { message?: string }).message ||
            'No se pudo dar de baja la laptop.',
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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-400" />
            Dar de Baja Definitiva
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 -mt-2">
          Laptop: <span className="font-mono text-blue-400">{codigoInventario}</span>
        </p>

        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-400 text-xs">
          Esta acción es permanente: el equipo quedará como BAJA_DEFINITIVA y no podrá
          volver a prestarse ni enviarse a reparación. El registro no se elimina, conserva
          su historial.
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Motivo de la baja *
            </label>
            <textarea
              required
              rows={3}
              value={motivoBaja}
              onChange={(e) => setMotivoBaja(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-red-500 focus:outline-none resize-none"
              placeholder="Ej. Equipo obsoleto, no es reparable..."
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
              className="px-4 py-2 rounded-xl text-xs bg-red-600 hover:bg-red-500 text-white font-medium flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-red-600/20"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar Baja Definitiva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
