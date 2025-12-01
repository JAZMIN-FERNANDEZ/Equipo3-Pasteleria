import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '../api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); 

  // --- 🛠️ NUEVOS ESTADOS ---
  const [recompensa, setRecompensa] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [totalFinal, setTotalFinal] = useState(0);


  const fetchCart = useCallback(async () => {
    if (!user) return; 
    setLoading(true);
    try {
      const response = await apiClient.get('/cart');
      
      // 🛠️ ACTUALIZADO: Guarda todos los datos de la API
      setCartItems(response.data.items);
      setRecompensa(response.data.recompensa);
      setSubtotal(response.data.subtotal);
      setDescuento(response.data.descuento);
      setTotalFinal(response.data.totalFinal);

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
      // 🛠️ Limpia todo al cerrar sesión
      setCartItems([]);
      setRecompensa(null);
      setSubtotal(0);
      setDescuento(0);
      setTotalFinal(0);
    }
  }, [user, fetchCart]);

  const addToCart = async (productToAdd) => {
    try {
      await apiClient.post('/cart', productToAdd);
      await fetchCart(); // Recarga todo (incluyendo descuentos)
    } catch (error) {
      console.error("Error al añadir al carrito:", error);
      throw error;
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await apiClient.delete(`/cart/${cartItemId}`);
      await fetchCart(); // Recarga todo (incluyendo descuentos)
    } catch (error) {
      console.error("Error al borrar del carrito:", error);
    }
  };

  const updateItemQuantity = async (cartItemId, newQuantity) => {
    try {
      await apiClient.put(`/cart/${cartItemId}`, { cantidad: newQuantity });
      await fetchCart(); // Recarga todo para recalcular subtotales/descuentos
    } catch (error) {
      // El interceptor mostrará el error (ej. "Stock insuficiente")
      console.error("Error al actualizar cantidad:", error);
    }
  };

  const clearCartAPI = async () => {
    try {
      await apiClient.delete('/cart'); // Borra todo en la BD
      await fetchCart(); // El estado local se limpiará al recargar
    } catch (error) {
      console.error("Error al vaciar carrito:", error);
    }
  };

  // Función para limpiar localmente
  const clearLocalCart = () => {
    setCartItems([]);
    setRecompensa(null);
    setSubtotal(0);
    setDescuento(0);
    setTotalFinal(0);
  };

return (
    <CartContext.Provider value={{ 
      cartItems, addToCart, removeFromCart, 
      updateItemQuantity, clearCartAPI, 
      loading, clearLocalCart, 
      recompensa, subtotal, descuento, totalFinal 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}