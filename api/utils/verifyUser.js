import { errorHandler } from "./error.js";
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const verifyToken = (req, res, next) => {
    const token = req.cookies.access_token;

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

export const verifyAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return next(errorHandler(401, 'Unauthorized: Please log in first'));
        }

        // الاستعلام اللحظي المباشر من قاعدة البيانات
        const currentUser = await User.findById(req.user.id);

        if (!currentUser) {
            return next(errorHandler(404, 'User not found'));
        }

        const isAdmin = currentUser.role === 'admin' || currentUser.isAdmin === true;

        if (!isAdmin) {
            return next(errorHandler(403, 'Forbidden: Admin access required'));
        }

        req.currentUser = currentUser;
        next();
    } catch (error) {
        next(error);
    }
};