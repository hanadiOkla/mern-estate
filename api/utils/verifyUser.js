import { errorHandler } from "./error.js";
import jwt from 'jsonwebtoken';

export const verifyToken = ( req , res , next ) => {
    // 👈 قراءة التوكن من الهيدر (Bearer Token) أو من الكوكيز كخيار احتياطي
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.split(' ')[1]) || req.cookies.access_token;
    
    console.log("Access Token Found in Middleware:", token ? "Yes" : "No");

    if( !token ) return next(errorHandler(401 , 'Unauthorized'));

    jwt.verify(token , process.env.JWT_SECRET , ( err , user ) => {
        if(err) return next(errorHandler(403 , 'Forbidden'));
        req.user = user;
        next();
    });
}