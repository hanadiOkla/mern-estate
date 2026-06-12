// 1. تهيئة dotenv في القمة تماماً قبل استدعاء أي راوترات أو ملفات داخلية لضمان قراءة المفتاح
import dotenv from 'dotenv';
dotenv.config();

// 2. استدعاء المكتبات الخارجية الأساسية
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

// 3. استدعاء الـ Routers الخاصة بالمشروع (الآن ستقرأ الـ process.env بأمان وبدون مشاكل)
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';

// 4. الاتصال بقاعدة البيانات MongoDB
mongoose.connect(process.env.MONGO).then(() => {
    console.log('Connected to MongoDB!');
}).catch((err) => {
    console.log(err);
});

// 5. تهيئة تطبيق Express والميدل وير الأساسية
const app = express();
app.use(express.json());
app.use(cookieParser());

// 6. تسجيل المسارات (Routes)
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