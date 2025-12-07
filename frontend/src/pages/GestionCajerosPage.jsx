import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import toast from 'react-hot-toast';

function CajeroModal({ isOpen, onClose, onSave, cajero }) {
  const [formData, setFormData] = useState({ nombrecompleto: '', correoelectronico: '', contrasena: '', turno: 'Matutino' });
  const isEditMode = Boolean(cajero);
  useEffect(() => {
    if (isEditMode && cajero) {
      setFormData({
        nombrecompleto: cajero.nombrecompleto || '',
        correoelectronico: cajero.usuarios?.correoelectronico || '',
        contrasena: '',
        turno: cajero.turno || 'Matutino'
      });
    } else {
      setFormData({ nombrecompleto: '', correoelectronico: '', contrasena: '', turno: 'Matutino' });
    }
  }, [isOpen, cajero, isEditMode]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSend = { ...formData };
    if (isEditMode && !dataToSend.contrasena) {
      delete dataToSend.contrasena;
    }
    onSave(dataToSend, cajero?.id_empleado);
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{isEditMode ? 'Editar Cajero' : 'Agregar Cajero'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label htmlFor="nombrecompleto" className="block text-sm font-medium text-gray-700">Nombre Completo</label><input type="text" name="nombrecompleto" id="nombrecompleto" value={formData.nombrecompleto} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required /></div>
          <div><label htmlFor="correoelectronico" className="block text-sm font-medium text-gray-700">Correo Electrónico (Usuario)</label><input type="email" name="correoelectronico" id="correoelectronico" value={formData.correoelectronico} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required /></div>
          {!isEditMode && (<div><label htmlFor="contrasena" className="block text-sm font-medium text-gray-700">Contraseña</label><input type="password" name="contrasena" id="contrasena" value={formData.contrasena} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required={!isEditMode} /></div>)}
          {isEditMode && (<p className="text-xs text-gray-500">Dejar contraseña en blanco para no modificarla.</p>)}
          <div><label htmlFor="turno" className="block text-sm font-medium text-gray-700">Turno</label><select name="turno" id="turno" value={formData.turno} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option>Matutino</option><option>Vespertino</option><option>Nocturno</option></select></div>
          <div className="flex justify-end space-x-2"><button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md">Cancelar</button><button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md">Guardar</button></div>
        </form>
      </div>
    </div>
  );
}

// --- Página Principal ---
function GestionCajerosPage() {
  const [cajeros, setCajeros] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCajero, setSelectedCajero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // <-- 1. Estado para el buscador

  const fetchCajeros = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/cashiers');
      setCajeros(response.data);
    } catch (error) {
      console.error("Error al cargar cajeros:", error);
      alert(error.response?.data?.error || "Error al cargar cajeros");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCajeros();
  }, []);

  // --- Funciones CRUD (sin cambios) ---
  const handleOpenAddModal = () => { setSelectedCajero(null); setIsModalOpen(true); };
  const handleOpenEditModal = (cajero) => { setSelectedCajero(cajero); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedCajero(null); };
  const handleSaveCajero = async (formData, cajeroId) => {
    const isEditMode = Boolean(cajeroId);
    try {
      if (isEditMode) {
        await apiClient.put(`/admin/cashiers/${cajeroId}`, formData);
        toast.success("Cajero actualizado correctamente");
      } else {
        await apiClient.post('/admin/cashiers', formData);
        toast.success("Cajero agregado correctamente");
      }
      fetchCajeros();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar cajero:", error);
      alert(error.response?.data?.error || "Error al guardar cajero");
    }
  };
  const handleDeleteCajero = (cajeroId) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="font-medium text-gray-800">
          ¿Estás seguro de eliminar a este cajero?
        </p>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                // Endpoint verificado en tu backend (index.js)
                await apiClient.delete(`/admin/cashiers/${cajeroId}`); 
                toast.success("Cajero eliminado correctamente");
                fetchCajeros(); // Recarga la tabla
              } catch (error) {
                console.error(error);
                toast.error("Error al eliminar el cajero");
              }
            }}
            className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 transition"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: { border: '1px solid #E5E7EB', padding: '16px' },
    });
  };

  // 2. Lógica de filtrado
  const filteredCajeros = cajeros.filter(c =>
    c.nombrecompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.usuarios?.correoelectronico && c.usuarios.correoelectronico.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center mt-10">Cargando cajeros...</div>;
  }

  return (
    <div className="container mx-auto mt-10 p-4">
      <CajeroModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveCajero} cajero={selectedCajero} />
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Cajeros</h1>
        
        <div className="flex justify-between items-center mb-4">
          {/* 3. Conectar el input al estado */}
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="w-1/3 px-4 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={handleOpenAddModal} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md">
            Agregar Cajero
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* ... (thead sin cambios) ... */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo (Usuario)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* 4. Mapear la lista FILTRADA */}
              {filteredCajeros.map((cajero) => (
                <tr key={cajero.id_empleado}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cajero.id_empleado}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cajero.nombrecompleto}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cajero.usuarios?.correoelectronico}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cajero.turno}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleOpenEditModal(cajero)} className="text-blue-600 hover:text-blue-800">Editar</button>
                    <button onClick={() => handleDeleteCajero(cajero.id_empleado)} className="text-red-600 hover:text-red-800">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GestionCajerosPage;