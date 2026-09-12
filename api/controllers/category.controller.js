import Category from '../models/category.model.js';
import Listing from '../models/listing.model.js';
import { buildCategoryTree } from '../utils/categoryTree.js';

// الحصول على كل التصنيفات النشطة (قائمة مسطّحة)
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

// الحصول على شجرة التصنيفات كاملة (nested tree) بدلاً من قائمة مسطّحة
// ?all=true تُرجع التصنيفات المعطّلة أيضاً (لأغراض لوحة الإدارة)
export const getCategoryTree = async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const categories = await Category.find(filter).select('-__v').sort({ createdAt: 1 });
    const tree = buildCategoryTree(categories);
    res.status(200).json(tree);
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

// 1. إضافة فئة جديدة (مع إمكانية تحديد parentId لإنشاء فئة فرعية)
export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, parentId, icon, attributes } = req.body;

    // توليد slug تلقائي إذا لم يُرسل
    const categorySlug = slug || (typeof name === 'object' ? name.en : name)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (parentId) {
      const parentExists = await Category.findById(parentId);
      if (!parentExists) {
        return res.status(400).json({ success: false, message: 'الفئة الأب غير موجودة' });
      }
    }

    const newCategory = new Category({
      name,
      slug: categorySlug,
      parentId: parentId || null,
      icon,
      attributes,
    });

    await newCategory.save();
    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    if (error.name === 'ValidationError' || /مرجعية دائرية|أباً لنفسها|الفئة الأب غير موجودة/.test(error.message)) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// تحديث فئة موجودة (الاسم، الأيقونة، أو نقلها تحت أب آخر)
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'الفئة غير موجودة' });
    }

    const { name, slug, icon, isActive, attributes, parentId } = req.body;

    if (parentId !== undefined) {
      const nextParentId = parentId || null;
      if (nextParentId && String(nextParentId) === String(id)) {
        return res.status(400).json({ success: false, message: 'لا يمكن أن تكون الفئة أباً لنفسها' });
      }
      if (nextParentId) {
        const isOwnDescendant = await Category.exists({ _id: nextParentId, ancestors: id });
        if (isOwnDescendant) {
          return res.status(400).json({ success: false, message: 'لا يمكن اختيار فئة فرعية كأب (مرجعية دائرية)' });
        }
      }
      category.parentId = nextParentId;
    }

    if (name !== undefined) category.name = name;
    if (slug !== undefined) category.slug = slug;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;
    if (attributes !== undefined) category.attributes = attributes;

    const parentChanged = category.isModified('parentId');
    await category.save();

    // عند نقل فئة إلى أب مختلف، يجب تحديث سلسلة الأجداد لكل فروعها الحالية
    if (parentChanged) {
      await propagateAncestorsToDescendants(category);
    }

    res.status(200).json({ success: true, category });
  } catch (error) {
    if (error.name === 'ValidationError' || /مرجعية دائرية|أباً لنفسها|الفئة الأب غير موجودة/.test(error.message)) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// تحديث سلسلة الأجداد (ancestors) لكل فروع فئة تم نقلها، طبقة بعد طبقة (BFS)
async function propagateAncestorsToDescendants(category) {
  let currentLevel = [category];

  while (currentLevel.length > 0) {
    const parentIds = currentLevel.map((cat) => cat._id);
    const children = await Category.find({ parentId: { $in: parentIds } });
    if (children.length === 0) break;

    const parentById = new Map(currentLevel.map((cat) => [String(cat._id), cat]));
    for (const child of children) {
      const parent = parentById.get(String(child.parentId));
      child.ancestors = [...parent.ancestors, parent._id];
      await child.save({ validateModifiedOnly: true });
    }

    currentLevel = children;
  }
}

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

// 3. حذف الفئة وكل فروعها الفرعية (مع فحص وجود إعلانات مرتبطة بأي منها)
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'الفئة غير موجودة' });
    }

    // كل الفروع الفرعية (على أي عمق) موجودة مسبقاً في حقل ancestors، دون الحاجة لاستعلام تكراري
    const descendants = await Category.find({ ancestors: id }).select('_id');
    const subtreeIds = [id, ...descendants.map((doc) => doc._id.toString())];

    // فحص الإعلانات المرتبطة بالفئة نفسها أو بأي من فروعها
    const count = await Listing.countDocuments({ category: { $in: subtreeIds } });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `لا يمكن حذف الفئة أو إحدى فئاتها الفرعية لاحتوائها على (${count}) إعلان مرتبط. يمكنك تعطيلها بدلاً من ذلك.`
      });
    }

    await Category.deleteMany({ _id: { $in: subtreeIds } });
    res.status(200).json({
      success: true,
      message: descendants.length > 0
        ? `تم حذف الفئة و (${descendants.length}) فئة فرعية بنجاح`
        : 'تم حذف الفئة بنجاح'
    });
  } catch (error) {
    next(error);
  }
};