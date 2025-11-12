// src/components/EditStatusModal.jsx

import React, { useState } from 'react';
import apiClient from '../api';

function EditStatusModal({ isOpen, onClose, order, onSaveSuccess }) {
  // El estado del modal es el estado actual del pedido
  const [newStatus, setNewStatus] = useState(order?.estado || 'Pendiente');
  const [loading, setLoading] = useState(false);

  // Actualiza el estado del modal si el pedido cambia
  React.useEffect(() => {
    if (order) {
      setNewStatus(order.estado);
    }
  }, [order]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Llama a la misma API de 'status' que usa el cajero
      await apiClient.put(`/admin/orders/${order.id_pedido}/status`, { 
        estado: newStatus 
      });
      onSaveSuccess(); // Refresca la tabla
      onClose(); // Cierra el modal
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert("No se pudo actualizar el estado.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Editar Estado (Admin)</h2>
        <p className="mb-4">Pedido #{order.id_pedido} ({order.cliente})</p>
        
        <div className="mb-6">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Cambiar estado a:
          </label>
          <select
            id="status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="Pendiente">Pendiente</option>
            <option value="En preparación">En preparación</option>
            <option value="Listo">Listo</option>
            <option value="Completado">Completado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-400"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditStatusModal;