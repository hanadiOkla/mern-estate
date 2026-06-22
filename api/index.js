// 1. Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// 2. External libraries
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// 3. Routers
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';

// 4. Connect to MongoDB
mongoose
  .connect(process.env.MONGO)
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.log(err));

// 5. Initialize Express
const app = express();

// Required for Render HTTPS + Cookies
app.set('trust proxy', 1);

// 6. CORS Configuration (Final & Correct)
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://mern-estate-client-xtpi.onrender.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// 7. Middlewares
app.use(express.json());
app.use(cookieParser());

// 8. Routes
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/listing', listingRouter);

// 9. Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message
  });
});

// 10. Start Server
app.listen(3000, () => {
  console.log('Server is running on port 3000!');
});
