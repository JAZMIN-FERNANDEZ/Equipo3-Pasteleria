import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api'; // Importamos el cliente API

function RegisterPage() {
  // --- Estados para el formulario ---
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    contrasena: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate(); // Hook para redirigir

  // --- Manejador de cambios en los inputs ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Manejador de envío del formulario ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validación simple
    if (!formData.nombre || !formData.correo || !formData.contrasena) {
      setError("Nombre, correo y contraseña son campos requeridos.");
      setLoading(false);
      return;
    }

    try {
      // 1. Llama al backend
      await apiClient.post('/auth/register', formData);

      // 2. Éxito: Muestra un mensaje y redirige al login
      alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
      navigate('/login');

    } catch (err) {
      // 3. Error: Muestra el error de la API
      console.error("Error en el registro:", err);
      setError(err.response?.data?.error || 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        
        <h1 className="text-2xl font-bold text-center mb-6">Crear una Cuenta</h1>
        
        {/* Muestra de Errores */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="name">
              Nombre Completo:
            </label>
            <input 
              type="text" 
              name="nombre" // <-- 'name' coincide con el estado y la API
              id="name"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2" htmlFor="phone">
              Teléfono:
            </label>
            <input 
              type="tel" 
              name="telefono" // <-- 'name' coincide con el estado y la API
              id="phone"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Correo Electrónico:
            </label>
            <input 
              type="email" 
              name="correo" // <-- 'name' coincide con el estado y la API
              id="email"
              value={formData.correo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Contraseña:
            </label>
            <input 
              type="password"
              name="contrasena" // <-- 'name' coincide con el estado y la API
              id="password"
              value={formData.contrasena}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading} // Deshabilita el botón mientras carga
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300 disabled:bg-gray-400"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="text-center mt-4">
          <span className="text-gray-600">¿Ya tienes una cuenta? </span>
          <Link to="/login" className="text-blue-500 hover:underline">
            Inicia sesión
          </Link>
        </div>

      </div>
    </div>
  );
}

export default RegisterPage;