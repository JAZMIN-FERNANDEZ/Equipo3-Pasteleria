import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import toast from 'react-hot-toast'; 

// ================================================
// ===   MODAL PARA AGREGAR/EDITAR PROVEEDOR    ===
// ================================================
function SupplierModal({ isOpen, onClose, onSave, supplier }) {
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    rfc: ''
  });

  const isEditMode = Boolean(supplier);

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isEditMode && supplier) {
      setFormData({
        nombre: supplier.nombre || '',
        contacto: supplier.contacto || '',
        telefono: supplier.telefono || '',
        rfc: supplier.rfc || ''
      });
    } else {
      setFormData({ nombre: '', contacto: '', telefono: '', rfc: '' });
    }
  }, [isOpen, supplier, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, supplier?.id_proveedor);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isEditMode ? 'Editar Proveedor' : 'Agregar Proveedor'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
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
            <label htmlFor="contacto" className="block text-sm font-medium text-gray-700">Nombre de Contacto</label>
            <input 
              type="text" 
              name="contacto" 
              id="contacto" 
              value={formData.contacto} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
            />
          </div>
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
            />
          </div>
          <div>
            <label htmlFor="rfc" className="block text-sm font-medium text-gray-700">RFC</label>
            <input 
              type="text" 
              name="rfc" 
              id="rfc" 
              value={formData.rfc} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              minLength={12}
              maxLength={13}
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
function GestionProveedoresPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // --- Carga de Datos ---
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      // No necesitamos alert, el interceptor muestra el toast
      console.error("Error local:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // --- Funciones de Modal ---
  const handleOpenAddModal = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
  };

  // --- Funciones CRUD ---
  const handleSaveSupplier = async (formData, supplierId) => {
    const isEditMode = Boolean(supplierId);
    try {
      if (isEditMode) {
        await apiClient.put(`/admin/suppliers/${supplierId}`, formData);
        toast.success("Proveedor actualizado correctamente");
      } else {
        await apiClient.post('/admin/suppliers', formData);
        toast.success("Proveedor agregado correctamente");
      }
      // Recargar tabla y cerrar modal si todo salió bien
      fetchSuppliers(); 
      handleCloseModal();
    } catch (error) {
      // El interceptor maneja el error visual
    }
  };

  const handleDeleteSupplier = (supplierId) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="font-medium text-gray-800">
          ¿Estás seguro de eliminar a este proveedor?
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
                await apiClient.delete(`/admin/suppliers/${supplierId}`);
                toast.success("Proveedor eliminado correctamente");
                fetchSuppliers(); // Recarga la tabla
              } catch (error) {
                console.error(error);
                toast.error("Error al eliminar el proveedor");
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

  // --- Lógica de Filtrado ---
  const filteredSuppliers = suppliers.filter(s =>
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.rfc && s.rfc.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- Renderizado ---
  if (loading) {
    return <div className="text-center mt-10">Cargando proveedores...</div>;
  }

  return (
    <div className="container mx-auto mt-10 p-4">
      <SupplierModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveSupplier}
        supplier={selectedSupplier}
      />

      <div className="bg-white p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Proveedores</h1>
        
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre o RFC..."
            className="w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={handleOpenAddModal}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
          >
            Agregar Proveedor
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RFC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((sup) => (
                <tr key={sup.id_proveedor} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{sup.id_proveedor}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sup.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sup.contacto || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sup.telefono || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sup.rfc || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(sup)}
                      className="text-blue-600 hover:text-blue-800 transition duration-200"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(sup.id_proveedor)}
                      className="text-red-600 hover:text-red-800 transition duration-200"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No se encontraron proveedores.
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

export default GestionProveedoresPage;