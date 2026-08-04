import express from 'express';
import { deleteUser, updateUser, getUserListings, getUser } from '../controllers/user.controller.js'; // تأكدي من الاسم هنا
import { verifyToken, verifyAdmin } from '../utils/verifyUser.js';
import { 
  getUsers, 
  toggleAdminRole 
} from '../controllers/user.controller.js';
const router = express.Router();


// مسارات لوحة تحكم الأدمن
router.get('/all', verifyToken, verifyAdmin, getUsers);
router.put('/toggle-admin/:id', verifyToken, verifyAdmin, toggleAdminRole);

// 2. مسارات العمليات الفردية
router.post('/update/:id', verifyToken, updateUser); // التعديل هنا: verifyToken كـ middleware
router.delete('/delete/:id', verifyToken, deleteUser); // التعديل هنا: verifyToken كـ middleware
router.get('/listings/:id' , verifyToken, getUserListings);

router.get('/:id', verifyToken ,getUser);


export default router;