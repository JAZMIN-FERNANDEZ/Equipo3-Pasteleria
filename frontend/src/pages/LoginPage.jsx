import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api'; 
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast'; 

function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false); 
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', {
        correo: correo,
        contrasena: contrasena
      });

      login(response.data.token);
      toast.success(`¡Bienvenido, ${response.data.usuario.rol}!`);
      navigate('/');

    } catch (err) {
      console.error("Login fallido (manejado por interceptor)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>
        
        <form onSubmit={handleSubmit}>
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
              required
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
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300 disabled:bg-gray-400"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
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