import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { Bar, Line, Pie } from 'react-chartjs-2'; 
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement 
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement
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

  // --- Datos para el Gráfico 1: Top Productos (Barras) ---
  const topProductsData = {
    labels: data?.productosMasVendidos.map(p => p.nombre) || [],
    datasets: [
      {
        label: 'Unidades Vendidas',
        data: data?.productosMasVendidos.map(p => p.totalVendido) || [],
        backgroundColor: 'rgba(236, 72, 153, 0.6)', // Rosa
      },
    ],
  };

  // --- Datos para el Gráfico 2: Ventas de la Semana (Líneas) ---
  const weeklySalesData = {
    labels: data?.ventasPorDia.map(d => d.dia) || [],
    datasets: [
      {
        label: 'Ventas de la Semana ($)',
        data: data?.ventasPorDia.map(d => d.total) || [],
        fill: false,
        borderColor: 'rgba(59, 130, 246, 1)', // Azul
        tension: 0.1
      },
    ],
  };

  // --- 🛠️ NUEVO: Datos para el Gráfico 3: Tamaños (Pastel) ---
  const sizeDistributionData = {
    labels: data?.tamanosMasVendidos.map(t => t.tamano) || [],
    datasets: [
      {
        label: 'Unidades Vendidas',
        data: data?.tamanosMasVendidos.map(t => t.totalVendido) || [],
        backgroundColor: [
          'rgba(236, 72, 153, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(16, 185, 129, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // --- 🛠️ NUEVO: Datos para el Gráfico 4: Ventas por Cajero (Barras) ---
  const cashierSalesData = {
    labels: data?.ventasPorCajero.map(c => c.nombrecompleto) || [],
    datasets: [
      {
        label: 'Ventas Procesadas',
        data: data?.ventasPorCajero.map(c => c.totalVentas) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.6)', // Verde
      },
    ],
  };

  // Opciones genéricas para los gráficos
  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' }, title: { display: false } },
  };
  const pieChartOptions = {
    responsive: true,
    plugins: { legend: { position: 'right' } },
  };

  // --- Renderizado ---
  if (loading) return <div className="text-center mt-10">Cargando estadísticas...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;
  if (!data) return <div className="text-center mt-10">No hay datos que mostrar.</div>;

  return (
    <div className="container mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard de Estadísticas</h1>
      
      {/* Sección de Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Ventas del Mes" value={`$${parseFloat(data.ventasDelMes).toFixed(2)}`} />
        <KpiCard title="Pedidos Totales" value={data.pedidosTotales} />
        <KpiCard title="Clientes Nuevos (Mes)" value={data.clientesNuevos} />
        <KpiCard title="Productos Activos" value={data.productosActivos} />
      </div>

      {/* Sección de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Barras (Top Productos) */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Top 5 Productos Más Vendidos</h2>
          <Bar options={chartOptions} data={topProductsData} />
        </div>
        
        {/* Gráfico 2: Líneas (Ventas Semana) */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Ventas de la Semana</h2>
          <Line options={chartOptions} data={weeklySalesData} />
        </div>

        {/* Gráfico 3: Pastel (Tamaños) */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Tamaños Más Vendidos</h2>
          <div className="w-full h-80 flex justify-center">
            <Pie options={pieChartOptions} data={sizeDistributionData} />
          </div>
        </div>

        {/* Gráfico 4: Barras (Cajeros) */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Ventas por Cajero</h2>
          <Bar options={chartOptions} data={cashierSalesData} />
        </div>
      </div>
    </div>
  );
}

export default GestionDashboardPage;