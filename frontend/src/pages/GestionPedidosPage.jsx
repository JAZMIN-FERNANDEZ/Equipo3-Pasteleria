import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';

function GestionPedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Función para cargar los pedidos ---
  const fetchPedidos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/orders');
      setPedidos(response.data);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
      setError(err.response?.data?.error || "No se pudieron cargar los pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga los pedidos al montar el componente
  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // --- Función para manejar el clic en los botones de estado ---
  const handleUpdateStatus = async (pedidoId, nuevoEstado) => {
    try {
      // Llama a la API para actualizar el estado
      await apiClient.put(`/admin/orders/${pedidoId}/status`, { estado: nuevoEstado });
      // Vuelve a cargar la lista de pedidos para reflejar el cambio
      fetchPedidos(); 
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      alert("No se pudo actualizar el estado del pedido.");
    }
  };

  // --- Renderizado ---
  if (loading) {
    return <div className="text-center mt-10">Cargando pedidos...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto mt-10 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Pedidos por Salir</h1>
        
        {pedidos.length === 0 ? (
          <p className="text-gray-600">No hay pedidos pendientes por el momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto (Primer item)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pedidos.map((pedido) => (
                  <tr key={pedido.id_pedido}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{pedido.id_pedido}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{pedido.cliente}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{pedido.producto}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{pedido.cantidad}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{pedido.hora}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        pedido.estado === 'Listo' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {/* Lógica de botones para cambiar estado */}
                      {pedido.estado === 'En preparación' && (
                        <button
                          onClick={() => handleUpdateStatus(pedido.id_pedido, 'Listo')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Marcar como Listo
                        </button>
                      )}
                      {pedido.estado === 'Pendiente' && (
                        <button
                          onClick={() => handleUpdateStatus(pedido.id_pedido, 'En preparación')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Marcar En preparación
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionPedidosPage;