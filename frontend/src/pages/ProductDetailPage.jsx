// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api';
import { useCart } from '../context/CartContext';

const BACKEND_URL = 'http://localhost:3000';

function ProductDetailPage() {
  // --- Hooks de React y React Router ---
  const { id } = useParams(); // Obtiene el 'id' de la URL (ej. /product/1)
  const navigate = useNavigate(); // Hook para redirigir
  const { addToCart } = useCart(); // Hook de tu contexto de carrito

  // --- Estados del Componente ---
  const [product, setProduct] = useState(null); // Para guardar los datos del producto
  const [attributes, setAttributes] = useState([]); // Para guardar las opciones (tamaño, sabor...)
  const [stockDisponible, setStockDisponible] = useState(0); // Para el stock de "pivote"
  const [loading, setLoading] = useState(true); // Para mostrar un 'Cargando...'
  const [error, setError] = useState(null); // Para mostrar errores
  
  // Estado para guardar las selecciones del usuario (ej. { '1': 2 })
  const [selectedOptions, setSelectedOptions] = useState({}); 

  // --- Efecto de Carga de Datos ---
  // Se ejecuta una vez cuando el componente se carga
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null); // Limpia errores anteriores
        
        const response = await apiClient.get(`/products/${id}`);
        
        if (response.data && response.data.producto) {
          // Guarda los datos del backend en los estados
          setProduct(response.data.producto);
          setAttributes(response.data.atributos);
          setStockDisponible(response.data.stockDisponible); // Guarda el stock calculado
          
          // Pre-selecciona la primera opción de cada atributo
          const initialSelections = {};
          response.data.atributos.forEach(attr => {
            if (attr.attribute_options.length > 0) {
              initialSelections[attr.id_atributo] = attr.attribute_options[0].id_opcion;
            }
          });
          setSelectedOptions(initialSelections);
        } else {
          // Si la API responde bien pero no viene el producto
          setError("Producto no encontrado.");
        }

      } catch (err) {
        console.error("Error al cargar el producto:", err);
        setError("No se pudo cargar el producto. Intenta de nuevo.");
      } finally {
        setLoading(false); // Deja de cargar, sea con éxito o error
      }
    };
    fetchProductDetails();
  }, [id]); // Dependencia: se vuelve a ejecutar si el 'id' de la URL cambia

  // --- Manejador de Cambios en los <select> ---
  const handleOptionChange = (e) => {
    const { name: attrId, value: optionId } = e.target;
    setSelectedOptions(prev => ({
      ...prev,
      [attrId]: parseInt(optionId)
    }));
  };

  // --- Manejador de Envío del Formulario (Añadir al Carrito) ---
  //
  // 🛠️ ESTA ES LA FUNCIÓN CORREGIDA 🛠️
  //
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    // 1. Prepara las variables
    let finalPrice = parseFloat(product.preciobase); 
    const personalizacionDetails = {}; // Objeto para guardar { "Sabor de Pan": "Chocolate" }

    // 2. Itera sobre las opciones SELECCIONADAS para construir los detalles
    for (const attrId in selectedOptions) {
      const optionId = selectedOptions[attrId];
      const attr = attributes.find(a => a.id_atributo === parseInt(attrId));
      if (!attr) continue;
      
      const opt = attr.attribute_options.find(o => o.id_opcion === optionId);
      if (!opt) continue;

      // Suma el ajuste de precio (convertido a número)
      finalPrice += parseFloat(opt.ajusteprecio); 
      
      // Añade al objeto de personalización para la API
      personalizacionDetails[attr.nombreatributo] = opt.nombreopcion;
    }

    // 3. Construye el objeto final para la API (FUERA DEL BUCLE)
    const itemForAPI = {
      id_producto: product.id_producto,
      cantidad: 1, // Por ahora, la cantidad siempre es 1
      personalizacion: personalizacionDetails // El JSON con los detalles de texto
    };

    try {
      // 4. Llama a addToCart UNA SOLA VEZ y espera
      await addToCart(itemForAPI);
      
      // 5. Redirige al usuario al carrito
      navigate('/cart');
    
    } catch (error) {
      console.error("Error al añadir al carrito:", error);
      alert("No se pudo agregar el producto al carrito.");
    }
  };
  // =======================================================


  // --- Renderizado condicional ---
  if (loading) {
    return <div className="text-center mt-20">Cargando...</div>;
  }

  // Muestra el error si existe
  if (error) {
    return <div className="text-center mt-20 text-red-500">{error}</div>;
  }

  // Muestra "No encontrado" si la carga terminó pero el producto sigue nulo
  if (!product) {
    return <div className="text-center mt-20">Producto no encontrado.</div>;
  }

  // --- Renderizado principal (cuando todo está listo) ---
  return (
    <div className="bg-gray-100 min-h-screen">
      <main className="container mx-auto mt-10 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Columna de la Imagen */}
            <div>
              <div className="w-full h-80 bg-gray-300 rounded-md">
                <img 
                  src={`${BACKEND_URL}${product.imagenurl}`} 
                  alt={product.nombre} 
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            </div>

            {/* Columna de Detalles y Personalización */}
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {product.nombre}
              </h1>
              <p className="text-gray-600 mb-6">
                {product.descripcion}
              </p>

              {/* Formulario de Personalización Dinámico */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                
                {/* Mapea los atributos (Tamaño, Sabor, etc.) */}
                {attributes.map((attr) => (
                  <div key={attr.id_atributo}>
                    <label 
                      htmlFor={attr.nombreatributo} 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {attr.nombreatributo}
                    </label>
                    <select
                      id={attr.nombreatributo}
                      name={String(attr.id_atributo)} // El 'name' es el ID del atributo
                      value={selectedOptions[attr.id_atributo] || ''} // Valor controlado
                      onChange={handleOptionChange} // Manejador de cambio
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      {/* Mapea las opciones (Pequeño, Mediano, etc.) */}
                      {attr.attribute_options.map((opt) => (
                        <option key={opt.id_opcion} value={opt.id_opcion}>
                          {opt.nombreopcion} (+${parseFloat(opt.ajusteprecio).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                {/* --- Lógica de Disponibilidad --- */}
                <div className="pt-4">
                  <p className="text-sm font-semibold text-gray-700">
                    Disponibles: {stockDisponible} pzas.
                  </p>
                  {stockDisponible === 0 && (
                    <p className="text-xs text-red-600">
                      Producto Agotado. No se puede agregar al carrito.
                    </p>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className="flex space-x-4 pt-2">
                  <button
                    type="submit"
                    disabled={stockDisponible <= 0} // Deshabilita el botón si no hay stock
                    className={`flex-1 text-white font-bold py-3 px-6 rounded-md transition duration-300 
                      ${stockDisponible > 0 
                        ? 'bg-pink-500 hover:bg-pink-600' // Estilo activado
                        : 'bg-gray-400 cursor-not-allowed' // Estilo desactivado
                      }`}
                  >
                    {stockDisponible > 0 ? 'Agregar al Carrito' : 'No disponible'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')} // Botón para volver al inicio
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-md transition duration-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProductDetailPage;