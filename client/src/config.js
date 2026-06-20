// src/config.js

const isProduction = import.meta.env.PROD;

export const API_BASE_URL = isProduction
  ? "https://mern-estate-api-14oy.onrender.com" // رابط الباك إند الحقيقي أونلاين
  : "http://localhost:3000";                    // رابط الباك إند المحلي للمطوّر

export const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;