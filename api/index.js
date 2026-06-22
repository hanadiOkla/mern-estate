import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRouter from './routes/auth.route.js';
import userRouter from './routes/user.route.js';
import listingRouter from './routes/listing.route.js';

dotenv.config();

mongoose
  .connect(process.env.MONGO)
  .then(() => console.log('Connected to MongoDB successfully! 🎉'))
  .catch((err) => console.error('Database connection error ❌:', err.message));

const app = express();

// إعداد CORS بسيط وشامل
app.use(cors({
  origin: true, // يسمح بـ 'true' أي مصدر للطلب (Local أو Server)
  credentials: true, // ضروري لنقل الكوكيز والـ Tokens
}));

app.use(express.json());
app.use(cookieParser());

// المسارات (Routes)
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/listing', listingRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});