// 1. تهيئة dotenv في القمة تماماً لضمان قراءة المفتاح قبل أي شيء
import dotenv from 'dotenv';
dotenv.config();

// 2. استدعاء المكتبات الخارجية الأساسية
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors'; //  استدعاء مكتبة الـ CORS

// 3. استدعاء الـ Routers الخاصة بالمشروع
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';

// 4. الاتصال بقاعدة البيانات MongoDB
mongoose.connect(process.env.MONGO).then(() => {
    console.log('Connected to MongoDB!');
}).catch((err) => {
    console.log(err);
});

// 5. تهيئة تطبيق Express
const app = express();

// 💡 تفعيل الـ CORS وإعداد النطاقات المسموحة (اللوكال والموقع الحي أونلاين)
const allowedOrigins = [
  'http://localhost:5173',                      // منفذ Vite المحلي أثناء التطوير
  'https://mern-estate-client-xtpi.onrender.com' // رابط الفرونت إند الحي الخاص بكِ على Render
];

app.use(cors({
  origin: function (origin, callback) {
    // السماح بالطلبات التي ليس لها origin (مثل أدوات فحص الـ API أو الطلبات المحلية المباشرة)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true // مهم جداً للسماح بتبادل الـ Cookies والـ Tokens أونلاين
}));

// الميدل وير الأساسية الأخرى
app.use(express.json());
app.use(cookieParser());

// 6. تسجيل المسارات (Routes) بعد تفعيل الـ CORS والميدل وير
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/listing', listingRouter);

// 7. ميدل وير معالجة الأخطاء المركزية (Global Error Handler)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error'; 
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
});

// 8. تشغيل السيرفر والاستماع للمنفذ
app.listen(3000, () => {
    console.log('Server is running on port 3000!');
});