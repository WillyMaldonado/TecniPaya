import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Users, UserPlus, Search, Phone, CheckCircle2, ShieldAlert, Loader2, Pencil, PowerOff, X } from 'lucide-react';

interface Client {
  nit: string;
  nombre: string;
  telefono?: string;
  contacto?: string;
  saldoPendiente?: number | string;
  activo?: boolean; // Añadido para manejar el estado visual
}

export default function ClientesView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estado para el formulario (Nuevo / Edición)
  const [form, setForm] = useState({
    nit: '',
    nombre: '',
    telefono: '',
    contacto: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cargar lista de clientes
  const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
      // Agregamos ?todos=true para traer también los inactivos
      const res = await fetch('/api/clientes?todos=true');
      if (!res.ok) throw new Error('No se pudo obtener la lista de clientes.');
      const data = await res.json();
      setClients(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadClients = async () => {
      await fetchClients();
    };
    loadClients();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const url = isEditing
        ? `/api/clientes/${form.nit}`
        : '/api/clientes';

      const method = isEditing ? 'PATCH' : 'POST';

      const bodyData = isEditing
        ? { nombre: form.nombre, telefono: form.telefono, contacto: form.contacto }
        : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || (isEditing ? 'Error al actualizar el cliente.' : 'Error al registrar el cliente.'));
      }

      setSuccessMsg(isEditing ? '¡Cliente actualizado exitosamente!' : '¡Cliente registrado exitosamente!');
      resetForm();
      fetchClients();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Ocurrió un error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  // Preparar formulario para edición
  const handleEditClick = (client: Client) => {
    setIsEditing(true);
    setForm({
      nit: client.nit,
      nombre: client.nombre,
      telefono: client.telefono || '',
      contacto: client.contacto || '',
    });
    setError('');
    setSuccessMsg('');
  };

  // Cancelar edición
  const resetForm = () => {
    setIsEditing(false);
    setForm({ nit: '', nombre: '', telefono: '', contacto: '' });
  };

  // Inactivar cliente (soft-delete: el backend nunca borra registros, RN-08)
  const handleInactivar = async (nit: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas inactivar al cliente con NIT: ${nit}? El registro no se eliminará, solo dejará de aparecer como activo.`)) return;

    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/clientes/${nit}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'No se pudo inactivar el cliente.');
      }

      setSuccessMsg('Cliente inactivado correctamente.');
      fetchClients();
      if (form.nit === nit && isEditing) {
        resetForm();
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Error al intentar inactivar el cliente.');
    }
  };

  // Lógica de filtrado:
  // - Si no hay búsqueda: mostrar solo activos.
  // - Si hay búsqueda: buscar en todos (activos e inactivos).
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.nombre.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.nit.toLowerCase().includes(searchFilter.toLowerCase());
    const isVisible = searchFilter ? true : c.activo !== false;
    return matchesSearch && isVisible;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">Gestión de Clientes</h1>
        <p className="text-slate-400 text-sm mt-1">Administra el directorio de clientes, edita datos o da de baja registros</p>
      </div>

      {/* Mensajes de Alerta */}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario de Nuevo / Editar Cliente */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800/80 rounded-xl p-6 space-y-4 shadow-xl h-fit">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              {isEditing ? <Pencil className="w-4 h-4 text-amber-500" /> : <UserPlus className="w-4 h-4 text-blue-500" />}
              {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            {isEditing && (
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md"
              >
                <X className="w-3 h-3" /> Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">NIT</label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={form.nit}
                onChange={(e) => setForm({ ...form, nit: e.target.value })}
                placeholder="Ej. 1234567-8"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isEditing && <span className="text-[10px] text-slate-500 mt-1 block">El NIT no se puede modificar.</span>}
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Nombre / Razón Social</label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre completo o empresa"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Teléfono</label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="Ej. 5555-5555"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Persona de Contacto</label>
              <input
                type="text"
                value={form.contacto}
                onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                placeholder="Nombre del encargado"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2.5 rounded-lg text-sm text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-lg disabled:opacity-50 mt-2 ${
                isEditing
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
              }`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Actualizar Cliente' : 'Guardar Cliente'}
            </button>
          </form>
        </div>

        {/* Listado y Tabla de Clientes */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800/80 rounded-xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Directorio de Clientes ({filteredClients.length})
            </h2>

            {/* Buscador actualizado */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar (incluye inactivos)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-sm">Cargando clientes...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-sm">No se encontraron clientes registrados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">NIT</th>
                    <th className="py-3 px-4">Nombre / Razón Social</th>
                    <th className="py-3 px-4">Contacto / Teléfono</th>
                    <th className="py-3 px-4 text-right">Saldo</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredClients.map((client) => (
                    <tr key={client.nit} className="hover:bg-slate-900/40 transition-colors">
                      <td className={`py-3.5 px-4 font-mono text-xs ${client.activo === false ? 'text-slate-500' : 'text-blue-400'}`}>
                        {client.nit}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-100">
                        {/* Etiqueta visual y tachado para inactivos */}
                        <div className="flex items-center gap-2">
                          <span className={client.activo === false ? 'text-slate-500 line-through' : ''}>
                            {client.nombre}
                          </span>
                          {client.activo === false && (
                            <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{client.telefono || 'S/N'}</span>
                        </div>
                        <div className="text-slate-500 mt-0.5">{client.contacto || ''}</div>
                      </td>
                      <td className={`py-3.5 px-4 text-right font-semibold ${client.activo === false ? 'text-slate-600' : 'text-emerald-400'}`}>
                        Q {Number(client.saldoPendiente || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(client)}
                            title="Editar cliente"
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors"
                          >
                            <Pencil className="w-4 h-4 text-amber-400" />
                          </button>
                          {/* Ocultamos el botón de inactivar si ya está inactivo */}
                          {client.activo !== false && (
                            <button
                              onClick={() => handleInactivar(client.nit)}
                              title="Inactivar cliente"
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-red-400 rounded-lg border border-slate-800 transition-colors"
                            >
                              <PowerOff className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
