// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Importa Link para una mejor navegación
import apiClient from '../api'; // Importa tu cliente Axios

// La URL base de tu backend, para construir las rutas de las imágenes
const BACKEND_URL = 'http://localhost:3000';

function HomePage() {
  // Estado para guardar los productos que vienen de la API
  const [products, setProducts] = useState([]);
  
  // Este hook se ejecuta una vez cuando el componente se carga
  useEffect(() => {
    // Definimos una función asíncrona para cargar los productos
    const fetchProducts = async () => {
      try {
        // Hacemos la llamada GET a la ruta que creamos en el backend
        const response = await apiClient.get('/products');
        // Guardamos los productos en el estado
        setProducts(response.data);
      } catch (error) {
        console.error("Error al cargar los productos:", error);
      }
    };

    fetchProducts(); // Ejecutamos la función
  }, []); // El array vacío [] asegura que esto se ejecute solo una vez

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Contenido Principal */}
      <main className="container mx-auto mt-8 px-4">
        {/* Barra de Búsqueda */}
        <div className="mb-8 max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Buscar productos..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Carrusel de Productos */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">
            Nuestros Productos
          </h2>
          <div className="relative">
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              
              {/* === AQUÍ ESTÁ LA MAGIA === */}
              {/* Mapeamos sobre los productos del estado, no de sampleProducts */}
              {products.map((product) => (
                <Link 
                  to={`/product/${product.id_producto}`} // Usamos Link para navegar
                  key={product.id_producto}
                  className="flex-shrink-0 w-64 border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-300 cursor-pointer"
                >
                  {/* Construimos la URL completa de la imagen */}
                  <div className="h-40 bg-gray-300">
                    <img 
                      // OJO: Prisma convierte "ImagenURL" a "imagenurl" (minúsculas)
                      src={`${BACKEND_URL}${product.imagenurl}`} 
                      alt={product.nombre} // Usamos las propiedades de la BD
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {product.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {product.descripcion}
                    </p>
                    <p className="text-lg font-bold text-pink-500 mt-2">
                      ${product.preciobase}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;