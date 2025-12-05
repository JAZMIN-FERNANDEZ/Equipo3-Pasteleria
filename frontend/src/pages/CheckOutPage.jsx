import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api';
import toast from 'react-hot-toast'; 

function CheckoutPage() {
  const navigate = useNavigate();
  const { totalFinal, clearLocalCart } = useCart();
  const { user } = useAuth();
  
  const [metodoPago, setMetodoPago] = useState(null);
  const [montoPagoCon, setMontoPagoCon] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    // --- VALIDACIONES ---
    if (!metodoPago) {
      toast.error("Por favor, selecciona un método de pago.");
      return;
    }

    if (metodoPago === 'Efectivo') {
      const montoNum = parseFloat(montoPagoCon);
      const totalNum = parseFloat(totalFinal);

      if (!montoPagoCon || isNaN(montoNum)) {
        toast.error("Por favor, ingresa el monto con el que vas a pagar.");
        return;
      }

      if (montoNum < totalNum - 0.01) {
        toast.error(`El monto a pagar ($${montoNum.toFixed(2)}) es menor al total ($${totalNum.toFixed(2)}).`);
        return;
      }
    }

    setLoading(true);
    const esCajero = user.rol === 'Cajero' || user.rol === 'Administrador';

    try {
      const payload = {
        metodoPago: metodoPago,
        montoPagoCon: metodoPago === 'Efectivo' ? parseFloat(montoPagoCon) : null,
        total: totalFinal, 
        estado: esCajero ? 'Completado' : undefined 
      };

      // 1. Llamar al backend
      const response = await apiClient.post('/orders', payload);
      
      // Verificación de seguridad
      if (!response.data || !response.data.id_pedido) {
        throw new Error("La respuesta del servidor no es válida.");
      }

      const orderId = response.data.id_pedido;

      // 2. Limpiar carrito
      clearLocalCart();

      // 3. Redirección y Mensaje de Éxito
      if (esCajero) {
        // 🛠️ Ahora sí funcionará porque importamos 'toast'
        toast.success(`¡Venta en tienda #${orderId} completada con éxito!`);
        navigate('/gestion/pedidos'); 
      } else {
        toast.success("¡Pedido realizado con éxito!");
        navigate(`/confirmation/${orderId}`);
      }

    } catch (err) {
      console.error("Error al finalizar el checkout:", err);
      // Si es un error de JS local (como el que tenías), mostramos esto:
      if (!err.response) {
        toast.error("Ocurrió un error inesperado en la aplicación.");
      }
      // Si es error del servidor, el interceptor de Axios ya mostró el toast.
    } finally {
      setLoading(false);
    }
  };

  // ... (El resto de tu componente y JSX se mantiene igual)
  // Función auxiliar para formato de moneda
  const formatCurrency = (val) => `$${parseFloat(val || 0).toFixed(2)}`;

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          {user.rol === 'Cajero' || user.rol === 'Administrador' ? 'Procesar Venta en Tienda' : 'Finalizar Pedido'}
        </h1>
        
        <div className="mb-4 text-center bg-gray-50 p-4 rounded-lg">
          <p className="text-lg text-gray-700">Total a Pagar:</p>
          <p className="text-4xl font-bold text-pink-500">{formatCurrency(totalFinal)}</p>
        </div>

        {/* Selección de Método */}
        <div className="space-y-3 mb-6">
          {['Efectivo', 'Tarjeta', 'Transferencia'].map((metodo) => (
            <button
              key={metodo}
              onClick={() => setMetodoPago(metodo)}
              className={`w-full p-4 border rounded-lg text-lg font-medium transition flex justify-between items-center ${
                metodoPago === metodo 
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span>
                {metodo === 'Efectivo' && '💵'} 
                {metodo === 'Tarjeta' && '💳'} 
                {metodo === 'Transferencia' && '📲'} 
                {' ' + metodo}
              </span>
              {metodoPago === metodo && <span>✓</span>}
            </button>
          ))}
        </div>

        {/* Campo para Efectivo */}
        {metodoPago === 'Efectivo' && (
          <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-100">
            <label htmlFor="montoPagoCon" className="block text-sm font-bold text-gray-700 mb-2">
              {user.rol === 'Cajero' || user.rol === 'Administrador' ? 'Monto Recibido ($):' : '¿Con cuánto vas a pagar? ($)'}
            </label>
            <input
              type="number"
              id="montoPagoCon"
              value={montoPagoCon}
              onChange={(e) => setMontoPagoCon(e.target.value)}
              placeholder="Ej: 500.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
            {/* Calculadora de Cambio Visual */}
            {montoPagoCon && parseFloat(montoPagoCon) >= totalFinal && (
              <p className="mt-2 text-green-600 font-medium text-right">
                Cambio: {formatCurrency(parseFloat(montoPagoCon) - totalFinal)}
              </p>
            )}
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <button
            onClick={handleCheckout}
            disabled={loading || !metodoPago}
            className="w-full bg-green-500 text-white font-bold py-4 px-6 rounded-lg transition duration-300 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Procesando...' : (user.rol === 'Cajero' || user.rol === 'Administrador' ? 'Completar Venta' : 'Finalizar Pedido')}
          </button>
          
          <button
            onClick={() => navigate('/cart')}
            className="w-full bg-transparent text-gray-500 font-medium py-2 px-4 rounded-md hover:text-gray-700 hover:underline"
          >
            Volver al Carrito
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;