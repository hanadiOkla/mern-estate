import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

// استيراد المسارات الخاصة بكِ
import authRouter from './routes/auth.route.js';
import userRouter from './routes/user.route.js';
import listingRouter from './routes/listing.route.js';

// تهيئة متغيرات البيئة بشكل مباشر
dotenv.config();

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log('Connected to MongoDB successfully! 🎉');
  })
  .catch((err) => {
    console.error('Database connection error ❌:', err.message);
  });

const app = express();

// إعداد الـ CORS بشكل احترافي وموحد (يغنيكِ عن الميدل وير اليدوي)
const allowedOrigins = [
  'https://mern-estate-client-xtpi.onrender.com',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // السماح بالطلبات التي لا تحتوي على origin (مثل Postman أو السيرفرات الداخلية)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// إعداد الـ Preflight (OPTIONS) للتعامل مع المتصفحات
app.options('*', cors());

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

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} and listening globally!`);
});