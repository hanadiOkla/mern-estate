import express from 'express';
import { getCategories,
         getAllCategories,
         getCategoryBySlug,
         createCategory,
         toggleCategoryStatus,
         deleteCategory } from '../controllers/category.controller.js';

const router = express.Router();

router.get('/', getCategories);

// مسارات الإدارة (يمكن إضافة verifyToken/verifyAdmin middleware هنا لاحقاً)
router.get('/admin/all', getAllCategories);
router.post('/create', createCategory);
router.patch('/toggle/:id', toggleCategoryStatus);
router.delete('/:id', deleteCategory);
router.get('/:slug', getCategoryBySlug);

export default router;