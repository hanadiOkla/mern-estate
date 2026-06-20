import axios from 'axios';

// الطريقة الاحترافية: فحص البيئة تلقائياً
// إذا كان الموقع يعمل على المتصفح بمسار localhost، سيأخذ الرابط المحلي، وإلا سيأخذ رابط Render
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const BASE_URL = isLocalhost 
  ? 'http://localhost:3000' 
  : (import.meta.env.VITE_API_BASE_URL || 'https://mern-estate-api-l4oy.onrender.com');

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // مهم جداً إذا كنتِ تستخدمين JWT Cookies للـ Authentication
});

export default apiClient;