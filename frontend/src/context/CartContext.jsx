// src/context/CartContext.jsx

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
// 1. IMPORTA EL HOOK DE AUTENTICACIÓN
import { useAuth } from './AuthContext';

// 2. Crear el Contexto
const CartContext = createContext();

// 3. Crear el Proveedor (el componente que envuelve la app)
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  
  // 4. "ESCUCHA" AL CONTEXTO DE AUTENTICACIÓN
  const { user } = useAuth();

  // Función para AÑADIR un item al carrito
  const addToCart = (productToAdd) => {
    const newItem = { ...productToAdd, cartId: Date.now() };
    setCartItems(prevItems => [...prevItems, newItem]);
    alert('¡Producto añadido al carrito!');
  };

  // Función para QUITAR un item del carrito
  const removeFromCart = (cartId) => {
    setCartItems(prevItems => prevItems.filter(item => item.cartId !== cartId));
  };

  // Función para LIMPIAR el carrito
  const clearCart = () => {
    setCartItems([]);
  };

  // Calculamos el total
  const total = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cartItems]);


  // 5. ESTE ES EL ARREGLO
  // Este "efecto" se ejecuta cada vez que el 'user' cambia.
  useEffect(() => {
    // Si el 'user' se vuelve nulo (porque se cerró sesión),
    // limpiamos el carrito.
    if (!user) {
      clearCart();
    }
  }, [user]); // La dependencia [user] hace que se ejecute cuando 'user' cambia


  // 6. Pasamos los valores (incluyendo clearCart por si se necesita)
  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, total, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

// 7. Hook personalizado para usar el contexto fácilmente
export function useCart() {
  return useContext(CartContext);
}