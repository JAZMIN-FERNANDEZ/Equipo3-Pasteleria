import React, { useState } from 'react';
import apiClient from '../api';

function PaymentModal({ isOpen, onClose, order, onPaymentSuccess }) {
  const [step, setStep] = useState('selectMethod'); // 'selectMethod', 'card', 'cash', 'transfer'
  const [loading, setLoading] = useState(false);
  
  // Para el pago en efectivo
  const [montoRecibido, setMontoRecibido] = useState(order?.monto_pago_con || '');
  
  // Para la transferencia
  const [referencia, setReferencia] = useState('');

  // Resetea el modal cuando se cierra
  const handleClose = () => {
    setStep('selectMethod');
    setLoading(false);
    onClose();
  };

  // --- Función Final de Cobro ---
  const handleFinalizePayment = async () => {
    setLoading(true);
    try {
      // 1. Llama a la API para marcar el pedido como "Completado"
      await apiClient.put(`/admin/orders/${order.id_pedido}/status`, { 
        estado: 'Completado'
      });

      // 2. Avisa a la página de pedidos que todo salió bien
      onPaymentSuccess();
      handleClose();

    } catch (error) {
      console.error("Error al finalizar el pago:", error);
      alert("Error al actualizar el pedido.");
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  // --- Vistas del Modal ---

  const renderSelectMethod = () => (
    <>
      <h2 className="text-xl font-bold mb-4">Procesar Pago (Pedido #{order.id_pedido})</h2>
      <p className="text-lg mb-2">Cliente: <span className="font-semibold">{order.cliente}</span></p>
      <p className="text-2xl font-bold text-pink-500 mb-6">Total: ${parseFloat(order.total).toFixed(2)}</p>
      
      <p className="text-sm text-gray-600 mb-2">Método de pago solicitado por el cliente:</p>
      <p className="text-xl font-semibold text-blue-600 mb-6">{order.metodo_pago}</p>

      <div className="space-y-3">
        <button onClick={() => setStep('cash')} className="w-full p-4 bg-gray-100 rounded-lg text-lg font-medium hover:bg-gray-200">💵 Efectivo</button>
        <button onClick={() => setStep('card')} className="w-full p-4 bg-gray-100 rounded-lg text-lg font-medium hover:bg-gray-200">💳 Tarjeta</button>
        <button onClick={() => setStep('transfer')} className="w-full p-4 bg-gray-100 rounded-lg text-lg font-medium hover:bg-gray-200">📲 Transferencia</button>
      </div>
    </>
  );

  const renderCashPayment = () => {
    const cambio = parseFloat(montoRecibido || 0) - parseFloat(order.total);
    return (
      <>
        <h2 className="text-xl font-bold mb-4">Pago con Efectivo</h2>
        <p className="text-2xl font-bold mb-4">Total: ${parseFloat(order.total).toFixed(2)}</p>
        
        <div className="mb-4">
          <label htmlFor="montoRecibido" className="block text-sm font-medium text-gray-700">Monto Recibido</label>
          <input
            type="number"
            id="montoRecibido"
            value={montoRecibido}
            onChange={(e) => setMontoRecibido(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Ej: 500"
          />
        </div>
        
        <div className="mb-6">
          <p className="text-lg">Cambio:</p>
          <p className={`text-3xl font-bold ${cambio < 0 ? 'text-red-500' : 'text-green-500'}`}>
            ${cambio.toFixed(2)}
          </p>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setStep('selectMethod')} className="w-1/2 bg-gray-200 text-gray-800 p-3 rounded-md hover:bg-gray-300">Volver</button>
          <button 
            onClick={handleFinalizePayment}
            disabled={loading || cambio < 0}
            className="w-1/2 bg-green-500 text-white p-3 rounded-md hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? 'Cobrando...' : 'Cobrar'}
          </button>
        </div>
      </>
    );
  };
  
  const renderCardPayment = () => (
    <>
      <h2 className="text-xl font-bold mb-4">Pago con Tarjeta</h2>
      <p className="text-lg mb-6">Por favor, utilice la terminal bancaria para procesar el pago de ${parseFloat(order.total).toFixed(2)}.</p>
      <div className="flex gap-4">
        <button onClick={() => setStep('selectMethod')} className="w-1/2 bg-gray-200 text-gray-800 p-3 rounded-md hover:bg-gray-300">Volver</button>
        <button 
          onClick={handleFinalizePayment}
          disabled={loading}
          className="w-1/2 bg-green-500 text-white p-3 rounded-md hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? 'Procesando...' : 'Confirmar Pago'}
        </button>
      </div>
    </>
  );
  
  const renderTransferPayment = () => (
    <>
      <h2 className="text-xl font-bold mb-4">Pago con Transferencia</h2>
      <p className="text-lg mb-4">Total: ${parseFloat(order.total).toFixed(2)}</p>
      <p className="text-sm mb-4 text-gray-600">Confirme la recepción de la transferencia y anote el número de referencia.</p>
      
      <div className="mb-4">
        <label htmlFor="referencia" className="block text-sm font-medium text-gray-700">Referencia de Transferencia</label>
        <input
          type="text"
          id="referencia"
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Ej: 901234"
        />
      </div>

      <div className="flex gap-4">
        <button onClick={() => setStep('selectMethod')} className="w-1/2 bg-gray-200 text-gray-800 p-3 rounded-md hover:bg-gray-300">Volver</button>
        <button 
          onClick={handleFinalizePayment}
          disabled={loading || !referencia}
          className="w-1/2 bg-green-500 text-white p-3 rounded-md hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? 'Procesando...' : 'Confirmar Pago'}
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">&times;</button>
        
        {step === 'selectMethod' && renderSelectMethod()}
        {step === 'cash' && renderCashPayment()}
        {step === 'card' && renderCardPayment()}
        {step === 'transfer' && renderTransferPayment()}

      </div>
    </div>
  );
}

export default PaymentModal;