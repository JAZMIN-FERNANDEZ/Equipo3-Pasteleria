import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// 1. Creamos el contexto
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Revisa si ya existe un token en localStorage cuando la app se carga
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        // Aquí asumimos que el payload de tu JWT tiene 'id' y 'rol'
        setUser({ id: decodedUser.id, rol: decodedUser.rol });
      } catch (e) {
        console.error("Token inválido", e);
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Función para iniciar sesión
  const login = (token) => {
    try {
      localStorage.setItem('token', token);
      const decodedUser = jwtDecode(token);
      setUser({ id: decodedUser.id, rol: decodedUser.rol });
    } catch (e) {
      console.error("Error al decodificar el token", e);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // 3. Pasamos los valores al resto de la app
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Creamos un "hook" personalizado para usar el contexto fácilmente
export function useAuth() {
  return useContext(AuthContext);
}