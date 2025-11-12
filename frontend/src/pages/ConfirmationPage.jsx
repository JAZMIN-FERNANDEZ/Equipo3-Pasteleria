// src/pages/ConfirmationPage.jsx

import React from 'react';
import { useParams, Link } from 'react-router-dom';

function ConfirmationPage() {
  const { orderId } = useParams(); // Lee el ID del pedido de la URL

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-10 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-green-500 mb-4">¡Pedido Recibido!</h1>
        <p className="text-gray-700 mb-6">
          Tu pedido ha sido registrado con éxito. Pasa a la caja en tienda con el siguiente número de "voucher" para pagar y recoger tu pedido.
        </p>
        
        <div className="bg-gray-50 border-dashed border-2 border-gray-300 rounded-lg p-6 mb-8">
          <p className="text-sm font-medium text-gray-500 uppercase">Tu Número de Voucher</p>
          <p className="text-5xl font-bold text-gray-900 tracking-wider">
            {orderId}
          </p>
        </div>

        <Link
          to="/"
          className="w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-md transition duration-300 hover:bg-blue-600"
        >
          Volver a la Página Principal
        </Link>
      </div>
    </div>
  );
}

export default ConfirmationPage;