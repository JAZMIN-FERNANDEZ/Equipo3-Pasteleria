// src/pages/GestionRecompensasPage.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api';

// --- MODAL DE RECOMPENSA ---
function RecompensaModal({ isOpen, onClose, onSave, recompensa }) {
  const [formData, setFormData] = useState({
    nombrerecompensa: '',
    descripcion: '',
    tipo: 'PORCENTAJE_DESCUENTO', // Tipo por defecto
    valor: 10,
    puntosrequeridos: 500
  });

  const isEditMode = Boolean(recompensa);

  useEffect(() => {
    if (isEditMode && recompensa) {
      setFormData({
        nombrerecompensa: recompensa.nombrerecompensa || '',
        descripcion: recompensa.descripcion || '',
        tipo: recompensa.tipo || 'PORCENTAJE_DESCUENTO',
        valor: recompensa.valor || 10,
        puntosrequeridos: recompensa.puntosrequeridos || 500
      });
    } else {
      setFormData({ nombrerecompensa: '', descripcion: '', tipo: 'PORCENTAJE_DESCUENTO', valor: 10, puntosrequeridos: 500 });
    }
  }, [isOpen, recompensa, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, recompensa?.id_recompensa);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isEditMode ? 'Editar Regla de Recompensa' : 'Agregar Regla de Recompensa'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombrerecompensa" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input type="text" name="nombrerecompensa" id="nombrerecompensa" value={formData.nombrerecompensa} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
            <input type="text" name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">Tipo de Recompensa</label>
            <select name="tipo" id="tipo" value={formData.tipo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="PORCENTAJE_DESCUENTO">Descuento (%)</option>
              <option value="MONTO_FIJO_DESCUENTO">Descuento Fijo ($)</option>
              {/* <option value="PRODUCTO_GRATIS">Producto Gratis</option> */}
            </select>
          </div>
          <div>
            <label htmlFor="valor" className="block text-sm font-medium text-gray-700">Valor (Ej: 10 para 10% o 10 para $10)</label>
            <input type="number" name="valor" id="valor" value={formData.valor} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="puntosrequeridos" className="block text-sm font-medium text-gray-700">Condición (Ej: 500 para $500 de compra)</label>
            <input type="number" name="puntosrequeridos" id="puntosrequeridos" value={formData.puntosrequeridos} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
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

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
function GestionRecompensasPage() {
  const [recompensas, setRecompensas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecompensa, setSelectedRecompensa] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Carga de Datos ---
  const fetchRecompensas = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/rewards');
      setRecompensas(response.data);
    } catch (error) {
      console.error("Error al cargar recompensas:", error);
      alert(error.response?.data?.error || "Error al cargar recompensas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecompensas();
  }, []);

  // --- Funciones de Modales ---
  const handleOpenAddModal = () => {
    setSelectedRecompensa(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (recompensa) => {
    setSelectedRecompensa(recompensa);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecompensa(null);
  };

  // --- Funciones CRUD ---
  const handleSaveRecompensa = async (formData, recompensaId) => {
    const isEditMode = Boolean(recompensaId);
    try {
      if (isEditMode) {
        await apiClient.put(`/admin/rewards/${recompensaId}`, formData);
      } else {
        await apiClient.post('/admin/rewards', formData);
      }
      fetchRecompensas();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar recompensa:", error);
      alert(error.response?.data?.error || "Error al guardar recompensa");
    }
  };

  const handleDeleteRecompensa = async (recompensaId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta regla de recompensa?")) {
      try {
        await apiClient.delete(`/admin/rewards/${recompensaId}`);
        fetchRecompensas();
      } catch (error) {
        console.error("Error al eliminar recompensa:", error);
        alert(error.response?.data?.error || "Error al eliminar recompensa");
      }
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Cargando reglas de recompensas...</div>;
  }

  return (
    <div className="container mx-auto mt-10 p-4">
      <RecompensaModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRecompensa}
        recompensa={selectedRecompensa}
      />

      <div className="bg-white p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Reglas de Recompensas</h1>
        
        <div className="flex justify-end items-center mb-4">
          <button
            onClick={handleOpenAddModal}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md"
          >
            Agregar Regla
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condición (Ej: Gasto)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recompensas.map((r) => (
                <tr key={r.id_recompensa}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.nombrerecompensa}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.tipo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parseFloat(r.valor).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parseFloat(r.puntosrequeridos).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(r)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteRecompensa(r.id_recompensa)}
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

export default GestionRecompensasPage;