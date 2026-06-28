import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js';

const cookieOptions = {
  httpOnly: true,
  secure: true,        // Required for Render (HTTPS)
  sameSite: 'none',    // Crucial for cross-domain frontend/backend
};

// Function to prevent repetition
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const { password, ...rest } = user._doc;

  res.cookie('access_token', token, cookieOptions)
     .status(statusCode)
     .json(rest);
};

// --- Controllers ---

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    // تصحيح 1: إضافة await واستخدام الدالة غير المتزامنة
    const hashPassword = await bcrypt.hash(password, 10); 
    const newUser = new User({ username, email, password: hashPassword });
    
    await newUser.save();
    res.status(201).json('User created successfully!');
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, 'User not found!'));

    // تصحيح 2: تغيير user.password إلى validUser.password وإضافة await
    const isMatch = await bcrypt.compare(password, validUser.password);
    if (!isMatch) return next(errorHandler(401, 'Wrong credentials!'));
    
    sendTokenResponse(validUser, 200, res);
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  const { email, name, photo } = req.body;
  try {
    let user = await User.findOne({ email });

    if (!user) {
      const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);
      const username = name.split(" ").join("").toLowerCase() + Math.random().toString(36).slice(-4);

      user = new User({ username, email, password: hashedPassword, avatar: photo });
      await user.save();
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    res.clearCookie('access_token', cookieOptions)
       .status(200)
       .json('User has been logged out!');
  } catch (error) {
    next(error);
  }
};