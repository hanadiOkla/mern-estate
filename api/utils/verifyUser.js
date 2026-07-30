import { errorHandler } from "./error.js";
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // التركيز على الكوكي فقط لضمان اتساق العمل
    const token = req.cookies.access_token;
    
    // إزالة الـ console.log لاحقاً قبل الرفع للإنتاج (Production)
    console.log("Access Token Found in Middleware:", token ? "Yes" : "No");

    if (!token) {
        return next(errorHandler(401, 'Unauthorized: No token provided'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return next(errorHandler(403, 'Forbidden: Invalid or expired token'));
        }
        
        req.user = user;
        next();
    });
};

export const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        return next(errorHandler(401, 'Unauthorized: Please log in first'));
    }

    if (req.user.role !== 'admin') {
        return next(errorHandler(403, 'Forbidden: Admin access required'));
    }

    next();
};