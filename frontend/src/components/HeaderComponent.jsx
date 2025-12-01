import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const HeaderComponent = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { cartItems } = useCart();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calculamos la cantidad total de productos para la bolita roja (badge)
  const totalItems = cartItems ? cartItems.reduce((acc, item) => acc + item.quantity, 0) : 0;
  
  const getMenuItems = () => {
    if (!user) return [];

    const menuItems = [
      { label: 'Inicio', path: '/', roles: ['cliente', 'admin', 'empleado', 'Administrador', 'Cliente', 'Cajero'] },
      // 🛠️ NOTA: Eliminé 'Carrito' de aquí para ponerlo como ícono
      { label: 'Clientes', path: '/admin/clientes', roles: ['admin', 'Administrador'] },
      { label: 'Cajeros', path: '/admin/cajeros', roles: ['admin', 'Administrador'] },
      { label: 'Proveedores', path: '/admin/proveedores', roles: ['admin', 'Administrador'] },
      { label: 'Inventario', path: '/admin/inventario', roles: ['empleado', 'admin', 'Administrador', 'Cajero'] },
      { label: 'Pedidos', path: '/gestion/pedidos', roles: ['empleado', 'admin', 'Administrador', 'Cajero'] }, // Corregí la ruta a /admin/pedidos
      { label: 'Cierre de Caja', path: '/cierre', roles: ['empleado', 'admin', 'Administrador', 'Cajero'] }, // Corregí la ruta a /admin/corte-caja
      { label: 'Recompensas', path: '/admin/recompensas', roles: ['admin', 'Administrador'] },
      { label: 'Estadísticas', path: '/admin/dashboard', roles: ['admin', 'Administrador'] },
      { label: 'Mis Pedidos', path: '/mis-pedidos', roles: ['cliente', 'Cliente'] },
    ];

    return menuItems.filter(item => item.roles.includes(user.rol));
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-pink-600 flex items-center gap-2">
           🍰 DulceSys
        </Link>
        
        <div className="flex items-center space-x-6">
          {user ? (
            <>
              {/* Enlaces de Texto (Menú Principal) */}
              <div className="hidden md:flex items-center space-x-6">
                {getMenuItems().map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className="text-gray-700 hover:text-pink-500 font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center space-x-4 ml-4 border-l pl-4 border-gray-200">
                
                {/* 🛒 ÍCONO DEL CARRITO (Nuevo) */}
                {/* Visible para todos los roles logueados */}
                <Link to="/cart" className="relative group mr-2" title="Ver Carrito">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-7 w-7 text-gray-600 group-hover:text-pink-500 transition-colors" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  
                  {/* Badge (Bolita Roja con número) */}
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                      {totalItems}
                    </span>
                  )}
                </Link>

                {/* Info Usuario y Logout */}
                <div className="hidden md:flex flex-col items-end mr-2">
                   <span className="text-sm font-bold text-gray-800 leading-tight">Hola, Usuario</span>
                   <span className="text-xs text-gray-500 uppercase leading-tight">{user.rol}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                  title="Cerrar Sesión"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex space-x-4">
              <Link 
                to="/login"
                className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors shadow-sm"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default HeaderComponent;