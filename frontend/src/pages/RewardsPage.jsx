// src/components/RewardsPage.jsx
import React from 'react';

// Datos de ejemplo para las recompensas
const rewards = [
  {
    title: '10% de Descuento',
    description: 'Descuento del 10% en tu próxima compra',
  },
  {
    title: 'Envío Gratis',
    description: 'Envío gratuito en pedidos mayores a $50',
  },
  {
    title: 'Producto Gratis',
    description: 'Un producto gratis al acumular 100 puntos',
  },
  {
    title: '20% de Descuento',
    description: 'Descuento del 20% en tu cumpleaños',
  },
  {
    title: '2x1 en Pasteles',
    description: 'Compra un pastel y lleva otro gratis',
  },
  {
    title: 'Café Gratis',
    description: 'Café gratis con cualquier compra',
  },
];

function RewardsPage() {
  return (
    <div className="container mx-auto mt-10 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-5xl mx-auto">
        
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Recompensas Disponibles
        </h1>
        
        {/* Cuadrícula de recompensas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward, index) => (
            <div 
              key={index}
              className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <h2 className="text-xl font-semibold text-pink-600 mb-2">
                {reward.title}
              </h2>
              <p className="text-gray-600">
                {reward.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default RewardsPage;