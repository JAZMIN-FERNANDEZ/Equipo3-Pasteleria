import React, { useState, useEffect } from 'react';
import apiClient from '../api';

// ================================================
// ===   MODAL PARA AGREGAR/EDITAR CLIENTE      ===
// ================================================
function ClienteModal({ isOpen, onClose, onSave, cliente }) {
  const [formData, setFormData] = useState({
    nombre: '',
    correoelectronico: '',
    contrasena: '',
    telefono: ''
  });

  const isEditMode = Boolean(cliente);

  useEffect(() => {
    if (isEditMode && cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        correoelectronico: cliente.usuarios?.correoelectronico || '',
        contrasena: '', // Contraseña se deja en blanco en modo edición
        telefono: cliente.telefono || ''
      });
    } else {
      setFormData({ nombre: '', correoelectronico: '', contrasena: '', telefono: '' });
    }
  }, [isOpen, cliente, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSend = { ...formData };
    if (isEditMode && !dataToSend.contrasena) {
      delete dataToSend.contrasena; // No se envía si está vacía en modo edición
    }
    onSave(dataToSend, cliente?.id_cliente);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isEditMode ? 'Editar Cliente' : 'Agregar Cliente'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
          </div>
          <div>
            <label htmlFor="correoelectronico" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input type="email" name="correoelectronico" id="correoelectronico" value={formData.correoelectronico} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
          </div>
          {!isEditMode && (
            <div>
              <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input type="password" name="contrasena" id="contrasena" value={formData.contrasena} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required={!isEditMode} />
            </div>
          )}
          {isEditMode && (
             <p className="text-xs text-gray-500">La contraseña no se puede editar desde aquí.</p>
          )}
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input type="tel" name="telefono" id="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md">Cancelar</button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ================================================
// ===   COMPONENTE PRINCIPAL DE LA PÁGINA      ===
// ================================================
function GestionClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Carga de Datos ---
  const fetchClientes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/clients');
      setClientes(response.data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      alert(error.response?.data?.error || "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // --- Funciones de Modales ---
  const handleOpenAddModal = () => {
    setSelectedCliente(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (cliente) => {
    setSelectedCliente(cliente);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCliente(null);
  };

  // --- Funciones CRUD ---
  const handleSaveCliente = async (formData, clienteId) => {
    const isEditMode = Boolean(clienteId);
    try {
      if (isEditMode) {
        await apiClient.put(`/admin/clients/${clienteId}`, formData);
      } else {
        await apiClient.post('/admin/clients', formData);
      }
      fetchClientes(); 
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      alert(error.response?.data?.error || "Error al guardar cliente");
    }
  };

  const handleDeleteCliente = async (clienteId) => {
    if (window.confirm("¿Estás seguro de que quieres desactivar este cliente?")) {
      try {
        await apiClient.delete(`/admin/clients/${clienteId}`);
        fetchClientes(); 
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        alert(error.response?.data?.error || "Error al eliminar cliente");
      }
    }
  };

  // --- Lógica de Búsqueda ---
  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.usuarios?.correoelectronico && c.usuarios.correoelectronico.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center mt-10">Cargando clientes...</div>;
  }

  return (
    <div className="container mx-auto mt-10 p-4">
      <ClienteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCliente}
        cliente={selectedCliente}
      />

      <div className="bg-white p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Clientes</h1>
        
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="w-1/3 px-4 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={handleOpenAddModal}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md"
          >
            Agregar Cliente
          </button>
        </div>
        
        {/* Tabla de Clientes (Basada en UI Pág. 13) */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha de Registro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id_cliente}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cliente.id_cliente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cliente.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.usuarios?.correoelectronico}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.telefono}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(cliente.fecharegistro).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(cliente)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteCliente(cliente.id_cliente)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
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

export default GestionClientesPage;