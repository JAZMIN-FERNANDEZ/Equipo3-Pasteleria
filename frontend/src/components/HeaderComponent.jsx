import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HeaderComponent = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    if (!user) return [];

    const menuItems = [
      { label: 'Inicio', path: '/', roles: ['cliente', 'admin', 'empleado', 'Administrador', 'Cliente', 'Cajero'] },
      { label: 'Clientes', path: '/admin/clientes', roles: ['admin', 'Administrador'] },
      { label: 'Cajeros', path: '/admin/cajeros', roles: ['admin', 'Administrador'] },
      { label: 'Proveedores', path: '/admin/proveedores', roles: ['admin', 'Administrador'] },
      { label: 'Carrito', path: '/cart', roles: ['empleado','cliente', 'Cliente', 'Cajero'] },
      { label: 'Inventario', path: '/admin/inventario', roles: ['empleado', 'admin', 'Administrador', 'Cajero'] },
      { label: 'Mis Pedidos', path: '/mis-pedidos', roles: ['cliente', 'Cliente'] },
      { label: 'Recompensas', path: '/admin/recompensas', roles: ['admin', 'Administrador'] },
      { label: 'Estadísticas', path: '/admin/dashboard', roles: ['admin', 'Administrador'] },
      { label: 'Pedidos', path: '/gestion/pedidos', roles: ['empleado', 'admin', 'Administrador', 'Cajero'] },
      { label: 'Cierre de Caja', path: '/cierre', roles: ['empleado', 'admin', 'Administrador', 'Cajero'] },
    ];

    return menuItems.filter(item => item.roles.includes(user.rol));
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">
          DulceSys
        </Link>
        
        <div className="flex items-center space-x-6">
          {user ? (
            <>
              <div className="flex items-center space-x-4">
                {getMenuItems().map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className="text-gray-700 hover:text-blue-500 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="flex items-center space-x-4 ml-6">
                <span className="text-gray-600">
                  Hola, {user.rol}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </>
          ) : (
            <div className="flex space-x-4">
              <Link 
                to="/login"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
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