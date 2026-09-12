import express from 'express';
import { getCategories,
         getAllCategories,
         getCategoryTree,
         getCategoryBySlug,
         createCategory,
         updateCategory,
         toggleCategoryStatus,
         deleteCategory } from '../controllers/category.controller.js';

const router = express.Router();

router.get('/', getCategories);
// شجرة التصنيفات المتداخلة (?all=true لتضمين المعطّلة أيضاً) - يجب أن يسبق ':slug'
router.get('/tree', getCategoryTree);

// مسارات الإدارة (يمكن إضافة verifyToken/verifyAdmin middleware هنا لاحقاً)
router.get('/admin/all', getAllCategories);
router.post('/create', createCategory);
router.patch('/toggle/:id', toggleCategoryStatus);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.get('/:slug', getCategoryBySlug);

export default router;