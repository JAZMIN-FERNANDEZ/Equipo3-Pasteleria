// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CartProvider } from './context/CartContext'; // <-- 1. IMPORTA EL PROVIDER
import './index.css';

import { AuthProvider } from './context/AuthContext';

// Importación de layouts y páginas
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './layouts/ProtectedRoute'; 
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import StadisticPage from './pages/StadisticPage';
import RewardsPage from './pages/RewardsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrderPage from './pages/OrdersPage';




const router = createBrowserRouter([
  // --- Rutas públicas (sin Header) ---
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },

  // --- Rutas privadas (CON el Header) ---
  {
    path: "/",
    element: <MainLayout />, // El layout principal sigue aquí
    children: [
      // --- Ruta de Inicio (para todos los logueados) ---
      {
        path: "/", 
        element: <HomePage />,
      },
      {
        path: "product/:id", // <-- ¡CORREGIDO! Mueve la ruta aquí
        element: <ProductDetailPage />,
      },
      {
        path: "cart",
        element: <CartPage />,
      },

      // --- Rutas de Cliente ---
      {
        element: <ProtectedRoute allowedRole="Cliente" />, 
        children: [
           { path: "mis-pedidos", element: <OrderPage /> },
           { path: "product/:id", element: <ProductDetailPage /> },
        ]
      },

      // --- Rutas de Administrador ---
      {
        element: <ProtectedRoute allowedRole="Administrador" />, // <-- 3. GUARDIÁN DE ADMIN
        children: [
          // { path: "admin/dashboard", element: <DashboardPage /> },
          // { path: "admin/inventario", element: <InventarioPage /> }
        ]
      },
      
      // --- Rutas de Cajero ---
      {
        element: <ProtectedRoute allowedRole="Cajero" />, // <-- 4. GUARDIÁN DE CAJERO
        children: [
           { path: "cart", element: <CartPage /> },
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider> {}
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>,
)