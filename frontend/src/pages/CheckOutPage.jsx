import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // <-- 1. Importa useAuth
import apiClient from '../api';

function CheckoutPage() {
  const navigate = useNavigate();
  const { totalFinal, clearLocalCart } = useCart();
  const { user } = useAuth(); // <-- 2. Obtén el usuario
  
  const [metodoPago, setMetodoPago] = useState(null);
  const [montoPagoCon, setMontoPagoCon] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Función para finalizar el pedido ---
  const handleCheckout = async () => {
    // ... (tus validaciones de monto y método de pago) ...
    if (metodoPago === 'Efectivo' && parseFloat(montoPagoCon) < totalFinal) {
      setError(`El monto a pagar ($${montoPagoCon}) no puede ser menor al total ($${totalFinal.toFixed(2)}).`);
      return;
    }
    if (metodoPago === 'Efectivo' && parseFloat(montoPagoCon) < total) {
      setError(`El monto a pagar ($${montoPagoCon}) no puede ser menor al total ($${total.toFixed(2)}).`);
      return;
    }

    setLoading(true);
    setError(null);

    // --- 3. Lógica de Roles ---
    const esCajero = user.rol === 'Cajero';

    try {
      const payload = {
        metodoPago: metodoPago,
        montoPagoCon: metodoPago === 'Efectivo' ? montoPagoCon : null,
        total: totalFinal, // 🛠️ Envía el total FINAL (con descuento)
        estado: esCajero ? 'Completado' : undefined
      };

      // 1. Llamar al backend para crear el pedido
      const response = await apiClient.post('/orders', payload);
      const orderId = response.data.id_pedido;

      // 2. Limpiar el carrito en el frontend
      clearLocalCart();

      // 3. Redirigir según el rol
      if (esCajero) {
        // El cajero no necesita voucher, va a la lista de pedidos
        alert(`¡Venta en tienda #${orderId} completada!`);
        navigate('/gestion/pedidos'); // O a la página de "Caja"
      } else {
        // El cliente va a la página del voucher
        navigate(`/confirmation/${orderId}`);
      }

    } catch (err) {
      console.error("Error al finalizar el checkout:", err);
      setError(err.response?.data?.error || "No se pudo procesar el pedido.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
        {/* 4. Título dinámico */}
        <h1 className="text-2xl font-bold text-center mb-6">
          {user.rol === 'Cajero' ? 'Procesar Venta en Tienda' : 'Finalizar Pedido'}
        </h1>
        
        {/* ... (El resto del JSX: total, botones de pago, etc. no cambian) ... */}
        <div className="mb-4">
          <p className="text-lg text-gray-700">Total a Pagar:</p>
          {/* 🛠️ Muestra el 'totalFinal' */}
          <p className="text-4xl font-bold text-pink-500">${totalFinal.toFixed(2)}</p>
        </div>
        <div className="space-y-4 mb-6">
          <button onClick={() => setMetodoPago('Efectivo')} className={`w-full p-4 border rounded-lg text-lg font-medium transition ${metodoPago === 'Efectivo' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            💵 Efectivo {user.rol !== 'Cajero' && '(Pagar en tienda)'}
          </button>
          <button onClick={() => setMetodoPago('Tarjeta')} className={`w-full p-4 border rounded-lg text-lg font-medium transition ${metodoPago === 'Tarjeta' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            💳 Tarjeta {user.rol !== 'Cajero' && '(Pagar en tienda)'}
          </button>
          <button onClick={() => setMetodoPago('Transferencia')} className={`w-full p-4 border rounded-lg text-lg font-medium transition ${metodoPago === 'Transferencia' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            📲 Transferencia {user.rol !== 'Cajero' && '(Pagar en tienda)'}
          </button>
        </div>
        {metodoPago === 'Efectivo' && (
          <div className="mb-4">
            <label htmlFor="montoPagoCon" className="block text-sm font-medium text-gray-700">
              {user.rol === 'Cajero' ? 'Monto Recibido:' : '¿Con cuánto vas a pagar?'}
            </label>
            <input
              type="number"
              id="montoPagoCon"
              value={montoPagoCon}
              onChange={(e) => setMontoPagoCon(e.target.value)}
              placeholder="Ej: 500"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        )}
        {error && (<p className="text-red-500 text-sm mb-4">{error}</p>)}
        <button
          onClick={handleCheckout}
          disabled={loading || !metodoPago}
          className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-md transition duration-300 disabled:bg-gray-400"
        >
          {loading ? 'Procesando...' : (user.rol === 'Cajero' ? 'Completar Venta' : 'Finalizar Pedido y Generar Voucher')}
        </button>
        <button onClick={() => navigate('/cart')} className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md mt-2">
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default CheckoutPage;