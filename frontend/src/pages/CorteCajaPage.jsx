import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api';

// Función para obtener la fecha de hoy en formato YYYY-MM-DD
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

function CorteCajaPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fecha, setFecha] = useState(getTodayString());

  // --- Carga de Datos ---
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/admin/corte-caja', {
          params: { fecha: fecha } // Envía la fecha seleccionada
        });
        setReportData(response.data);
      } catch (err) {
        console.error("Error al cargar el corte:", err);
        setError(err.response?.data?.error || "No se pudo cargar el reporte");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [fecha]); // Se vuelve a ejecutar si la fecha cambia

  // --- Cálculos de Totales (usando useMemo) ---
  const { totalVentas, totalEfectivo, totalTarjeta, totalTransferencia } = useMemo(() => {
    if (!reportData) return { totalVentas: 0, totalEfectivo: 0, totalTarjeta: 0, totalTransferencia: 0 };
    
    let total = 0;
    let efectivo = 0;
    let tarjeta = 0;
    let transferencia = 0;

    reportData.ventasPorMetodo.forEach(metodo => {
      const suma = parseFloat(metodo._sum.total) || 0;
      total += suma;
      if (metodo.metodo_pago === 'Efectivo') efectivo = suma;
      if (metodo.metodo_pago === 'Tarjeta') tarjeta = suma;
      if (metodo.metodo_pago === 'Transferencia') transferencia = suma;
    });

    return { totalVentas: total, totalEfectivo: efectivo, totalTarjeta: tarjeta, totalTransferencia: transferencia };
  }, [reportData]);


  // --- Renderizado ---
  if (loading) {
    return <div className="text-center mt-10">Generando reporte...</div>;
  }
  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }
  if (!reportData) {
    return <div className="text-center mt-10">No hay datos que mostrar.</div>;
  }

  return (
    <div className="container mx-auto mt-10 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Corte de Caja</h1>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* --- Sección 1: Totales de Ventas (IU Pág. 32) --- */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Total de Ventas ({new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {day: 'numeric', month: 'long', year: 'numeric'})})</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-sm font-medium uppercase">Total Ventas</h3>
              <p className="mt-1 text-3xl font-semibold">${totalVentas.toFixed(2)}</p>
            </div>
            <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-sm font-medium uppercase">Efectivo</h3>
              <p className="mt-1 text-3xl font-semibold">${totalEfectivo.toFixed(2)}</p>
            </div>
            <div className="bg-purple-500 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-sm font-medium uppercase">Tarjeta</h3>
              <p className="mt-1 text-3xl font-semibold">${totalTarjeta.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-500 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-sm font-medium uppercase">Transferencia</h3>
              <p className="mt-1 text-3xl font-semibold">${totalTransferencia.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* --- Sección 2: Productos Vendidos (IU Pág. 32) --- */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Productos Vendidos Hoy</h2>
            <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cant.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.productosVendidos.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.cantidad}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- Sección 3: Stock Actual de Ingredientes (IU Pág. 33) --- */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Stock Actual de Ingredientes</h2>
            <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingrediente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Mínimo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.inventarioActual.map((ing) => (
                    <tr key={ing.nombre}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{ing.nombre}</td>
                      {/* Resalta el stock si está bajo */}
                      <td className={`px-6 py-4 text-sm font-bold ${parseFloat(ing.stockactual) <= parseFloat(ing.stockminimo) ? 'text-red-500' : 'text-green-600'}`}>
                        {parseFloat(ing.stockactual).toFixed(2)} {ing.unidadmedida}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {parseFloat(ing.stockminimo).toFixed(2)} {ing.unidadmedida}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CorteCajaPage;