// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';

const BACKEND_URL = 'http://localhost:3000';

function HomePage() {
  const [products, setProducts] = useState([]);
  
  // --- 1. Estado para el buscador ---
  const [searchTerm, setSearchTerm] = useState(''); 

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error("Error al cargar los productos:", error);
      }
    };
    fetchProducts();
  }, []);

  // --- 2. Lógica de filtrado ---
  // Filtra los productos basándose en el 'searchTerm'
  // Comprueba si el nombre del producto (en minúsculas) incluye el término de búsqueda (en minúsculas)
  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto mt-8 px-4">
        
        {/* --- 3. Conectar el input al estado --- */}
        <div className="mb-8 max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Buscar productos por nombre..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            // El valor del input es el estado
            value={searchTerm}
            // Cada vez que se teclea, se actualiza el estado
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">
            Nuestros Productos
          </h2>
          <div className="relative">
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              
              {/* --- 4. Mapear la lista FILTRADA --- */}
              {filteredProducts.map((product) => (
                <Link 
                  to={`/product/${product.id_producto}`}
                  key={product.id_producto}
                  className="flex-shrink-0 w-64 border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-300 cursor-pointer"
                >
                  <div className="h-40 bg-gray-300">
                    <img 
                      src={`${BACKEND_URL}${product.imagenurl}`} 
                      alt={product.nombre}
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
                      ${parseFloat(product.preciobase).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Mensaje si no hay resultados */}
            {filteredProducts.length === 0 && (
              <p className="text-center text-gray-500 mt-4">
                No se encontraron productos que coincidan con tu búsqueda.
              </p>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;