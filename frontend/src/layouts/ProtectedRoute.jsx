import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Este componente "guardián" recibe el rol que SÍ tiene permiso
function ProtectedRoute({ allowedRole }) {
  const { user } = useAuth();

  //Revisa si el usuario está logueado
  if (!user) {
    // Si no está logueado, lo manda al login
    return <Navigate to="/login" replace />;
  }
  // Revisa si el rol del usuario es el permitido
  if (user.rol !== allowedRole) {
    // Si está logueado pero NO tiene el rol, lo manda a la página de inicio
    return <Navigate to="/" replace />;
  }
  // 3. Si está logueado Y tiene el rol correcto, muestra la página
  return <Outlet />;
}

export default ProtectedRoute;