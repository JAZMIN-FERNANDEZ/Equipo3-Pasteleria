import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api';
import toast from 'react-hot-toast'; 

function CheckoutPage() {
  const navigate = useNavigate();
  // Usamos 'totalFinal' que viene del contexto (con descuentos aplicados)
  const { totalFinal, clearLocalCart } = useCart();
  const { user } = useAuth();
  
  const [metodoPago, setMetodoPago] = useState(null);
  const [montoPagoCon, setMontoPagoCon] = useState('');
  const [loading, setLoading] = useState(false);
  // Eliminamos el estado 'error' local

  const handleCheckout = async () => {
    // --- VALIDACIONES LOCALES (Usando Toast) ---
    if (!metodoPago) {
      toast.error("Por favor, selecciona un método de pago.");
      return;
    }

    // Validación específica para efectivo
    if (metodoPago === 'Efectivo') {
      const montoNum = parseFloat(montoPagoCon);
      const totalNum = parseFloat(totalFinal);

      if (!montoPagoCon || isNaN(montoNum)) {
        toast.error("Ingresa el monto con el que vas a pagar.");
        return;
      }

      // Tolerancia de centavos para evitar errores de punto flotante
      if (montoNum < totalNum - 0.01) {
        toast.error(`El monto ($${montoNum.toFixed(2)}) no cubre el total ($${totalNum.toFixed(2)}).`);
        return;
      }
    }

    setLoading(true);
    const esVentaEnTienda = user.rol === 'Cajero' || user.rol === 'Administrador';

    try {
      const payload = {
        metodoPago: metodoPago,
        // Convertimos a float o enviamos null si no es efectivo
        montoPagoCon: metodoPago === 'Efectivo' ? parseFloat(montoPagoCon) : null,
        total: totalFinal, 
        estado: esCajero ? 'Completado' : undefined 
      };

      // 1. Llamar al backend
      const response = await apiClient.post('/orders', payload);
      
      // Verificación de seguridad
      if (!response.data || !response.data.id_pedido) {
        throw new Error("La respuesta del servidor no contiene el ID del pedido.");
      }

      const orderId = response.data.id_pedido;

      // 2. Limpiar carrito localmente (para que se vea vacío al navegar)
      clearLocalCart();

      // 3. Feedback y Redirección
      if (esCajero) {
        toast.success(`¡Venta #${orderId} registrada correctamente!`);
        navigate('/admin/pedidos'); 
      } else {
        toast.success("¡Pedido realizado con éxito!");
        navigate(`/confirmation/${orderId}`);
      }

    } catch (err) {
      console.error("Error en checkout:", err);
      // Si el error vino del backend (Axios), el interceptor ya mostró el Toast.
      // Solo si es un error de lógica local (JS) mostramos uno genérico aquí.
      if (!err.response) {
        toast.error("Ocurrió un error inesperado al procesar la venta.");
      }
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

        {/* Botones de Acción */}
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