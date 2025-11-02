// src/pages/CartPage.jsx
import React from 'react';
import { useCart } from '../context/CartContext'; // <-- 1. IMPORTA EL HOOK

function CartPage() {
  // 2. OBTÉN LOS DATOS DEL CONTEXTO
  const { cartItems, removeFromCart, total } = useCart();

  // 3. (OPCIONAL) MANEJA EL CARRITO VACÍO
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

  // 4. RENDERIZA EL CARRITO REAL
  return (
    <div className="bg-gray-100 min-h-screen">
      <main className="container mx-auto mt-10 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Tu Carrito de Compras</h1>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {/* ... (tus encabezados de tabla no cambian) ... */}
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {/* 5. USA LOS DATOS DEL CONTEXTO */}
                {cartItems.map((item) => (
                  <tr key={item.cartId}> {/* 6. Usa el cartId único como key */}
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
                        onClick={() => removeFromCart(item.cartId)} // 7. Asigna la función
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end items-center mt-8">
            <span className="text-xl font-bold text-gray-800 mr-4">
              Total: ${total.toFixed(2)} {/* 8. Usa el total del contexto */}
            </span>
            <button
              className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-md transition duration-300"
              onClick={() => alert('Proceder al pago')}
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