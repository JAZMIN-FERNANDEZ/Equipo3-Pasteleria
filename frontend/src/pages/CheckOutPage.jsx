import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api';

function CheckoutPage() {
  const navigate = useNavigate();
  // 1. Usamos 'totalFinal' que ya incluye descuentos
  const { totalFinal, clearLocalCart } = useCart();
  const { user } = useAuth();
  
  const [metodoPago, setMetodoPago] = useState(null);
  const [montoPagoCon, setMontoPagoCon] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    console.log("Iniciando checkout..."); // Debug

    // --- VALIDACIONES ---
    if (!metodoPago) {
      setError("Por favor, selecciona un método de pago.");
      return;
    }

    // Validación específica para efectivo
    if (metodoPago === 'Efectivo') {
      const montoNum = parseFloat(montoPagoCon);
      const totalNum = parseFloat(totalFinal);

      if (!montoPagoCon || isNaN(montoNum)) {
        setError("Por favor, ingresa el monto con el que vas a pagar.");
        return;
      }

      // Usamos una pequeña tolerancia para evitar errores de decimales flotantes
      if (montoNum < totalNum - 0.01) {
        setError(`El monto a pagar ($${montoNum.toFixed(2)}) es menor al total ($${totalNum.toFixed(2)}).`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const esCajero = user.rol === 'Cajero';

    try {
      const payload = {
        metodoPago: metodoPago,
        // Convertimos a float o enviamos null
        montoPagoCon: metodoPago === 'Efectivo' ? parseFloat(montoPagoCon) : null,
        total: totalFinal, 
        estado: esCajero ? 'Completado' : undefined 
      };

      console.log("Enviando payload:", payload); // Debug

      // 1. Llamar al backend
      const response = await apiClient.post('/orders', payload);
      const orderId = response.data.id_pedido;

      console.log("Pedido creado:", orderId); // Debug

      // 2. Limpiar carrito
      clearLocalCart();

      // 3. Redirección
      if (esCajero) {
        alert(`¡Venta en tienda #${orderId} completada con éxito!`);
        navigate('/gestion/pedidos'); 
      } else {
        navigate(`/confirmation/${orderId}`);
      }

    } catch (err) {
      console.error("Error al finalizar el checkout:", err);
      setError(err.response?.data?.error || "No se pudo procesar el pedido.");
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para formato de moneda
  const formatCurrency = (val) => `$${parseFloat(val || 0).toFixed(2)}`;

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          {user.rol === 'Cajero' ? 'Procesar Venta en Tienda' : 'Finalizar Pedido'}
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
              onClick={() => {
                setMetodoPago(metodo);
                setError(null); // Limpiar error al cambiar método
              }}
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
              {user.rol === 'Cajero' ? 'Monto Recibido ($):' : '¿Con cuánto vas a pagar? ($)'}
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

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <button
            onClick={handleCheckout}
            disabled={loading || !metodoPago}
            className="w-full bg-green-500 text-white font-bold py-4 px-6 rounded-lg transition duration-300 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Procesando...' : (user.rol === 'Cajero' ? 'Completar Venta' : 'Finalizar Pedido')}
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