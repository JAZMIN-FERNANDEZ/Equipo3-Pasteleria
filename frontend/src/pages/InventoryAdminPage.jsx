import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast'; 
const BACKEND_URL = 'http://localhost:3000';

// ================================================
// ===   MODAL DE GESTIÓN DE RECETAS            ===
// ================================================
function RecipeModal({ isOpen, onClose, product, allIngredients }) {
  const [recipeItems, setRecipeItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar la receta existente
  useEffect(() => {
    if (isOpen && product) {
      const fetchRecipe = async () => {
        try {
          setLoading(true);
          const response = await apiClient.get(`/admin/products/${product.id_producto}/recipe`);
          const items = response.data.map(item => ({
            id_ingrediente: item.id_ingrediente,
            cantidad: item.cantidadrequerida,
            unidad: item.ingredientes.unidadmedida
          }));
          setRecipeItems(items);
        } catch (error) {
          // El interceptor maneja el error visual
        } finally {
          setLoading(false);
        }
      };
      fetchRecipe();
    } else {
      setRecipeItems([]);
    }
  }, [isOpen, product]);

  const handleAddRow = () => {
    setRecipeItems([...recipeItems, { id_ingrediente: '', cantidad: '', unidad: '' }]);
  };

  const handleRemoveRow = (index) => {
    const newItems = [...recipeItems];
    newItems.splice(index, 1);
    setRecipeItems(newItems);
  };

  const handleChangeRow = (index, field, value) => {
    const newItems = [...recipeItems];
    newItems[index][field] = value;

    if (field === 'id_ingrediente') {
      const ing = allIngredients.find(i => i.id_ingrediente === parseInt(value));
      newItems[index].unidad = ing ? ing.unidadmedida : '';
    }
    setRecipeItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación local antes de enviar
    const invalidItems = recipeItems.some(item => !item.id_ingrediente || item.cantidad <= 0);
    if (invalidItems) {
      toast.error("Todos los ingredientes deben tener una cantidad mayor a 0.");
      return;
    }

    try {
      // Filtramos por si acaso, aunque la validación de arriba ya protege
      const validItems = recipeItems.filter(item => item.id_ingrediente && item.cantidad > 0);
      
      await apiClient.post(`/admin/products/${product.id_producto}/recipe`, {
        ingredientes: validItems
      });
      
      toast.success("Receta guardada correctamente.");
      onClose();
    } catch (error) {
      // El interceptor maneja el error visual (incluyendo validaciones Zod del backend)
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-2">Gestionar Receta</h2>
        <p className="text-gray-600 mb-4">Producto: <span className="font-semibold">{product.nombre}</span></p>
        
        {loading ? <p className="text-center py-4">Cargando receta...</p> : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-3 mb-4">
              {recipeItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700">Ingrediente</label>
                    <select
                      value={item.id_ingrediente}
                      onChange={(e) => handleChangeRow(index, 'id_ingrediente', e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {allIngredients.map(ing => (
                        <option key={ing.id_ingrediente} value={ing.id_ingrediente}>
                          {ing.nombre} ({ing.stockactual} {ing.unidadmedida})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-700">Cant. ({item.unidad || '-'})</label>
                    <input
                      type="number"
                      // 🛡️ VALIDACIONES HTML5
                      min="0.001"
                      step="0.001"
                      value={item.cantidad}
                      onChange={(e) => handleChangeRow(index, 'cantidad', e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                      required
                      onKeyDown={(e) => {
                         // Prevenir escribir signo menos manualmente
                         if(e.key === '-' || e.key === 'e') e.preventDefault();
                      }}
                    />
                  </div>
                  <button type="button" onClick={() => handleRemoveRow(index)} className="bg-red-100 text-red-600 p-1 rounded hover:bg-red-200 mb-0.5">🗑️</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={handleAddRow} className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded hover:border-blue-500 hover:text-blue-500 mb-6">+ Agregar Ingrediente</button>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md">Cerrar</button>
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md">Guardar Receta</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ================================================
// ===   MODAL DE PRODUCCIÓN     ===
// ================================================
function ProductionModal({ isOpen, onClose, onProduce, product }) {
  const [cantidad, setCantidad] = useState(1);
  useEffect(() => { if (isOpen) setCantidad(1); }, [isOpen]);
  const handleSubmit = (e) => {
    e.preventDefault();
    onProduce(product.id_producto, cantidad);
  };
  if (!isOpen || !product) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-xl font-bold mb-2">Registrar Producción</h2>
        <p className="text-gray-600 mb-4">Producto: <span className="font-semibold text-gray-800">{product.nombre}</span></p>
        <p className="text-sm text-yellow-600 mb-4 bg-yellow-50 p-2 rounded">⚠️ Esto descontará los ingredientes necesarios.</p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Producir:</label>
          <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md mb-6" autoFocus />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md">Cancelar</button>
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md">Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

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

  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleFileChange = (e) => { setImagenFile(e.target.files[0]); };
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData, imagenFile, product?.id_producto); };

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
  const [formData, setFormData] = useState({ sku: '', nombre: '', stockactual: 0, stockminimo: 0, unidadmedida: 'kg', id_proveedor: '' });
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

  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData, ingredient?.id_ingrediente); };

  if (!isOpen) return null;

  // Lista de unidades estándar
  const unidades = ['kg', 'g', 'lt', 'ml', 'pza', 'paquete', 'caja'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{isEditMode ? 'Editar Ingrediente' : 'Agregar Ingrediente'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700">SKU</label><input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full border p-2 rounded" required /></div>
          <div><label className="block text-sm font-medium text-gray-700">Nombre</label><input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full border p-2 rounded" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700">Stock Actual</label><input type="number" name="stockactual" value={formData.stockactual} onChange={handleChange} className="w-full border p-2 rounded" required /></div>
            <div><label className="block text-sm font-medium text-gray-700">Stock Mínimo</label><input type="number" name="stockminimo" value={formData.stockminimo} onChange={handleChange} className="w-full border p-2 rounded" required /></div>
          </div>
          
          {/* 🛠️ CORRECCIÓN: Select de Unidades */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
            <select name="unidadmedida" value={formData.unidadmedida} onChange={handleChange} className="w-full border p-2 rounded">
              {unidades.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div><label className="block text-sm font-medium text-gray-700">ID Proveedor</label><input type="number" name="id_proveedor" value={formData.id_proveedor} onChange={handleChange} className="w-full border p-2 rounded" /></div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded">Cancelar</button>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Guardar</button>
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
  if (!user) return <div className="text-center mt-10">Cargando...</div>;
  const isAdmin = user.rol === 'Administrador';

  const [activeTab, setActiveTab] = useState('productos');
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeProduct, setRecipeProduct] = useState(null);
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [productionProduct, setProductionProduct] = useState(null);

  // --- Carga de Datos ---
  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data);
    } catch (error) { }
  };

  const fetchIngredients = async () => {
    try {
      const response = await apiClient.get('/admin/ingredients');
      setIngredients(response.data);
    } catch (error) { }
  };

  useEffect(() => {
    if (activeTab === 'productos') fetchProducts();
    else fetchIngredients();
  }, [activeTab]);

  // --- Funciones CRUD Productos ---
  const handleOpenAddProductModal = () => { setSelectedProduct(null); setIsProductModalOpen(true); };
  const handleOpenEditProductModal = (product) => { setSelectedProduct(product); setIsProductModalOpen(true); };
  const handleCloseProductModal = () => { setIsProductModalOpen(false); setSelectedProduct(null); };
  const handleSaveProduct = async (formData, imagenFile, productId) => {
    const isEditMode = Boolean(productId);
    const data = new FormData();
    for (const key in formData) data.append(key, formData[key]);
    if (imagenFile) data.append('imagen', imagenFile);

    try {
      if (isEditMode) await apiClient.put(`/admin/products/${productId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await apiClient.post('/admin/products', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchProducts();
      handleCloseProductModal();
    } catch (error) { }
  };
  const handleDeleteProduct = async (productId) => {
    if (window.confirm("¿Eliminar producto?")) {
      try { await apiClient.delete(`/admin/products/${productId}`); fetchProducts(); } catch (error) { }
    }
  };

  // --- Funciones Receta y Producción ---
  
  // 🛠️ CORRECCIÓN: Cargar ingredientes si no están cargados
  const handleOpenRecipeModal = async (product) => {
    if (ingredients.length === 0) {
       await fetchIngredients(); 
    }
    setRecipeProduct(product);
    setIsRecipeModalOpen(true);
  };

  const handleCloseRecipeModal = () => { setIsRecipeModalOpen(false); setRecipeProduct(null); };
  
  const handleOpenProductionModal = (product) => { setProductionProduct(product); setIsProductionModalOpen(true); };
  const handleCloseProductionModal = () => { setIsProductionModalOpen(false); setProductionProduct(null); };
  const handleProduce = async (idProducto, cantidad) => {
    try {
      const response = await apiClient.post('/admin/inventory/produce', { id_producto: idProducto, cantidad: parseInt(cantidad) });
      alert(response.data.message);
      fetchProducts();
      handleCloseProductionModal();
    } catch (error) {
      alert(error.response?.data?.error || "Error al producir");
    }
  };

  // --- Funciones CRUD Ingredientes ---
  const handleOpenAddIngredientModal = () => { setSelectedIngredient(null); setIsIngredientModalOpen(true); };
  const handleOpenEditIngredientModal = (ingredient) => { setSelectedIngredient(ingredient); setIsIngredientModalOpen(true); };
  const handleCloseIngredientModal = () => { setIsIngredientModalOpen(false); setSelectedIngredient(null); };
  const handleSaveIngredient = async (formData, ingredientId) => {
    const isEditMode = Boolean(ingredientId);
    try {
      if (isEditMode) await apiClient.put(`/admin/ingredients/${ingredientId}`, formData);
      else await apiClient.post('/admin/ingredients', formData);
      fetchIngredients();
      handleCloseIngredientModal();
    } catch (error) { }
  };
  const handleDeleteIngredient = async (ingredientId) => {
    if (window.confirm("¿Eliminar ingrediente?")) {
      try { await apiClient.delete(`/admin/ingredients/${ingredientId}`); fetchIngredients(); } catch (error) { }
    }
  };

  const filteredProducts = products.filter(p => p.nombre.toLowerCase().includes(productSearch.toLowerCase()));
  const filteredIngredients = ingredients.filter(i => i.nombre.toLowerCase().includes(ingredientSearch.toLowerCase()));

  return (
    <div className="container mx-auto mt-10 p-4">
      {isAdmin && (
        <>
          <ProductModal isOpen={isProductModalOpen} onClose={handleCloseProductModal} onSave={handleSaveProduct} product={selectedProduct} />
          <IngredientModal isOpen={isIngredientModalOpen} onClose={handleCloseIngredientModal} onSave={handleSaveIngredient} ingredient={selectedIngredient} />
          <RecipeModal isOpen={isRecipeModalOpen} onClose={handleCloseRecipeModal} product={recipeProduct} allIngredients={ingredients} />
          <ProductionModal isOpen={isProductionModalOpen} onClose={handleCloseProductionModal} onProduce={handleProduce} product={productionProduct} />
        </>
      )}

      <div className="bg-white p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Inventario</h1>
        <div className="flex border-b border-gray-200 mb-4">
          <button onClick={() => setActiveTab('productos')} className={`py-2 px-4 ${activeTab === 'productos' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Productos</button>
          <button onClick={() => setActiveTab('ingredientes')} className={`py-2 px-4 ${activeTab === 'ingredientes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Ingredientes</button>
        </div>

        <div>
          {activeTab === 'productos' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <input type="text" placeholder="Buscar productos..." className="w-1/3 px-4 py-2 border border-gray-300 rounded-md" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                {isAdmin && <button onClick={handleOpenAddProductModal} className="bg-green-500 text-white font-bold py-2 px-4 rounded-md">Agregar Producto</button>}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      // 🛠️ CORRECCIÓN: Fila roja si stock < 2
                      <tr key={product.id_producto} className={product.stockproductosterminados < 2 ? "bg-red-100" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parseFloat(product.preciobase).toFixed(2)}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${product.stockproductosterminados < 2 ? "text-red-600" : "text-gray-500"}`}>{product.stockproductosterminados}</td>
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button onClick={() => handleOpenRecipeModal(product)} className="text-indigo-600 hover:text-indigo-800">Receta</button>
                            <button onClick={() => handleOpenProductionModal(product)} className="text-purple-600 hover:text-purple-800">Producir</button>
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

          {activeTab === 'ingredientes' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <input type="text" placeholder="Buscar ingredientes..." className="w-1/3 px-4 py-2 border border-gray-300 rounded-md" value={ingredientSearch} onChange={(e) => setIngredientSearch(e.target.value)} />
                {isAdmin && <button onClick={handleOpenAddIngredientModal} className="bg-green-500 text-white font-bold py-2 px-4 rounded-md">Agregar Ingrediente</button>}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mínimo</th>
                      {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredIngredients.map((ing) => (
                      // 🛠️ CORRECCIÓN: Fila roja si stock < mínimo
                      <tr key={ing.id_ingrediente} className={parseFloat(ing.stockactual) < parseFloat(ing.stockminimo) ? "bg-red-100" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ing.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ing.nombre}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${parseFloat(ing.stockactual) < parseFloat(ing.stockminimo) ? "text-red-600" : "text-gray-500"}`}>{parseFloat(ing.stockactual).toFixed(2)} {ing.unidadmedida}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parseFloat(ing.stockminimo).toFixed(2)}</td>
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