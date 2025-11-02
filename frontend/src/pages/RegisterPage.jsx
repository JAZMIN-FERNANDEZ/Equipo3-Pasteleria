// src/pages/RegisterPage.jsx

function RegisterPage() {
  return (
    // Contenedor principal para centrar
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      {/* Tarjeta del formulario */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        
        <h1 className="text-2xl font-bold text-center mb-6">Crear una Cuenta</h1>
        
        <form>
          {/* Campo de Nombre */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="name">
              Nombre Completo:
            </label>
            <input 
              type="text" 
              id="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Campo de Teléfono */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="phone">
              Teléfono:
            </label>
            <input 
              type="tel" 
              id="phone"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Campo de Correo Electrónico */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Correo Electrónico:
            </label>
            <input 
              type="email" 
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Campo de Contraseña */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Contraseña:
            </label>
            <input 
              type="password"
              id="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Registrarse
          </button>
        </form>

      </div>
    </div>
  );
}

export default RegisterPage;