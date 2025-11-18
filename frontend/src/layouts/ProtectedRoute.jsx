import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();

  // 1. Revisa si el usuario está logueado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Revisa si el rol del usuario está INCLUIDO en el array
  if (!allowedRoles.includes(user.rol)) {
    // Si no tiene el rol, lo manda al inicio
    return <Navigate to="/" replace />;
  }

  // 3. Si está logueado Y tiene el rol, muestra la página
  return <Outlet />;
}

export default ProtectedRoute;