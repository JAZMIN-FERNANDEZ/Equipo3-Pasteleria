import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useCart } from '../context/CartContext';

function CartPage() {
  const { cartItems, removeFromCart, recompensa, subtotal, descuento, totalFinal } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <main className="container mx-auto mt-10 p-4 text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Tu Carrito de Compras está Vacío</h1>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <main className="container mx-auto mt-10 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Tu Carrito de Compras</h1>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {}
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <tr key={item.cartId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${item.subtotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        className="text-red-600 hover:text-red-800 font-medium transition duration-300"
                        onClick={() => removeFromCart(item.cartId)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-end mt-8">
            {/* Subtotal */}
            <div className="w-1/3 text-right mb-2">
              <span className="text-lg text-gray-600 mr-4">Subtotal:</span>
              <span className="text-lg font-medium text-gray-800">${subtotal.toFixed(2)}</span>
            </div>
            
            {/* Muestra la recompensa si existe */}
            {recompensa && (
              <div className="w-1/3 text-right mb-2">
                <span className="text-lg text-green-600 mr-4">{recompensa.nombrerecompensa}:</span>
                <span className="text-lg font-medium text-green-600">-${descuento.toFixed(2)}</span>
              </div>
            )}

            {/* Total Final */}
            <div className="w-1/3 text-right mt-2 border-t pt-2">
              <span className="text-xl font-bold text-gray-800 mr-4">Total:</span>
              <span className="text-xl font-bold text-gray-900">${totalFinal.toFixed(2)}</span>
            </div>

            <button
              className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-md transition duration-300"
              onClick={() => navigate('/checkout')}
            >
              Comprar Carrito
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CartPage;