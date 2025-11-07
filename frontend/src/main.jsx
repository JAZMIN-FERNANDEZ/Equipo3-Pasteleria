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
import ProductDetailPage from './pages/ProductDetailPage';
import OrderPage from './pages/MisPedidosPage';
import InventoryAdminPage from './pages/InventoryAdminPage';
import GestionPedidosPage from './pages/GestionPedidosPage';
import GestionProveedoresPage from './pages/GestionProveedoresPage';
import GestionCajerosPage from './pages/GestionCajerosPage';
import GestionRecompensasPage from './pages/GestionRecompensasPage';


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
        path: "product/:id", 
        element: <ProductDetailPage />,
      },
      {
        path: "cart",
        element: <CartPage />,
      },

      // --- Rutas de Cliente ---
      {
        element: <ProtectedRoute allowedRoles="Cliente" />, 
        children: [
           { path: "mis-pedidos", element: <OrderPage /> },
           { path: "product/:id", element: <ProductDetailPage /> },
        ]
      },

      // --- Rutas de Administrador ---
      {
        element: <ProtectedRoute allowedRoles="Administrador" />, // <-- 3. GUARDIÁN DE ADMIN
        children: [
          // { path: "admin/dashboard", element: <DashboardPage /> },
          { path: "admin/inventario", element: <InventoryAdminPage /> },
          { path: "admin/proveedores", element: <GestionProveedoresPage /> },
          { path: "admin/cajeros", element: <GestionCajerosPage /> },
          { path: "admin/recompensas", element: <GestionRecompensasPage /> },
          { path: "admin/dashboard", element: <StadisticPage /> }
        ]
      },
      
            // --- Rutas Compartidas de Personal (Administrador y Cajero) ---
      {
        element: <ProtectedRoute allowedRoles={['Administrador', 'Cajero']} />,
        children: [
          { 
            path: "/gestion/pedidos", 
            element: <GestionPedidosPage /> 
          }
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