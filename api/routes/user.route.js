import express from 'express';
import { deleteUser, test, updateUser, getUserListings, getUser } from '../controllers/user.controller.js'; // تأكدي من الاسم هنا
import { verifyToken } from '../utils/verifyUser.js'; // تأكدي من استيراد verifyToken

const router = express.Router();

router.get('/test', test);
router.post('/update/:id', verifyToken, updateUser); // التعديل هنا: verifyToken كـ middleware
router.delete('/delete/:id', verifyToken, deleteUser); // التعديل هنا: verifyToken كـ middleware
router.get('/listings/:id' , verifyToken, getUserListings);
router.get('/:id', verifyToken ,getUser)
export default router;