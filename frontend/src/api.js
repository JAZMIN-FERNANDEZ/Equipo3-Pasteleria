import axios from 'axios';
import toast from 'react-hot-toast'; 

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Esto "intercepta" cada petición y le añade el token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. Interceptor de Respuestas
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
(error) => {
    // 1. Intentar obtener el mensaje 'error' que enviamos desde el backend
    const mensajeBackend = error.response?.data?.error;
    
    // 2. Si no hay mensaje específico, usar uno genérico
    const mensajeAMostrar = mensajeBackend || "Ocurrió un error inesperado";

    if (error.code !== "ERR_CANCELED") {
        // 3. Mostrar el Toast con el mensaje correcto
        toast.error(mensajeAMostrar);
    }

    return Promise.reject(error);
  }
);

export default apiClient;