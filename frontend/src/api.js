import axios from 'axios';

// Creamos una instancia de axios que apunta a nuestro backend
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api' // La URL base de tu backend
});

export default apiClient;