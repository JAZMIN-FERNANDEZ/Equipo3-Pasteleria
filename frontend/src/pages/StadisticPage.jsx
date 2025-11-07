import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { Bar } from 'react-chartjs-2'; // Importamos el gráfico de barras
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Registramos los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- Componente de Tarjeta (KPI Card) ---
function KpiCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
      <h3 className="text-sm font-medium text-gray-500 uppercase">{title}</h3>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

// --- Componente Principal de la Página ---
function GestionDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Carga de Datos del Dashboard ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/admin/dashboard');
        setData(response.data);
      } catch (err) {
        console.error("Error al cargar dashboard:", err);
        setError(err.response?.data?.error || "No se pudo cargar el dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // --- Datos y Opciones para el Gráfico de Barras ---
  const chartData = {
    labels: data?.productosMasVendidos.map(p => p.nombre) || [],
    datasets: [
      {
        label: 'Unidades Vendidas',
        data: data?.productosMasVendidos.map(p => p.totalVendido) || [],
        backgroundColor: 'rgba(236, 72, 153, 0.6)', // Un color rosa
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
  };

  // --- Renderizado ---
  if (loading) {
    return <div className="text-center mt-10">Cargando estadísticas...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }

  if (!data) {
    return <div className="text-center mt-10">No hay datos que mostrar.</div>;
  }

  return (
    <div className="container mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard de Estadísticas</h1>
      
      {/* Sección de Tarjetas KPI (Página 25) [cite: 785, 795, 797, 798] */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Ventas del Mes" value={`$${parseFloat(data.ventasDelMes).toFixed(2)}`} />
        <KpiCard title="Pedidos Totales" value={data.pedidosTotales} />
        <KpiCard title="Clientes Nuevos (Mes)" value={data.clientesNuevos} />
        <KpiCard title="Productos Activos" value={data.productosActivos} />
      </div>

      {/* Sección de Gráficos (Página 25) [cite: 801, 803] */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Productos Más Vendidos</h2>
          <Bar options={chartOptions} data={chartData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-center">
          <h2 className="text-xl font-semibold text-gray-700">
            (Aquí iría el Gráfico de Ventas por Mes)
          </h2>
        </div>
      </div>
    </div>
  );
}

export default GestionDashboardPage;