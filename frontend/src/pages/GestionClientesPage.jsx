import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import toast from 'react-hot-toast'; 

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
        contrasena: '', // La contraseña se deja en blanco en edición
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
    
    // Si estamos editando y la contraseña está vacía, la quitamos para no sobreescribirla
    if (isEditMode && !dataToSend.contrasena) {
      delete dataToSend.contrasena; 
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
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
            <input 
              type="text" 
              name="nombre" 
              id="nombre" 
              value={formData.nombre} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              required 
              minLength={3}
            />
          </div>
          <div>
            <label htmlFor="correoelectronico" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input 
              type="email" 
              name="correoelectronico" 
              id="correoelectronico" 
              value={formData.correoelectronico} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              required 
            />
          </div>
          
          {/* Campo de Contraseña (Opcional en edición) */}
          {!isEditMode && (
            <div>
              <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input 
                type="password" 
                name="contrasena" 
                id="contrasena" 
                value={formData.contrasena} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                required={!isEditMode} 
                minLength={8}
              />
            </div>
          )}
          {isEditMode && (
             <p className="text-xs text-gray-500">Dejar en blanco para mantener la contraseña actual.</p>
          )}

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input 
              type="tel" 
              name="telefono" 
              id="telefono" 
              value={formData.telefono} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              pattern="[0-9]{10}"
              title="Debe ser un número de 10 dígitos"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md"
            >
              Guardar
            </button>
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
      // El interceptor maneja el error visualmente (Toast rojo)
      // Aquí solo detenemos la carga
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
        toast.success("Cliente actualizado correctamente");
      } else {
        await apiClient.post('/admin/clients', formData);
        toast.success("Cliente registrado correctamente");
      }
      // Si todo sale bien, recargamos y cerramos
      fetchClientes(); 
      handleCloseModal();
    } catch (error) {
      // Si falla (ej. correo duplicado), el interceptor muestra el error.
      // No cerramos el modal para que el admin pueda corregir.
    }
  };

  const handleDeleteCliente = (clienteId) => {
    // En lugar de window.confirm, lanzamos un toast personalizado
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="font-medium text-gray-800">
          ¿Estás seguro de eliminar a este cliente?
        </p>
        <div className="flex justify-end gap-2 mt-1">
          {/* Botón CANCELAR */}
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Cancelar
          </button>

          {/* Botón CONFIRMAR */}
          <button
            onClick={async () => {
              toast.dismiss(t.id); // Cierra el toast de pregunta
              try {
                // 1. Llamada a la API
                await apiClient.delete(`/admin/clients/${clienteId}`);
                // 2. Mensaje de éxito
                toast.success("Cliente eliminado correctamente");
                // 3. Recargar tabla
                fetchClientes(); 
              } catch (error) {
                console.error(error);
                toast.error("Error al eliminar");
              }
            }}
            className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 transition"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    ), {
      duration: Infinity, // Que no desaparezca solo
      position: 'top-center', // Opcional: Para que salga al centro arriba
      style: {
        border: '1px solid #E5E7EB',
        padding: '16px',
      },
    });
  };

  // --- Lógica de Búsqueda ---
  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.usuarios?.correoelectronico && c.usuarios.correoelectronico.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- Renderizado ---
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
            className="w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={handleOpenAddModal}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
          >
            Agregar Cliente
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha de Registro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id_cliente} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{cliente.id_cliente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cliente.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.usuarios?.correoelectronico}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.telefono}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(cliente.fecharegistro).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(cliente)}
                      className="text-blue-600 hover:text-blue-800 transition duration-200"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteCliente(cliente.id_cliente)}
                      className="text-red-600 hover:text-red-800 transition duration-200"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClientes.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No se encontraron clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GestionClientesPage;