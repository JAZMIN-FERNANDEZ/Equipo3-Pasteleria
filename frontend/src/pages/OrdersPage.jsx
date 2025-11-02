// src/components/OrdersPage.jsx
import React from 'react';

// Datos de ejemplo para los pedidos
const orders = [
  { id: '001', date: '2025-09-25', total: 85.00, status: 'Completado' },
  { id: '002', date: '2025-09-26', total: 45.00, status: 'En proceso' },
  { id: '003', date: '2025-09-27', total: 120.00, status: 'Pendiente' },
  { id: '004', date: '2025-09-28', total: 65.00, status: 'Completado' },
  { id: '005', date: '2025-09-29', total: 95.00, status: 'En proceso' },
];

// Función para obtener el color del estado
const getStatusClasses = (status) => {
  switch (status) {
    case 'Completado':
      return 'bg-green-100 text-green-800';
    case 'En proceso':
      return 'bg-yellow-100 text-yellow-800';
    case 'Pendiente':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

function OrdersPage() {
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* <Header /> iría aquí */}
      
      <main className="container mx-auto mt-10 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Mis Pedidos</h1>
          
          {/* Barra de Búsqueda */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Buscar pedidos por ID, fecha o estado..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Contenedor de la tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Pedido
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </div>
      </main>
    </div>
  );
}

export default OrdersPage;