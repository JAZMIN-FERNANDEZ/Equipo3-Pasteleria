import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api';
import toast from 'react-hot-toast';

function RegisterPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    contrasena: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación local simple (Visualizada con Toast)
    if (!formData.nombre || !formData.correo || !formData.contrasena) {
      toast.error("Por favor completa los campos requeridos.");
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/register', formData);
      
      toast.success('¡Registro exitoso! Ahora puedes iniciar sesión.');
      navigate('/login');

    } catch (err) {
      // Error manejado por el interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Crear una Cuenta</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Nombre Completo:</label>
            <input 
              type="text" name="nombre" value={formData.nombre} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Teléfono:</label>
            <input 
              type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Correo Electrónico:</label>
            <input 
              type="email" name="correo" value={formData.correo} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Contraseña:</label>
            <input 
              type="password" name="contrasena" value={formData.contrasena} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300 disabled:bg-gray-400"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="text-center mt-4">
          <span className="text-gray-600">¿Ya tienes una cuenta? </span>
          <Link to="/login" className="text-blue-500 hover:underline">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;