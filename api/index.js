import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// استيراد المسارات الخاصة بكِ
import authRouter from './routes/auth.route.js';
import userRouter from './routes/user.route.js';
import listingRouter from './routes/listing.route.js';

dotenv.config();

const app = express();

// 1. إعداد الـ CORS الرئيسي (يجب أن يكون أول ميدل وير بعد تعريف app)
app.use(cors({
  origin: [
    'https://mern-estate-client-xtpi.onrender.com', // رابط الفرونت إند على Render
    'http://localhost:5173'                         // لرابط التطوير المحلي لديكِ
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// 2. ميدل وير إضافي مخصص لحل دراما الـ Preflight (OPTIONS) بنسبة 100%
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://mern-estate-client-xtpi.onrender.com',
    'http://localhost:5173'
  ];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

  // إذا كان الطلب من نوع OPTIONS، نرد عليه فوراً بـ 200 بدون أن نتركه يمر للمسارات
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(cookieParser());

// المسارات (Routes)
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/listing', listingRouter);

// ميدل وير معالجة الأخطاء
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// تشغيل السيرفر على البورت المحدد من Render أو 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});