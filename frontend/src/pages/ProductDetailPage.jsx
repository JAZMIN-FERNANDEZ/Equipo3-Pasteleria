// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api';
import { useCart } from '../context/CartContext';

const BACKEND_URL = 'http://localhost:3000';

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/products/${id}`);
        setProduct(response.data.producto);
        setAttributes(response.data.atributos);
        
        const initialSelections = {};
        response.data.atributos.forEach(attr => {
          if (attr.attribute_options.length > 0) {
            initialSelections[attr.id_atributo] = attr.attribute_options[0].id_opcion;
          }
        });
        setSelectedOptions(initialSelections);

      } catch (err) {
        setError("No se pudo cargar el producto.");
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

  const handleOptionChange = (e) => {
    const { name: attrId, value: optionId } = e.target;
    setSelectedOptions(prev => ({
      ...prev,
      [attrId]: parseInt(optionId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // === 🛠️ ARREGLO #1: Convertir precio base a número ===
    let finalPrice = parseFloat(product.preciobase); 
    const selectedOptionsDetails = [];

    for (const attrId in selectedOptions) {
      const optionId = selectedOptions[attrId];
      const attr = attributes.find(a => a.id_atributo === parseInt(attrId));
      if (!attr) continue;
      
      const opt = attr.attribute_options.find(o => o.id_opcion === optionId);
      if (!opt) continue;

      // === 🛠️ ARREGLO #2: Convertir ajuste de precio a número ===
      finalPrice += parseFloat(opt.ajusteprecio); 
      selectedOptionsDetails.push(opt.nombreopcion);
    }

    const itemForCart = {
      productId: product.id_producto,
      name: `${product.nombre} (${selectedOptionsDetails.join(', ')})`,
      quantity: 1,
      price: finalPrice,
      subtotal: finalPrice
    };

    addToCart(itemForCart);
  };

  // ... (tus return de loading/error/not found) ...
  if (loading || !product) return <div>Cargando...</div>;

  return (
    <div className="bg-gray-100 min-h-screen">
      <main className="container mx-auto mt-10 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
          {/* ... (código de la imagen y detalles del producto) ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="w-full h-80 bg-gray-300 rounded-md">
                <img 
                  src={`${BACKEND_URL}${product.imagenurl}`} 
                  alt={product.nombre} 
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {product.nombre}
              </h1>
              <p className="text-gray-600 mb-6">
                {product.descripcion}
              </p>
              
              <form className="space-y-4" onSubmit={handleSubmit}>
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
                      name={String(attr.id_atributo)} 
                      value={selectedOptions[attr.id_atributo] || ''} 
                      onChange={handleOptionChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      {attr.attribute_options.map((opt) => (
                        <option key={opt.id_opcion} value={opt.id_opcion}>
                          {opt.nombreopcion} 
                          {/* === 🛠️ ARREGLO #3: Convertir a número antes de .toFixed() === */}
                           (+${parseFloat(opt.ajusteprecio).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-md transition duration-300"
                  >
                    Agregar al Carrito
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')} 
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