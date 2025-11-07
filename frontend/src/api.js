import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// === AÑADE ESTE INTERCEPTOR ===
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

export default apiClient;