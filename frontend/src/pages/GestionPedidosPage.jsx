import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import PaymentModal from '../components/PaymentModal';
import EditStatusModal from '../components/EditStatusModal'; // <-- 1. IMPORTA EL NUEVO MODAL
import { useAuth } from '../context/AuthContext'; // <-- 2. IMPORTA useAuth

function GestionPedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('activos');

  // Estados para los modales
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // <-- 3. ESTADO PARA EL NUEVO MODAL
  const [selectedOrder, setSelectedOrder] = useState(null);

  // --- 4. Obtén el rol del usuario ---
  const { user } = useAuth();
  const isAdmin = user && user.rol === 'Administrador';

  // --- (La función fetchPedidos no cambia) ---
  const fetchPedidos = useCallback(async () => {
    try {
      setLoading(true);
      const statusQuery = (activeTab === 'historial') ? 'completed' : 'active';
      const response = await apiClient.get('/admin/orders', {
        params: { status: statusQuery }
      });
      setPedidos(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "No se pudieron cargar los pedidos");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // --- Funciones de Modales ---
  const handleOpenPaymentModal = (pedido) => {
    setSelectedOrder(pedido);
    setIsPaymentModalOpen(true);
  };
  const handleClosePaymentModal = () => {
    setSelectedOrder(null);
    setIsPaymentModalOpen(false);
  };
  const handlePaymentSuccess = () => {
    fetchPedidos();
  };

  // --- 5. Funciones para el nuevo Modal de Admin ---
  const handleOpenEditModal = (pedido) => {
    setSelectedOrder(pedido);
    setIsEditModalOpen(true);
  };
  const handleCloseEditModal = () => {
    setSelectedOrder(null);
    setIsEditModalOpen(false);
  };
  const handleSaveSuccess = () => {
    fetchPedidos();
  };

  // --- (Lógica de filtrado no cambia) ---
  const filteredPedidos = pedidos.filter(pedido =>
    pedido.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(pedido.id_pedido).includes(searchTerm)
  );

  // --- Renderizado ---
  if (loading) return <div className="text-center mt-10">Cargando pedidos...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto mt-10 p-4">
      {/* Registra AMBOS modales */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        order={selectedOrder}
        onPaymentSuccess={handlePaymentSuccess}
      />
      {/* 6. Añade el nuevo modal (solo se renderizará si eres Admin) */}
      {isAdmin && (
        <EditStatusModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          order={selectedOrder}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      <div className="bg-white p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Pedidos</h1>
        
        {/* ... (Pestañas y Buscador no cambian) ... */}
        <div className="flex border-b border-gray-200 mb-4">
          <button onClick={() => setActiveTab('activos')} className={`py-2 px-4 ${activeTab === 'activos' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
            Pedidos Activos
          </button>
          <button onClick={() => setActiveTab('historial')} className={`py-2 px-4 ${activeTab === 'historial' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
            Historial (Terminados)
          </button>
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por ID de pedido o nombre de cliente..."
            className="w-1/3 px-4 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredPedidos.length === 0 ? (
          <p className="text-gray-600">No hay pedidos que coincidan con esta vista.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPedidos.map((pedido) => (
                  <tr key={pedido.id_pedido}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{pedido.id_pedido}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{pedido.cliente}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{pedido.hora}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{pedido.metodo_pago}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">${parseFloat(pedido.total).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        pedido.estado === 'Completado' ? 'bg-green-100 text-green-800' :
                        pedido.estado === 'En preparación' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      {/* 7. Lógica de botones condicional */}
                      {activeTab === 'activos' && (
                        <button
                          onClick={() => handleOpenPaymentModal(pedido)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Procesar Pago
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleOpenEditModal(pedido)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar Estado
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