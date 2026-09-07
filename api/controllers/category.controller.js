import Category from '../models/category.js';
import Listing from '../models/listing.model.js';
// الحصول على كل التصنيفات النشطة
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).select('-__v');
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

// الحصول على كل التصنيفات (نشطة وغير نشطة) لأغراض لوحة الإدارة
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().select('-__v');
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

// الحصول على تصنيف معين عن طريق الـ slug أو ID
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

// 1. إضافة فئة جديدة
export const createCategory = async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    
    // توليد slug تلقائي إذا لم يُرسل
    const categorySlug = slug || (typeof name === 'object' ? name.en : name)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newCategory = new Category({
      name,
      slug: categorySlug,
    });

    await newCategory.save();
    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    next(error);
  }
};

// 2. تبديل حالة الفئة (Active / Inactive)
export const toggleCategoryStatus = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'الفئة غير موجودة' });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({ success: true, message: 'تم تحديث حالة الفئة بنجاح', category });
  } catch (error) {
    next(error);
  }
};

// 3. حذف الفئة (مع فحص وجود إعلانات مرتبطة)
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // فحص الإعلانات المرتبطة
    const count = await Listing.countDocuments({ category: id });
    if (count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `لا يمكن حذف الفئة لاحتوائها على (${count}) إعلان مرتبط. يمكنك تعطيلها بدلاً من ذلك.` 
      });
    }

    await Category.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'تم حذف الفئة بنجاح' });
  } catch (error) {
    next(error);
  }
};