import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api'; 
import { useAuth } from '../context/AuthContext'; // 1. Importa el hook useAuth

function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const { login } = useAuth(); // 2. Obtén la función login del contexto

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(null); 

    try {
      const response = await apiClient.post('/auth/login', {
        correo: correo,
        contrasena: contrasena
      });

      // 3. Llama a la función login del contexto con el token
      login(response.data.token);

      // 4. Redirige al usuario a la página de inicio
      navigate('/');

    } catch (err) {
      console.error("Error en el login:", err.response.data.error);
      setError(err.response.data.error || 'Error al iniciar sesión');
    }
  };

  // ... (El resto de tu código JSX del formulario no cambia)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {/* ... tus inputs ... */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Correo Electrónico:
            </label>
            <input 
              type="email" 
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={correo} 
              onChange={(e) => setCorreo(e.target.value)} 
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Contraseña:
            </label>
            <input 
              type="password"
              id="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)} 
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Ingresar
          </button>
        </form>
        <div className="text-center mt-4">
          <span className="text-gray-600">¿No tienes una cuenta? </span>
          <Link to="/register" className="text-blue-500 hover:underline">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;