import axios from "axios";

// TODO: Replace with your actual AWS API Gateway endpoint
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://your-api-gateway-url.amazonaws.com";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authentication if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error("Unauthorized access");
    }
    return Promise.reject(error);
  },
);

export default apiClient;
