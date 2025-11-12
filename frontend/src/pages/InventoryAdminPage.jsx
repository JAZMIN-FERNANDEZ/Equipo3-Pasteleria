import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext'; // Importa el hook de autenticación

const BACKEND_URL = 'http://localhost:3000';

// ================================================
// ===   MODAL PARA AGREGAR/EDITAR PRODUCTO     ===
// ================================================
function ProductModal({ isOpen, onClose, onSave, product }) {
  const [formData, setFormData] = useState({ sku: '', nombre: '', descripcion: '', id_categoria: 1, precioBase: 0, stockProductosTerminados: 0 });
  const [imagenFile, setImagenFile] = useState(null);
  const isEditMode = Boolean(product); 
  useEffect(() => {
    if (isEditMode && product) {
      setFormData({
        sku: product.sku || '',
        nombre: product.nombre || '',
        descripcion: product.descripcion || '',
        id_categoria: product.id_categoria || 1,
        precioBase: product.preciobase || 0,
        stockProductosTerminados: product.stockproductosterminados || 0
      });
      setImagenFile(null);
    } else {
      setFormData({ sku: '', nombre: '', descripcion: '', id_categoria: 1, precioBase: 0, stockProductosTerminados: 0 });
      setImagenFile(null);
    }
  }, [isOpen, product, isEditMode]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleFileChange = (e) => {
    setImagenFile(e.target.files[0]);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, imagenFile, product?.id_producto);
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md my-8">
        <h2 className="text-xl font-bold mb-4">{isEditMode ? 'Editar Producto' : 'Agregar Producto'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
           <div><label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU</label><input type="text" name="sku" id="sku" value={formData.sku} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required /></div>
          <div><label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label><input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required /></div>
          <div><label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label><textarea name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
          <div><label htmlFor="id_categoria" className="block text-sm font-medium text-gray-700">Categoría</label><select name="id_categoria" id="id_categoria" value={formData.id_categoria} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value={1}>Pasteles</option><option value={2}>Galletas</option><option value={3}>Cupcakes</option><option value={4}>Bebidas</option></select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="precioBase" className="block text-sm font-medium text-gray-700">Precio</label><input type="number" name="precioBase" id="precioBase" step="0.01" value={formData.precioBase} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
            <div><label htmlFor="stockProductosTerminados" className="block text-sm font-medium text-gray-700">Stock</label><input type="number" name="stockProductosTerminados" id="stockProductosTerminados" value={formData.stockProductosTerminados} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div>
          </div>
          <div><label htmlFor="imagen" className="block text-sm font-medium text-gray-700">Imagen</label><input type="file" name="imagen" id="imagen" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />{isEditMode && !imagenFile && <span className="text-xs text-gray-500">Dejar en blanco para conservar la imagen actual.</span>}</div>
          <div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md">Cancelar</button><button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md">Guardar</button></div>
        </form>
      </div>
    </div>
  );
}

// ================================================
// ===   MODAL PARA AGREGAR/EDITAR INGREDIENTE  ===
// ================================================
function IngredientModal({ isOpen, onClose, onSave, ingredient }) {
  const [formData, setFormData] = useState({
    sku: '',
    nombre: '',
    stockactual: 0,
    stockminimo: 0,
    unidadmedida: 'kg',
    id_proveedor: ''
  });
  const isEditMode = Boolean(ingredient);

  useEffect(() => {
    if (isEditMode && ingredient) {
      setFormData({
        sku: ingredient.sku || '',
        nombre: ingredient.nombre || '',
        stockactual: ingredient.stockactual || 0,
        stockminimo: ingredient.stockminimo || 0,
        unidadmedida: ingredient.unidadmedida || 'kg',
        id_proveedor: ingredient.id_proveedor || ''
      });
    } else {
      setFormData({ sku: '', nombre: '', stockactual: 0, stockminimo: 0, unidadmedida: 'kg', id_proveedor: '' });
    }
  }, [isOpen, ingredient, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, ingredient?.id_ingrediente);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isEditMode ? 'Editar Ingrediente' : 'Agregar Ingrediente'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... (Todo el JSX del formulario del modal de ingrediente) ... */}
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU</label>
            <input type="text" name="sku" id="sku" value={formData.sku} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="stockactual" className="block text-sm font-medium text-gray-700">Stock Actual</label>
            <input type="number" name="stockactual" id="stockactual" value={formData.stockactual} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="stockminimo" className="block text-sm font-medium text-gray-700">Stock Mínimo</label>
            <input type="number" name="stockminimo" id="stockminimo" value={formData.stockminimo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="unidadmedida" className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
            <input type="text" name="unidadmedida" id="unidadmedida" value={formData.unidadmedida} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="id_proveedor" className="block text-sm font-medium text-gray-700">Proveedor (ID)</label>
            <input type="number" name="id_proveedor" id="id_proveedor" value={formData.id_proveedor} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md">Cancelar</button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ================================================
// ===   COMPONENTE PRINCIPAL DE LA PÁGINA      ===
// ================================================
function InventoryAdminPage() {
  const { user } = useAuth();
  if (!user) {
    return <div className="text-center mt-10">Cargando...</div>;
  }
  const isAdmin = user.rol === 'Administrador';

  const [activeTab, setActiveTab] = useState('productos');
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  
  // --- 🛠️ NUEVO: Estados para los buscadores ---
  const [productSearch, setProductSearch] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // --- Carga de Datos ---
  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      alert(error.response?.data?.error || "Error al cargar productos");
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await apiClient.get('/admin/ingredients');
      setIngredients(response.data);
    } catch (error) {
      console.error("Error al cargar ingredientes:", error);
      alert(error.response?.data?.error || "Error al cargar ingredientes");
    }
  };

  useEffect(() => {
    if (activeTab === 'productos') {
      fetchProducts();
    } else {
      fetchIngredients();
    }
  }, [activeTab]);

  // --- Funciones CRUD (sin cambios) ---
  const handleOpenAddProductModal = () => { setSelectedProduct(null); setIsProductModalOpen(true); };
  const handleOpenEditProductModal = (product) => { setSelectedProduct(product); setIsProductModalOpen(true); };
  const handleCloseProductModal = () => { setIsProductModalOpen(false); setSelectedProduct(null); };
  const handleSaveProduct = async (formData, imagenFile, productId) => {
    const isEditMode = Boolean(productId);
    const data = new FormData();
    data.append('sku', formData.sku);
    data.append('nombre', formData.nombre);
    data.append('descripcion', formData.descripcion);
    data.append('precioBase', formData.precioBase);
    data.append('id_categoria', formData.id_categoria);
    data.append('stockProductosTerminados', formData.stockProductosTerminados);
    if (imagenFile) { data.append('imagen', imagenFile); }
    try {
      if (isEditMode) {
        await apiClient.put(`/admin/products/${productId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await apiClient.post('/admin/products', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      fetchProducts();
      handleCloseProductModal();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      alert(error.response?.data?.error || "Error al guardar producto");
    }
  };
  const handleDeleteProduct = async (productId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        await apiClient.delete(`/admin/products/${productId}`);
        fetchProducts();
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        alert(error.response?.data?.error || "Error al eliminar producto");
      }
    }
  };
  const handleOpenAddIngredientModal = () => { setSelectedIngredient(null); setIsIngredientModalOpen(true); };
  const handleOpenEditIngredientModal = (ingredient) => { setSelectedIngredient(ingredient); setIsIngredientModalOpen(true); };
  const handleCloseIngredientModal = () => { setIsIngredientModalOpen(false); setSelectedIngredient(null); };
  const handleSaveIngredient = async (formData, ingredientId) => {
    const isEditMode = Boolean(ingredientId);
    try {
      if (isEditMode) {
        await apiClient.put(`/admin/ingredients/${ingredientId}`, formData);
      } else {
        await apiClient.post('/admin/ingredients', formData);
      }
      fetchIngredients();
      handleCloseIngredientModal();
    } catch (error) {
      console.error("Error al guardar ingrediente:", error);
      alert(error.response?.data?.error || "Error al guardar ingrediente");
    }
  };
  const handleDeleteIngredient = async (ingredientId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este ingrediente?")) {
      try {
        await apiClient.delete(`/admin/ingredients/${ingredientId}`);
        fetchIngredients();
      } catch (error) {
        console.error("Error al eliminar ingrediente:", error);
        alert(error.response?.data?.error || "Error al eliminar ingrediente");
      }
    }
  };

  // --- 🛠️ NUEVO: Lógica de Filtrado ---
  // Filtra por nombre O sku
  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );
  const filteredIngredients = ingredients.filter(i =>
    i.nombre.toLowerCase().includes(ingredientSearch.toLowerCase()) ||
    i.sku.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto mt-10 p-4">
      {isAdmin && (
        <>
          <ProductModal isOpen={isProductModalOpen} onClose={handleCloseProductModal} onSave={handleSaveProduct} product={selectedProduct} />
          <IngredientModal isOpen={isIngredientModalOpen} onClose={handleCloseIngredientModal} onSave={handleSaveIngredient} ingredient={selectedIngredient} />
        </>
      )}

      <div className="bg-white p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Inventario</h1>
        
        <div className="flex border-b border-gray-200 mb-4">
          <button onClick={() => setActiveTab('productos')} className={`py-2 px-4 ${activeTab === 'productos' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
            Productos
          </button>
          <button onClick={() => setActiveTab('ingredientes')} className={`py-2 px-4 ${activeTab === 'ingredientes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
            Ingredientes
          </button>
        </div>

        <div>
          {/* --- PESTAÑA DE PRODUCTOS --- */}
          {activeTab === 'productos' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                {/* 🛠️ Input ahora funcional */}
                <input
                  type="text"
                  placeholder="Buscar productos por nombre o SKU..."
                  className="w-1/3 px-4 py-2 border border-gray-300 rounded-md"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {isAdmin && (
                  <button onClick={handleOpenAddProductModal} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md">
                    Agregar Producto
                  </button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imagen</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      {/* 🛠️ Columna de Acciones oculta para Cajero */}
                      {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* 🛠️ Mapea la lista FILTRADA */}
                    {filteredProducts.map((product) => (
                      <tr key={product.id_producto}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                        <td className="px-6 py-4">
                          <img src={`${BACKEND_URL}${product.imagenurl}`} alt={product.nombre} className="w-16 h-16 object-cover rounded" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parseFloat(product.preciobase).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stockproductosterminados}</td>
                        {/* 🛠️ Celdas de Acciones ocultas para Cajero */}
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button onClick={() => handleOpenEditProductModal(product)} className="text-blue-600 hover:text-blue-800">Editar</button>
                            <button onClick={() => handleDeleteProduct(product.id_producto)} className="text-red-600 hover:text-red-800">Eliminar</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- PESTAÑA DE INGREDIENTES --- */}
          {activeTab === 'ingredientes' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                {/* 🛠️ Input ahora funcional */}
                <input
                  type="text"
                  placeholder="Buscar ingredientes por nombre o SKU..."
                  className="w-1/3 px-4 py-2 border border-gray-300 rounded-md"
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                />
                {isAdmin && (
                  <button onClick={handleOpenAddIngredientModal} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md">
                    Agregar Ingrediente
                  </button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Mínimo</th>
                      {/* 🛠️ Columna de Acciones oculta para Cajero */}
                      {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* 🛠️ Mapea la lista FILTRADA */}
                    {filteredIngredients.map((ing) => (
                      <tr key={ing.id_ingrediente}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ing.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ing.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ing.unidadmedida}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parseFloat(ing.stockactual).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parseFloat(ing.stockminimo).toFixed(2)}</td>
                        {/* 🛠️ Celdas de Acciones ocultas para Cajero */}
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button onClick={() => handleOpenEditIngredientModal(ing)} className="text-blue-600 hover:text-blue-800">Editar</button>
                            <button onClick={() => handleDeleteIngredient(ing.id_ingrediente)} className="text-red-600 hover:text-red-800">Eliminar</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InventoryAdminPage;