import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

function CartPage() {
  const { 
    cartItems, removeFromCart, updateItemQuantity, clearCartAPI, // <-- Nuevas funciones
    recompensa, subtotal, descuento, totalFinal 
  } = useCart();
  
  const navigate = useNavigate();

  // Función auxiliar de moneda
  const formatCurrency = (val) => `$${parseFloat(val || 0).toFixed(2)}`;

  const handleQuantityChange = (item, change) => {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return; // No bajar de 1
    updateItemQuantity(item.cartId, newQuantity);
  };

  const handleClearCart = async () => {
    if (window.confirm("¿Estás seguro de que quieres vaciar todo el carrito?")) {
      await clearCartAPI();
      toast.success("Carrito vaciado.");
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Tu Carrito está Vacío 🛒</h1>
          <button onClick={() => navigate('/')} className="text-pink-500 font-bold hover:underline">
            Volver al Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <main className="container mx-auto mt-4 max-w-5xl">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Carrito de Compras</h1>
            {/* Botón Vaciar Carrito */}
            <button 
              onClick={handleClearCart}
              className="text-red-500 hover:text-red-700 text-sm font-semibold border border-red-200 px-3 py-1 rounded hover:bg-red-50"
            >
              Vaciar Carrito
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unitario</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <tr key={item.cartId}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {/* Mostrar stock disponible si es bajo (opcional) */}
                      {item.stockMaximo < 5 && <div className="text-xs text-orange-500">¡Pocas unidades!</div>}
                    </td>
                    
                    {/* 🛠️ NUEVOS CONTROLES DE CANTIDAD */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => handleQuantityChange(item, -1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => handleQuantityChange(item, 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(item.subtotal)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        className="text-red-600 hover:text-red-800 font-medium transition duration-300"
                        onClick={() => removeFromCart(item.cartId)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-end mt-8 pt-4 border-t border-gray-200">
            <div className="w-full md:w-1/3 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {recompensa && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>{recompensa.nombrerecompensa}:</span>
                  <span>-{formatCurrency(descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold text-gray-900 pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(totalFinal)}</span>
              </div>
            </div>

            <button
              className="mt-6 w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition duration-300"
              onClick={() => navigate('/checkout')}
            >
              Proceder al Pago
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CartPage;