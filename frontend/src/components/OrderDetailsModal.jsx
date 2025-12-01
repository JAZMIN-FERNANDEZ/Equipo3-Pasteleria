import React from 'react';

function OrderDetailsModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  // Cálculos para mostrar
  const totalPagado = parseFloat(order.total);
  const descuentoAplicado = parseFloat(order.descuento || 0);
  const subtotalReal = totalPagado + descuentoAplicado;

  const renderPersonalizacion = (personalizacion) => {
    if (!personalizacion || Object.keys(personalizacion).length === 0) return <span className="text-gray-400">-</span>;
    return (
      <ul className="text-xs text-gray-600 list-disc list-inside">
        {Object.entries(personalizacion).map(([clave, valor]) => (
          <li key={clave}><span className="font-semibold">{clave}:</span> {valor}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl my-8 relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>

        {/* Encabezado */}
        <div className="border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Detalles del Pedido #{order.id_pedido}</h2>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div><p className="text-gray-500">Cliente:</p><p className="font-semibold text-lg">{order.cliente}</p></div>
            <div><p className="text-gray-500">Fecha:</p><p className="font-semibold">{order.fecha} - {order.hora}</p></div>
            <div><p className="text-gray-500">Pago:</p><p className="font-semibold">{order.metodo_pago}</p></div>
            <div>
              <p className="text-gray-500">Estado:</p>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                 order.estado === 'Completado' ? 'bg-green-100 text-green-800' : 
                 'bg-yellow-100 text-yellow-800'
              }`}>{order.estado}</span>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Producto</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Detalles</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Cant.</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">P. Unit</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.nombre}</td>
                  <td className="px-4 py-3">{renderPersonalizacion(item.personalizacion)}</td>
                  <td className="px-4 py-3 text-sm text-center">{item.cantidad}</td>
                  <td className="px-4 py-3 text-sm text-right">${parseFloat(item.precioUnitario).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">${parseFloat(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- 🛠️ SECCIÓN DE TOTALES CON DESCUENTO --- */}
        <div className="flex justify-end border-t pt-4">
          <div className="w-1/2 md:w-1/3 space-y-1">
            
            {/* Subtotal Real (Antes de descuentos) */}
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>${subtotalReal.toFixed(2)}</span>
            </div>

            {/* Descuento (Solo si existe) */}
            {descuentoAplicado > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Descuento:</span>
                <span>-${descuentoAplicado.toFixed(2)}</span>
              </div>
            )}

            {/* Total Final (El que se cobró) */}
            <div className="flex justify-between items-center border-t pt-2 mt-2">
              <span className="text-xl font-bold text-gray-800">Total Cobrado:</span>
              <span className="text-2xl font-bold text-pink-600">${totalPagado.toFixed(2)}</span>
            </div>

            {/* Cambio (Si aplica) */}
            {order.metodo_pago === 'Efectivo' && order.monto_pago_con && (
              <div className="mt-4 pt-2 border-t border-dashed text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Pagó con:</span>
                  <span>${parseFloat(order.monto_pago_con).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-700">
                  <span>Cambio:</span>
                  <span>${(parseFloat(order.monto_pago_con) - totalPagado).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-700 transition">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}

export default OrderDetailsModal;