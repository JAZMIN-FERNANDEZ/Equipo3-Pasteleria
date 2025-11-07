import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '../api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); 

  const fetchCart = useCallback(async () => {
    // ... (esta función no cambia)
    if (!user) return; 
    setLoading(true);
    try {
      const response = await apiClient.get('/cart');
      const formattedItems = response.data.map(item => ({
        cartId: item.id_item_carrito,
        productId: item.id_producto,
        // OJO: Corregí un bug aquí, Prisma devuelve 'productos' (plural) no 'producto'
        name: `${item.productos.nombre} (${Object.values(item.personalizacion).join(', ')})`,
        quantity: item.cantidad,
        price: parseFloat(item.productos.preciobase),
        subtotal: parseFloat(item.productos.preciobase) * item.cantidad,
      }));
      setCartItems(formattedItems);
    } catch (error) {
      console.error("Error al cargar el carrito:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]); 
    }
  }, [user, fetchCart]);

  // ========= 🛠️ MODIFICACIÓN AQUÍ =========
  const addToCart = async (productToAdd) => {
    try {
      // 1. Hacemos que la función sea 'async' y 'await' la llamada
      await apiClient.post('/cart', productToAdd);
      
      // 2. Refrescamos el carrito *antes* de terminar la función
      await fetchCart(); 
    } catch (error) {
      console.error("Error al añadir al carrito:", error);
      // 3. (Opcional) Lanza el error para que handleSubmit lo atrape
      throw error; 
    }
  };
  // ======================================

  const removeFromCart = async (cartItemId) => {
    // ... (esta función no cambia)
    try {
      await apiClient.delete(`/cart/${cartItemId}`);
      await fetchCart();
    } catch (error) {
      console.error("Error al borrar del carrito:", error);
    }
  };

  const total = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, total, loading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}