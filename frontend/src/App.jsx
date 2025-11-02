import React from 'react';
// Importación las herramientas de React Router
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';

// --- Importación Componentes de Página ---
import Header from './pages/Header'; 
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage'; 
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import RewardsPage from './pages/RewardsPage';


/**
 * ============================================================
 * Componente MainLayout: La Plantilla Principal
 * ============================================================
 * Este componente define la estructura visual común para la mayoría
 * de las páginas: incluye el Header y un espacio (<Outlet>)
 * donde se cargará el contenido específico de cada página.
 */
function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50"> {/* Cambié a bg-gray-50 para un fondo más suave */}
      {/* 1. El Header SIEMPRE se muestra aquí */}
      <Header />

      {/* 2. El contenido de la página actual se carga aquí */}
      <main className="flex-grow container mx-auto px-4 py-8"> {/* flex-grow hace que el main ocupe el espacio restante */}
        <Outlet />
      </main>

      {/* (Opcional) Puedes añadir un Footer persistente aquí */}
      {/* <Footer /> */}
    </div>
  );
}

/**
 * ============================================================
 * Componente App: Define todas las Rutas de la Aplicación
 * ============================================================
 * Aquí se decide qué componente se muestra para cada URL y
 * cuáles de esas rutas usan el MainLayout (con el Header).
 */
function App() {
  // (Opcional pero Recomendado) Aquí podrías obtener el estado de autenticación
  // const { isAuthenticated } = useAuth(); // Ejemplo

  return (
    // Envuelve toda tu App en AuthProvider si usas Context
    // <AuthProvider> 
      <BrowserRouter>
        <Routes>
          {/* --- Rutas Públicas y Protegidas que usan el Header --- */}
          <Route path="/" element={<MainLayout />}>
            {/* Ruta Raíz (público) */}
            <Route index element={<HomePage />} /> 
            <Route path="producto/:id" element={<ProductDetailPage />} /> {/* Ejemplo de ruta con parámetro */}

            {/* Rutas de Cliente (requieren login) */}
            {/* Aquí necesitarías lógica para protegerlas si no está logueado */}
            <Route path="carrito" element={<CartPage />} />
            <Route path="pedidos" element={<OrdersPage />} />
            <Route path="recompensas" element={<RewardsPage />} />

            {/* Rutas de Administrador (requieren login y rol 'admin') */}
            {/* <Route path="admin/clientes" element={<AdminClientesPage />} /> */}
            {/* ... otras rutas de admin */}

            {/* Rutas de Cajero (requieren login y rol 'cajero') */}
            {/* <Route path="cajero/inicio" element={<CajeroInicioPage />} /> */}
            {/* ... otras rutas de cajero */}
            
             {/* Ruta para cualquier URL no encontrada dentro del Layout */}
            <Route path="*" element={<div>Página no encontrada</div>} />
          </Route>

          {/* --- Rutas que NO usan el Header (ej. Login) --- */}
          <Route path="/login" element={<LoginPage />} />

          {/* Puedes añadir una ruta 404 general aquí también */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </BrowserRouter>
    // </AuthProvider>
  );
}

export default App;