import React, { useState, useEffect } from 'react';
import apiClient from '../api';

function MisPedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hook para cargar los datos cuando la página se monta
  useEffect(() => {
    const fetchMisPedidos = async () => {
      try {
        setLoading(true);
        // Llama al nuevo endpoint. El token se añade automáticamente
        const response = await apiClient.get('/orders/my-history'); 
        setPedidos(response.data);
      } catch (err) {
        console.error("Error al cargar pedidos:", err);
        setError(err.response?.data?.error || "No se pudieron cargar los pedidos");
      } finally {
        setLoading(false);
      }
    };

    fetchMisPedidos();
  }, []); // El array vacío [] asegura que se ejecute solo una vez

  // --- Renderizado Condicional ---
  if (loading) {
    return <div className="text-center mt-10">Cargando tus pedidos...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto mt-10 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Mis Pedidos</h1>
        
        {/* Mostramos un mensaje si no hay pedidos */}
        {pedidos.length === 0 ? (
          <p className="text-gray-600">Aún no has realizado ningún pedido.</p>
        ) : (
          // Si hay pedidos, mostramos la tabla
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Pedido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pedidos.map((pedido) => (
                  <tr key={pedido.id_pedido}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{pedido.id_pedido}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {/* Formateamos la fecha para que sea legible */}
                      {new Date(pedido.fechapedido).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {/* Opcional: Estilos según el estado */}
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        pedido.estado === 'Completado' ? 'bg-green-100 text-green-800' :
                        pedido.estado === 'En preparación' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ${parseFloat(pedido.total).toFixed(2)}
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

export default MisPedidosPage;